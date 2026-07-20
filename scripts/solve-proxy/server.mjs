/**
 * Dogfood solve proxy — Vision OCR + arithmetic / verbal steps.
 * Used when Firebase Functions triggers/callables are blocked (org policy).
 *
 * Start: node scripts/solve-proxy/server.mjs
 * Needs: GOOGLE_CLOUD_VISION_API_KEY
 */
import http from 'node:http';
import { evaluateExpression, buildStepsFromEval } from './arithSolve.mjs';
import { classifyOcr, topicIdFor } from './classifyOcr.mjs';
import { detectExamHint } from './examHint.mjs';
import { ocrImageBase64 } from './visionOcr.mjs';
import { tryVerbalSolve } from './verbalSolve.mjs';

const PORT = Number(process.env.SOLVE_PROXY_PORT || 8787);
const MAX_BYTES = 6 * 1024 * 1024;

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
    debugOcrPreview: ocrText.slice(0, 240),
    classification: {
      subject: classification.subject,
      topicKey: classification.topicKey,
      confidence: classification.confidence,
      needsConfirm: classification.needsConfirm,
      score: classification.score,
      alternatives: classification.alternatives,
    },
  };
  if (answer?.text) {
    payload.answer = {
      text: String(answer.text),
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
  if (req.method !== 'POST' || req.url !== '/solve') {
    send(res, 404, { error: 'not_found' });
    return;
  }

  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > MAX_BYTES) {
        send(res, 413, { error: 'payload_too_large' });
        return;
      }
      chunks.push(chunk);
    }
    const raw = Buffer.concat(chunks).toString('utf8');
    const input = JSON.parse(raw);
    let imageBase64 = typeof input.imageBase64 === 'string' ? input.imageBase64 : '';
    const imageUrl = typeof input.imageUrl === 'string' ? input.imageUrl : '';
    const mimeType = typeof input.mimeType === 'string' ? input.mimeType : 'image/jpeg';
    const examType = ['lgs', 'ygs', 'kpss', 'trafik'].includes(input.examType)
      ? input.examType
      : 'lgs';
    const requestId = typeof input.requestId === 'string' ? input.requestId : `${Date.now()}`;

    if ((!imageBase64 || imageBase64.length < 80) && imageUrl) {
      try {
        const imgRes = await fetch(imageUrl, {
          redirect: 'follow',
          headers: { 'User-Agent': 'cozbil-solve-proxy/1' },
        });
        if (!imgRes.ok) {
          send(res, 400, {
            error: 'image_fetch_failed',
            status: imgRes.status,
            message: `Görsel indirilemedi (${imgRes.status})`,
          });
          return;
        }
        const buf = Buffer.from(await imgRes.arrayBuffer());
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
      }
    }

    if (!imageBase64 || imageBase64.length < 80) {
      send(res, 400, { error: 'image_required' });
      return;
    }

    const ocrText = await ocrImageBase64(imageBase64, mimeType);
    const examHint = detectExamHint(ocrText, examType);
    // Classify against profile exam; client may switch after examHint confirm.
    const classified = classifyOcr(ocrText, examType);
    const topicId = topicIdFor(examType, classified.subject, classified.topicKey);

    // Non-math first when classification is verbal — avoid false arith matches
    if (classified.subject !== 'math') {
      const verbal = tryVerbalSolve(ocrText, classified);
      if (verbal?.steps?.length) {
        send(
          res,
          200,
          solvedPayload({
            requestId,
            topicId,
            subject: classified.subject,
            steps: verbal.steps,
            ocrText,
            note:
              'Metinden okunarak çözüldü. Sonucu şıklarınla kontrol etmeni öneririz.',
            classification: classified,
            answer: verbal.answerText
              ? { text: verbal.answerText, label: verbal.answerLabel }
              : undefined,
            examHint,
          }),
        );
        return;
      }
    }

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

      send(
        res,
        200,
        solvedPayload({
          requestId,
          topicId:
            mathClass.subject === 'math'
              ? topicIdFor(examType, 'math', mathClass.topicKey || 'temel')
              : topicId,
          subject: 'math',
          steps: mathSteps,
          ocrText,
          classification: mathClass,
          answer: mathAnswer,
          examHint,
        }),
      );
      return;
    }

    console.warn(
      'solve-proxy unsupported_type',
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
      debugOcrPreview: ocrText.slice(0, 240),
      detectedSubject: classified.subject,
      topicId,
      examHint,
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
    send(res, 500, {
      error: 'internal',
      message: err instanceof Error ? err.message : 'unknown',
    });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`cozbil-solve-proxy listening on :${PORT}`);
});
