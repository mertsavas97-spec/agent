/**
 * Dogfood solve proxy — Vision OCR + arithmetic / verbal steps.
 * Used when Firebase Functions triggers/callables are blocked (org policy).
 *
 * Start: node scripts/solve-proxy/server.mjs
 * Needs: GOOGLE_CLOUD_VISION_API_KEY
 */
import http from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { evaluateExpression, buildStepsFromEval } from './arithSolve.mjs';
import { classifyOcr, topicIdFor, applySubjectHint } from './classifyOcr.mjs';
import { detectExamHint } from './examHint.mjs';
import {
  assertPipelineIsolation,
  mayRunMathSolver,
  normalizeExamType,
  resolveSolveExam,
} from './examPipeline.mjs';
import { ocrImageBase64, isGarbageOcrText } from './visionOcr.mjs';
import { tryVerbalSolve } from './verbalSolve.mjs';
import {
  allowedImageUrl,
  allowedRedirectUrl,
  MAX_REMOTE_IMAGE_BYTES,
  readBodyLimited,
  REMOTE_IMAGE_TIMEOUT_MS,
} from './remoteImagePolicy.mjs';

const PORT = Number(process.env.SOLVE_PROXY_PORT || 8787);
const MAX_BYTES = 6 * 1024 * 1024;
const DOGFOOD_ENABLED = process.env.COZBIL_PROXY_DOGFOOD === '1';
const DOGFOOD_TOKEN = process.env.COZBIL_PROXY_TOKEN || '';
const ALLOW_LOOPBACK_IMAGES =
  process.env.COZBIL_PROXY_ALLOW_LOOPBACK_IMAGES === '1';
const MAX_CONCURRENT_SOLVES = 3;
const MAX_SOLVES_PER_MINUTE = 30;
let activeSolves = 0;
let recentSolveStarts = [];

function validProxyToken(req) {
  const provided = String(req.headers['x-cozbil-proxy-token'] || '');
  if (!DOGFOOD_TOKEN || provided.length !== DOGFOOD_TOKEN.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(DOGFOOD_TOKEN));
}

function send(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  res.end(json);
}

async function readIncomingLimited(req, maxBytes) {
  const declared = Number(req.headers['content-length'] || 0);
  if (declared > maxBytes) throw new Error('payload_too_large');
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new Error('payload_too_large');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, size);
}

async function fetchAllowedRemoteImage(rawUrl, signal) {
  let current = allowedImageUrl(rawUrl, {
    allowLoopback: ALLOW_LOOPBACK_IMAGES,
  });
  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    const response = await fetch(current, {
      redirect: 'manual',
      headers: { 'User-Agent': 'cozbil-solve-proxy/1' },
      signal,
    });
    if (response.status < 300 || response.status >= 400) return response;
    const location = response.headers.get('location');
    if (!location) throw new Error('image_redirect_missing');
    current = allowedRedirectUrl(current, location, {
      allowLoopback: ALLOW_LOOPBACK_IMAGES,
    });
  }
  throw new Error('image_redirect_limit');
}

