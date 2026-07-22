/** OCR: Vision → preprocessed local Tesseract → Gemini fallback. */

import sharp from 'sharp';
import { createWorker, PSM } from 'tesseract.js';

let tesseractWorkerPromise = null;
let tesseractQueue = Promise.resolve();
let pendingTesseractJobs = 0;
const MAX_PENDING_TESSERACT_JOBS = 3;
const SHARP_INPUT_OPTIONS = {
  limitInputPixels: 25_000_000,
  // Phone camera buffers (progressive JPEG / odd EXIF) should not hard-fail OCR.
  failOn: 'none',
};

/** Phone photos of worksheets often produce pipe/noise OCR — reject before solve. */
export function isGarbageOcrText(text) {
  const raw = String(text || '').trim();
  if (raw.length < 12) return true;
  const compact = raw.replace(/\s+/g, '');
  if (compact.length < 10) return true;
  const letters = (raw.match(/[A-Za-zÇĞİÖŞÜçğıöşü0-9]/g) || []).length;
  const ratio = letters / Math.max(compact.length, 1);
  if (ratio < 0.28) return true;
  const pipes = (raw.match(/\|/g) || []).length;
  if (pipes >= 6 && pipes / Math.max(compact.length, 1) > 0.25) return true;
  // Phone OCR of blank frames: many short pipe/I lines, almost no words.
  const words = (raw.match(/[A-Za-zÇĞİÖŞÜçğıöşü]{3,}/g) || []).length;
  if (words < 3 && pipes + (raw.match(/[Il1\[\]]/g) || []).length >= 10) {
    return true;
  }
  return false;
}

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

async function decodeImageBuffer(input) {
  // Always re-encode so HEIC / progressive JPEG / RN odd blobs become PNG.
  // Cap width for dogfood latency — phone JPEGs were blowing the 15–20s budget.
  try {
    return await sharp(input, SHARP_INPUT_OPTIONS)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .png()
      .toBuffer();
  } catch (err) {
    throw new Error(
      `unsupported image format (${err instanceof Error ? err.message : err})`,
    );
  }
}

async function buildOcrVariant(input, { threshold } = {}) {
  const meta = await sharp(input, SHARP_INPUT_OPTIONS).metadata();
  const sourceWidth = meta.width || 1200;
  const targetWidth = Math.min(1800, Math.max(1200, sourceWidth));
  let pipeline = sharp(input, SHARP_INPUT_OPTIONS)
    .rotate()
    .grayscale()
    .normalize()
    .resize({ width: targetWidth, kernel: 'lanczos3', withoutEnlargement: false })
    .sharpen({ sigma: 1 });
  if (typeof threshold === 'number') {
    pipeline = pipeline.threshold(threshold);
  }
  return pipeline.png().toBuffer();
}

async function recognizeBuffer(worker, preprocessed, psm) {
  await worker.setParameters({
    tessedit_pageseg_mode: psm,
    tessedit_char_whitelist: '',
    preserve_interword_spaces: '1',
    user_defined_dpi: '300',
  });
  const {
    data: { text },
  } = await worker.recognize(preprocessed);
  return String(text || '').trim();
}

function scoreOcrCandidate(text) {
  if (!text || isGarbageOcrText(text)) return -1;
  let score = Math.min(text.length, 2000);
  // Prefer worksheets that still include A)–E) choices — soft passes often clip them.
  if (/A\s*\)[\s\S]{0,80}B\s*\)/i.test(text)) score += 800;
  if (/C\s*\)[\s\S]{0,80}D\s*\)/i.test(text)) score += 200;
  const pctCount = (text.match(/%\s*\d{1,3}/g) || []).length;
  score += pctCount * 450;
  if (/%\d+|kesir|denklem|kaçtır|hangisidir|yüzde/i.test(text)) score += 80;
  return score;
}

function looksLikeBrokenEquation(text) {
  if (!/denklem|sağlayan|x\s*değeri|hangisidir/i.test(text)) return false;
  // Usable linear forms usually keep an explicit "+" near x or "=".
  return !/\+\s*\d|\d\s*\+|=\s*\d*[xX]|[xX]\s*\+/.test(text);
}

function isGoodEnoughOcr(text, score) {
  if (score < 400) return false;
  if (looksLikeBrokenEquation(text)) return false;
  const hasChoices = /A\s*\)\s*\S+/i.test(text) && /B\s*\)\s*\S+/i.test(text);
  const pctCount = (text.match(/%\s*\d{1,3}/g) || []).length;
  if (hasChoices && (pctCount >= 1 || text.length >= 80)) return true;
  if (hasChoices && score >= 900) return true;
  return false;
}

