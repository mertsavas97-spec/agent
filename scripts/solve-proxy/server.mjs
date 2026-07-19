/**
 * Dogfood solve proxy — Vision OCR + deterministic arithmetic steps.
 * Used when Firebase Functions triggers/callables are blocked (org policy).
 *
 * Start: node scripts/solve-proxy/server.mjs
 * Needs: GOOGLE_CLOUD_VISION_API_KEY
 */
import http from 'node:http';
import { evaluateExpression, buildStepsFromEval } from './arithSolve.mjs';
import { ocrImageBase64 } from './visionOcr.mjs';
import { pickTopicId } from './topicPick.mjs';

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
    const examType = ['lgs', 'ygs', 'kpss'].includes(input.examType) ? input.examType : 'lgs';
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
    const evaluated = evaluateExpression(ocrText);
    if (!evaluated) {
      send(res, 200, {
        status: 'unsupported_type',
        attemptId: `proxy-${requestId}`,
        userMessage:
          'Bu görseldeki işlem şu an otomatik çözülemedi. Daha net bir kadraj dene veya canlı AI deploy’unu bekle.',
        quota: { remainingToday: 5, unlimited: false },
      });
      return;
    }

    const topicId = pickTopicId(examType, ocrText, evaluated);
    const steps = buildStepsFromEval(evaluated);

    send(res, 200, {
      status: 'solved',
      attemptId: `proxy-${requestId}`,
      solutionId: `proxy-sol-${requestId}`,
      cached: false,
      topicId,
      subject: 'math',
      steps,
      transparencyNote:
        'Görselden okuyup adım adım çözüldü. Sonucu kontrol etmeni öneririz.',
      quota: { remainingToday: 5, unlimited: false },
      debugOcrPreview: ocrText.slice(0, 240),
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