function solvedPayload({
  requestId,
  topicId,
  subject,
  steps,
  ocrText,
  note,
  classification,
  answer,
  examHint,
}) {
  const payload = {
    status: 'solved',
    attemptId: `proxy-${requestId}`,
    solutionId: `proxy-sol-${requestId}`,
    cached: false,
    topicId,
    subject,
    steps,
    transparencyNote:
      note ||
      'Görselden okuyup adım adım çözüldü. Sonucu kontrol etmeni öneririz.',
    quota: { remainingToday: 5, unlimited: false },
    debugOcrPreview: ocrText.slice(0, 2048),
    classification: {
      subject: classification.subject,
      topicKey: classification.topicKey,
      confidence: classification.confidence,
      needsConfirm: classification.needsConfirm,
      score: classification.score,
      alternatives: classification.alternatives,
    },
  };
  if (answer?.text || answer?.label) {
    payload.answer = {
      text: String(answer.text ?? answer.label ?? ''),
      ...(answer.label ? { label: String(answer.label) } : {}),
    };
  }
  if (examHint) {
    payload.examHint = examHint;
  }
  return payload;
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    send(res, 204, {});
    return;
  }
  if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
    send(res, 200, { ok: true, service: 'cozbil-solve-proxy' });
    return;
  }
  const isJsonSolve = req.method === 'POST' && req.url === '/solve';
  const isBinarySolve = req.method === 'POST' && req.url === '/solve-image';
  if (!isJsonSolve && !isBinarySolve) {
    send(res, 404, { error: 'not_found' });
    return;
  }
  if (!DOGFOOD_ENABLED) {
    send(res, 503, {
      error: 'dogfood_proxy_disabled',
      message:
        'Bu proxy yalnız geliştirme dogfood içindir. Canlı çözüm SafeSearch/kota korumalı Functions yolunu kullanır.',
    });
    return;
  }
  if (!DOGFOOD_TOKEN) {
    send(res, 503, { error: 'dogfood_proxy_token_missing' });
    return;
  }
  if (!validProxyToken(req)) {
    send(res, 401, { error: 'dogfood_proxy_unauthorized' });
    return;
  }
  const now = Date.now();
  recentSolveStarts = recentSolveStarts.filter((at) => now - at < 60_000);
  if (
    activeSolves >= MAX_CONCURRENT_SOLVES ||
    recentSolveStarts.length >= MAX_SOLVES_PER_MINUTE
  ) {
    send(res, 429, {
      error: 'proxy_busy',
      message: 'Dogfood çözüm servisi meşgul; biraz sonra tekrar dene.',
    });
    return;
  }
  activeSolves += 1;
  recentSolveStarts.push(now);

  try {
    let input;
    let imageBase64 = '';
    let imageUrl = '';
    let mimeType = 'image/jpeg';
    if (isBinarySolve) {
      const rawType = String(req.headers['content-type'] || '')
        .toLowerCase()
        .split(';')[0]
        .trim();
      // RN may send empty Content-Type for file:// blobs — default jpeg.
      if (rawType && !rawType.startsWith('image/')) {
        send(res, 400, { error: 'image_content_type' });
        return;
      }
      const bytes = await readIncomingLimited(req, MAX_REMOTE_IMAGE_BYTES);
      if (bytes.length < 80) {
        send(res, 400, { error: 'image_empty' });
        return;
      }
      imageBase64 = bytes.toString('base64');
      mimeType =
        !rawType || rawType === 'image/jpg' ? 'image/jpeg' : rawType;
      input = {
        examType: req.headers['x-cozbil-exam-type'],
        subjectHint: req.headers['x-cozbil-subject-hint'],
        requestId: req.headers['x-cozbil-request-id'],
      };
    } else {
      const bytes = await readIncomingLimited(req, MAX_BYTES);
      const raw = bytes.toString('utf8');
      input = JSON.parse(raw);
      imageBase64 = typeof input.imageBase64 === 'string' ? input.imageBase64 : '';
      imageUrl = typeof input.imageUrl === 'string' ? input.imageUrl : '';
      mimeType = typeof input.mimeType === 'string' ? input.mimeType : 'image/jpeg';
    }
    const examType = ['lgs', 'ygs', 'kpss', 'trafik'].includes(input.examType)
      ? input.examType
      : 'lgs';
    const requestId = typeof input.requestId === 'string' ? input.requestId : `${Date.now()}`;
    const ocrTextOverride =
      typeof input.ocrText === 'string' && input.ocrText.trim().length >= 12
        ? input.ocrText.trim()
        : '';

    if ((!imageBase64 || imageBase64.length < 80) && imageUrl) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REMOTE_IMAGE_TIMEOUT_MS);
      try {
        const imgRes = await fetchAllowedRemoteImage(
          imageUrl,
          controller.signal,
        );
        if (!imgRes.ok) {
          send(res, 400, {
            error: 'image_fetch_failed',
            status: imgRes.status,
            message: `Görsel indirilemedi (${imgRes.status})`,
          });
          return;
        }
        const contentType = imgRes.headers.get('content-type') || '';
        if (!contentType.toLowerCase().startsWith('image/')) {
          send(res, 400, { error: 'image_content_type' });
          return;
        }
        const buf = await readBodyLimited(imgRes, MAX_REMOTE_IMAGE_BYTES);
        if (buf.length < 80) {
          send(res, 400, { error: 'image_empty' });
          return;
        }
        imageBase64 = buf.toString('base64');
      } catch (fetchErr) {
        send(res, 400, {
          error: 'image_fetch_failed',
          message: fetchErr instanceof Error ? fetchErr.message : 'fetch_error',
        });
        return;
      } finally {
        clearTimeout(timer);
      }
    }

    if (!ocrTextOverride && (!imageBase64 || imageBase64.length < 80)) {
      send(res, 400, { error: 'image_required' });
      return;
    }

    const ocrText = ocrTextOverride || (await ocrImageBase64(imageBase64, mimeType));
    if (ocrTextOverride) {
      console.info('ocr: client-override');
    }
    if (!ocrTextOverride && isGarbageOcrText(ocrText)) {
      console.warn(
        'solve-proxy rejected_not_question garbage_ocr',
        JSON.stringify(ocrText.slice(0, 200)),
      );
      send(res, 200, {
        status: 'rejected_not_question',
        attemptId: `proxy-${requestId}`,
        userMessage:
          'Görseldeki yazı net okunamadı. Soruyu düz, yakından ve iyi ışıkta yeniden çek; şıklar da kadrajda olsun.',
        quota: { remainingToday: 5, unlimited: false },
        debugOcrPreview: ocrText.slice(0, 2048),
      });
      return;
    }
    const profileExam = normalizeExamType(examType);
    // Hint is for the client mismatch sheet only — never switches the solve pipeline.
    const examHint = detectExamHint(ocrText, profileExam);
    const solveExam = resolveSolveExam(profileExam);
    const hintForClient = examHint;

    let classified = applySubjectHint(
      classifyOcr(ocrText, solveExam),
      input.subjectHint,
      solveExam,
      ocrText,
    );

    const topicId = topicIdFor(solveExam, classified.subject, classified.topicKey);

    // Non-math first when classification is verbal — avoid false arith matches
    if (classified.subject !== 'math') {
      const verbal = tryVerbalSolve(ocrText, classified, solveExam);
      // Require a real answer — tip-only guidance must not ship as solved
      if (verbal?.steps?.length && (verbal.answerText || verbal.answerLabel)) {
        // Solver may override branş (e.g. şaft → vehicle) within the SAME exam package
        const subject = verbal.subject || classified.subject;
        const topicKey = verbal.topicKey || classified.topicKey;
        const resolvedTopicId = topicIdFor(solveExam, subject, topicKey);
        const classification = {
          ...classified,
          subject,
          topicKey,
          confidence: verbal.subject ? 'high' : classified.confidence,
          needsConfirm: verbal.subject ? false : classified.needsConfirm,
        };
        const payload = solvedPayload({
          requestId,
          topicId: resolvedTopicId,
          subject,
          steps: verbal.steps,
          ocrText,
          note:
            'Metinden okunarak çözüldü. Sonucu şıklarınla kontrol etmeni öneririz.',
          classification,
          answer: verbal.answerText || verbal.answerLabel
            ? {
                text: verbal.answerText || String(verbal.answerLabel),
                label: verbal.answerLabel,
              }
            : undefined,
          examHint: hintForClient,
        });
        const iso = assertPipelineIsolation(payload, solveExam);
        if (!iso.ok) {
          console.warn('solve-proxy isolation reject', solveExam, iso.issues);
        } else {
          send(res, 200, payload);
          return;
        }
      }
    }

    if (mayRunMathSolver(solveExam)) {
      const evaluated = evaluateExpression(ocrText);
      if (evaluated) {
        const mathClass =
          classified.subject === 'math' || classified.subject === 'geometry'
            ? classified
            : {
                ...classified,
                subject: 'math',
                topicKey: 'temel',
                confidence: 'high',
                needsConfirm: false,
                score: Math.max(classified.score || 0, 8),
                alternatives: classified.alternatives || [],
              };
        const mathSteps = buildStepsFromEval(evaluated);
        const cevap = mathSteps.find((s) => s.title === 'Cevap');
        const mathAnswer = { text: String(evaluated.value), label: evaluated.choice };
        const choiceMatch = cevap?.body?.match(/Doğru şık:\s*([A-E])\)\s*(.+?)\./);
        if (choiceMatch) {
          mathAnswer.label = choiceMatch[1];
          mathAnswer.text = choiceMatch[2].trim();
        } else if (cevap?.body) {
          const m = cevap.body.match(/Sonuç\s+([0-9]+(?:\/[0-9]+)?)/);
          if (m) mathAnswer.text = m[1];
        }

        const payload = solvedPayload({
          requestId,
          topicId:
            mathClass.subject === 'math'
              ? topicIdFor(solveExam, 'math', mathClass.topicKey || 'temel')
              : topicId,
          subject: 'math',
          steps: mathSteps,
          ocrText,
          classification: mathClass,
          answer: mathAnswer,
          examHint: hintForClient,
        });
        const iso = assertPipelineIsolation(payload, solveExam);
        if (!iso.ok) {
          console.warn('solve-proxy isolation reject math', solveExam, iso.issues);
        } else {
          send(res, 200, payload);
          return;
        }
      }
    }

    console.warn(
      'solve-proxy unsupported_type',
      solveExam,
      classified.subject,
      JSON.stringify(ocrText.slice(0, 400)),
    );
    send(res, 200, {
      status: 'unsupported_type',
      attemptId: `proxy-${requestId}`,
      userMessage:
        classified.subject === 'turkish'
          ? 'Bu Türkçe sorusu okundu ama otomatik cevap üretilemedi. Şıkları da net görünecek şekilde yeniden dene.'
          : 'Bu görseldeki soru şu an otomatik çözülemedi. Soruyu ve şıkları daha net görünecek şekilde yeniden dene.',
      quota: { remainingToday: 5, unlimited: false },
      debugOcrPreview: ocrText.slice(0, 2048),
      detectedSubject: classified.subject,
      topicId,
      examHint: hintForClient,
      solvedExamType: solveExam,
      classification: {
        subject: classified.subject,
        topicKey: classified.topicKey,
        confidence: classified.confidence,
        needsConfirm: true,
        score: classified.score,
        alternatives: classified.alternatives,
      },
    });
  } catch (err) {
    console.error('solve-proxy error', err instanceof Error ? err.message : err);
    if (err instanceof Error && err.message === 'payload_too_large') {
      send(res, 413, { error: 'payload_too_large' });
      return;
    }
    send(res, 500, {
      error: 'internal',
      message: err instanceof Error ? err.message : 'unknown',
    });
  } finally {
    activeSolves -= 1;
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`cozbil-solve-proxy listening on :${PORT}`);
});
