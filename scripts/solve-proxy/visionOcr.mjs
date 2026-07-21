/** OCR: Vision → preprocessed local Tesseract → Gemini fallback. */

import sharp from 'sharp';
import { createWorker, PSM } from 'tesseract.js';

let tesseractWorkerPromise = null;
let tesseractQueue = Promise.resolve();
let pendingTesseractJobs = 0;
const MAX_PENDING_TESSERACT_JOBS = 3;
const SHARP_INPUT_OPTIONS = {
  limitInputPixels: 25_000_000,
  failOn: 'error',
};

async function fetchWithTimeout(url, init, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

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

/** Test/process shutdown helper; the long-running proxy keeps the worker warm. */
export async function closeOcrWorker() {
  const pending = tesseractWorkerPromise;
  tesseractWorkerPromise = null;
  tesseractQueue = Promise.resolve();
  if (pending) {
    const worker = await pending;
    await worker.terminate();
  }
}

async function ocrViaVision(cleaned) {
  const key = process.env.GOOGLE_CLOUD_VISION_API_KEY?.trim();
  if (!key) return null;

  const url = `https://vision.googleapis.com/v1/images:annotate?key=${key}`;
  const res = await fetchWithTimeout(url, {
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
  }, 12_000);
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
  const res = await fetchWithTimeout(url, {
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
  }, 20_000);
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
  if (pendingTesseractJobs >= MAX_PENDING_TESSERACT_JOBS) {
    throw new Error('OCR_BUSY — çok fazla eşzamanlı istek');
  }
  pendingTesseractJobs += 1;
  const run = tesseractQueue.then(async () => {
    const worker = await getTesseractWorker();
    const input = Buffer.from(cleaned, 'base64');
    const meta = await sharp(input, SHARP_INPUT_OPTIONS).metadata();
    const sourceWidth = meta.width || 1200;
    const targetWidth = Math.min(2000, Math.max(sourceWidth, sourceWidth * 2));
    const preprocessed = await sharp(input, SHARP_INPUT_OPTIONS)
      .grayscale()
      .normalize()
      .resize({ width: targetWidth, kernel: 'lanczos3', withoutEnlargement: false })
      .sharpen({ sigma: 1 })
      .threshold(180)
      .png()
      .toBuffer();

    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SPARSE_TEXT,
      tessedit_char_whitelist: '',
      preserve_interword_spaces: '1',
      user_defined_dpi: '300',
    });
    const {
      data: { text },
    } = await worker.recognize(preprocessed);
    let result = String(text || '').trim();

    // Tesseract normally drops vertically stacked fraction digits. Recover
    // numerator/denominator around isolated fraction bars and inject tokens
    // before choices so the arithmetic solver receives 3/8, 1/3, etc.
    if (looksLikeFractionNarrative(result)) {
      const fractions = await extractStackedFractions(input, worker);
      if (fractions.length > 0) {
        result = injectBeforeChoices(result, `OCR_KESIRLER: ${fractions.join(' ')}`);
      }
    }

    // Leave the shared worker in text mode for the next request.
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SPARSE_TEXT,
      tessedit_char_whitelist: '',
    });
    return result || null;
  }).finally(() => {
    pendingTesseractJobs -= 1;
  });

  tesseractQueue = run.catch(() => undefined);
  return run;
}

function looksLikeFractionNarrative(text) {
  return (
    /öğrenci|kesir|oran|pay|payda/i.test(text) &&
    /['’][iıuü]|kızdır|erkektir/i.test(text)
  );
}

function injectBeforeChoices(text, extra) {
  const match = text.match(/\n\s*A\)\s*/i);
  if (!match || match.index == null) return `${text}\n${extra}`;
  return `${text.slice(0, match.index)}\n${extra}${text.slice(match.index)}`;
}

async function extractStackedFractions(input, worker) {
  const { data, info } = await sharp(input, SHARP_INPUT_OPTIONS)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const minRun = Math.max(20, Math.round(width * 0.035));
  const maxRun = Math.max(minRun + 1, Math.round(width * 0.085));
  const runs = [];

  for (let y = 0; y < height; y += 1) {
    let x = 0;
    while (x < width) {
      while (x < width && data[y * width + x] > 90) x += 1;
      const start = x;
      while (x < width && data[y * width + x] <= 90) x += 1;
      const length = x - start;
      if (length >= minRun && length <= maxRun) {
        runs.push({ x: start, y, length });
      }
    }
  }

  const groups = [];
  for (const run of runs) {
    const group = groups.find(
      (item) =>
        run.y >= item.lastY &&
        run.y - item.lastY <= 2 &&
        Math.abs(item.x - run.x) <= 2 &&
        Math.abs(item.length - run.length) <= 4,
    );
    if (group) {
      group.rows.push(run);
      group.lastY = run.y;
      group.x = Math.round((group.x + run.x) / 2);
      group.length = Math.max(group.length, run.length);
    } else {
      groups.push({
        x: run.x,
        length: run.length,
        rows: [run],
        lastY: run.y,
      });
    }
  }

  const candidates = groups
    .filter((group) => {
      const y = group.rows[0].y;
      return (
        group.rows.length >= 2 &&
        group.rows.length <= 6 &&
        y >= height * 0.15 &&
        y <= height * 0.65 &&
        group.x >= width * 0.1
      );
    })
    .sort((a, b) => a.rows[0].y - b.rows[0].y);

  const fractions = [];
  for (const bar of candidates) {
    const y = bar.rows[0].y;
    const pad = Math.max(4, Math.round(bar.length * 0.1));
    const left = Math.max(0, bar.x - pad);
    const cropWidth = Math.min(width - left, bar.length + pad * 2);
    const halfHeight = Math.max(28, Math.round(bar.length * 1.05));
    const numerator = await recognizeFractionDigit({
      input,
      worker,
      left,
      top: Math.max(0, y - halfHeight),
      width: cropWidth,
      height: Math.min(halfHeight - 4, y),
    });
    const denominatorTop = Math.min(height - 1, bar.lastY + 4);
    const denominator = await recognizeFractionDigit({
      input,
      worker,
      left,
      top: denominatorTop,
      width: cropWidth,
      height: Math.min(halfHeight, height - denominatorTop),
    });
    if (numerator && denominator && denominator !== '0') {
      const token = `${numerator}/${denominator}`;
      if (!fractions.includes(token)) fractions.push(token);
    }
  }
  return fractions.slice(0, 4);
}

async function recognizeFractionDigit({ input, worker, left, top, width, height }) {
  if (width < 3 || height < 3) return null;
  const crop = await sharp(input, SHARP_INPUT_OPTIONS)
    .extract({ left, top, width, height })
    .grayscale()
    .resize({ width: Math.min(500, width * 6), kernel: 'lanczos3' })
    .threshold(190)
    .extend({ top: 20, bottom: 20, left: 20, right: 20, background: 'white' })
    .png()
    .toBuffer();
  await worker.setParameters({
    tessedit_pageseg_mode: PSM.SINGLE_CHAR,
    tessedit_char_whitelist: '0123456789',
  });
  const {
    data: { text },
  } = await worker.recognize(crop);
  const digits = String(text || '').replace(/\D/g, '');
  return /^\d{1,2}$/.test(digits) ? digits : null;
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
