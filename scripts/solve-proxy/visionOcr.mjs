/** OCR: Vision → Gemini → local Tesseract (no cloud billing required). */

import { createWorker } from 'tesseract.js';

let tesseractWorkerPromise = null;

async function getTesseractWorker() {
  if (!tesseractWorkerPromise) {
    tesseractWorkerPromise = (async () => {
      const worker = await createWorker('tur+eng', 1, {
        logger: () => {},
      });
      return worker;
    })();
  }
  return tesseractWorkerPromise;
}

async function ocrViaVision(cleaned) {
  const key = process.env.GOOGLE_CLOUD_VISION_API_KEY?.trim();
  if (!key) return null;

  const url = `https://vision.googleapis.com/v1/images:annotate?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        {
          image: { content: cleaned },
          features: [
            { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },
            { type: 'TEXT_DETECTION', maxResults: 1 },
          ],
          imageContext: { languageHints: ['tr', 'en'] },
        },
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Vision HTTP ${res.status}`);
  }
  const full =
    data?.responses?.[0]?.fullTextAnnotation?.text ||
    data?.responses?.[0]?.textAnnotations?.[0]?.description ||
    '';
  return String(full).trim() || null;
}

async function ocrViaGemini(cleaned, mimeType) {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return null;

  const model = process.env.GEMINI_OCR_MODEL?.trim() || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text:
                'Bu sınav sorusu görselindeki TÜM metni Türkçe olarak birebir çıkar. ' +
                'Soru kökü, işlemler ve A)–E) şıkları dahil. Açıklama yazma, sadece OCR metni ver.',
            },
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: cleaned,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 2048,
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Gemini OCR HTTP ${res.status}`);
  }
  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((p) => p?.text || '')
      .join('')
      .trim() || '';
  return text || null;
}

async function ocrViaTesseract(cleaned, mimeType) {
  const worker = await getTesseractWorker();
  const dataUrl = `data:${mimeType || 'image/jpeg'};base64,${cleaned}`;
  const {
    data: { text },
  } = await worker.recognize(dataUrl);
  return String(text || '').trim() || null;
}

/** Vision → Gemini → local Tesseract. */
export async function ocrImageBase64(imageBase64, mimeType = 'image/jpeg') {
  const cleaned = String(imageBase64 || '').replace(/^data:[^;]+;base64,/, '');
  if (!cleaned) throw new Error('empty image');

  const errors = [];

  try {
    const viaVision = await ocrViaVision(cleaned);
    if (viaVision) {
      console.info('ocr: vision');
      return viaVision;
    }
  } catch (err) {
    errors.push(`vision: ${err instanceof Error ? err.message : err}`);
  }

  // Local first for dogfood — Gemini/Vision billing must not block solves
  try {
    const viaTess = await ocrViaTesseract(cleaned, mimeType);
    if (viaTess) {
      console.info('ocr: tesseract');
      return viaTess;
    }
  } catch (err) {
    errors.push(`tesseract: ${err instanceof Error ? err.message : err}`);
    console.warn('tesseract OCR failed', err instanceof Error ? err.message : err);
  }

  try {
    const viaGemini = await ocrViaGemini(cleaned, mimeType);
    if (viaGemini) {
      console.info('ocr: gemini');
      return viaGemini;
    }
  } catch (err) {
    errors.push(`gemini: ${err instanceof Error ? err.message : err}`);
    console.warn('gemini OCR failed', err instanceof Error ? err.message : err);
  }

  throw new Error(
    `OCR unavailable (${errors.join(' | ') || 'no providers'}). ` +
      'Set GOOGLE_CLOUD_VISION_API_KEY / GEMINI_API_KEY or keep tesseract.js installed.',
  );
}