/** Common phone/Tesseract mangling of %20 / %25 in yüzde questions. */
export function repairPercentOcr(text) {
  let t = String(text || '');
  t = t.replace(/\b0(\d{1,2})(\s+(?:artır|azalt))/gi, '%$1$2');
  t = t.replace(/\b[6gG](\d{2})(\s+artır)/gi, '%$1$2');
  t = t.replace(/\b94[,.]?25(\s+azalt)/gi, '%25$1');
  t = t.replace(/\b9425(\s+azalt)/gi, '%25$1');
  if (/yüzde|yuzde/i.test(t)) {
    t = t.replace(/\bönce\s+(\d{1,2})\s+(artır)/gi, 'önce %$1 $2');
    t = t.replace(/\bsonra\s+(\d{1,2})\s+(azalt)/gi, 'sonra %$1 $2');
  }
  return t;
}

/** Phone OCR often drops "+" in linear equations (3(x-2)+4=2x+7). */
export function repairEquationOcr(text) {
  let t = String(text || '');
  t = t.replace(/[—–−]/g, '-');
  // C) misread as 0)
  t = t.replace(/(^|\n)\s*0\)\s*/g, '$1C) ');
  // 3(x-2)4 4 = → 3(x-2)+4=
  t = t.replace(/\)(\d)\s+(\d)\s*=/g, ')+$2=');
  t = t.replace(/\)(\d)=/g, ')+$1=');
  // 2x4 7 → 2x+7
  t = t.replace(/([0-9])([xX])(\d)\s+(\d)\b/g, '$1$2+$4');
  t = t.replace(/([xX])(\d)\s+(\d)\b/g, '$1+$3');
  return t;
}

function repairOcrText(text) {
  return repairEquationOcr(repairPercentOcr(text));
}

function extractChoicesBlock(text) {
  const match = String(text || '').match(/\n\s*A\s*\)[\s\S]*$/i);
  return match ? match[0] : '';
}

function mergeBestCandidate(candidates) {
  let best = '';
  let bestScore = -1;
  for (const text of candidates) {
    const score = scoreOcrCandidate(text);
    if (score > bestScore) {
      best = text;
      bestScore = score;
    }
  }
  if (best && !/A\s*\)\s*\S+/i.test(best)) {
    const donor = candidates.find((t) => /A\s*\)\s*\S+/i.test(t));
    const block = extractChoicesBlock(donor || '');
    if (block) {
      best = `${best.trim()}${block}`;
      bestScore = scoreOcrCandidate(best);
    }
  }
  return { best, bestScore };
}

async function ocrViaTesseract(cleaned, mimeType) {
  if (pendingTesseractJobs >= MAX_PENDING_TESSERACT_JOBS) {
    throw new Error('OCR_BUSY — çok fazla eşzamanlı istek');
  }
  pendingTesseractJobs += 1;
  const run = tesseractQueue.then(async () => {
    const worker = await getTesseractWorker();
    const raw = Buffer.from(cleaned, 'base64');
    const input = await decodeImageBuffer(raw);

    // Fast ordered passes — early-exit when choices + stem look usable.
    // Full 3×2 grid was blowing the client abort budget on phone photos.
    const passPlan = [
      { threshold: 180, psm: PSM.AUTO },
      { threshold: undefined, psm: PSM.AUTO },
      { threshold: 180, psm: PSM.SPARSE_TEXT },
      { threshold: 160, psm: PSM.SPARSE_TEXT },
    ];

    const candidates = [];
    let best = '';
    let bestScore = -1;
    const variantCache = new Map();

    for (const pass of passPlan) {
      const cacheKey = String(pass.threshold ?? 'soft');
      if (!variantCache.has(cacheKey)) {
        variantCache.set(
          cacheKey,
          await buildOcrVariant(input, { threshold: pass.threshold }),
        );
      }
      const variant = variantCache.get(cacheKey);
      const text = repairOcrText(await recognizeBuffer(worker, variant, pass.psm));
      if (text) candidates.push(text);
      ({ best, bestScore } = mergeBestCandidate(candidates));
      if (isGoodEnoughOcr(best, bestScore)) break;
    }

    let result = bestScore >= 0 ? best : '';

    // Tesseract normally drops vertically stacked fraction digits. Recover
    // numerator/denominator around isolated fraction bars and inject tokens
    // before choices so the arithmetic solver receives 3/8, 1/3, etc.
    if (result && looksLikeFractionNarrative(result)) {
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
    if (viaTess && !isGarbageOcrText(viaTess)) {
      console.info('ocr: tesseract');
      return viaTess;
    }
    if (viaTess) {
      errors.push('tesseract: garbage_ocr');
      console.warn('tesseract OCR garbage', viaTess.slice(0, 120).replace(/\s+/g, ' '));
    } else {
      errors.push('tesseract: empty');
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
