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

/**
 * Reject only clearly empty / blank-frame OCR.
 * Soft phone & PC-screen photos must still proceed (ChatGPT-like tolerance).
 */
export function isGarbageOcrText(text) {
  const raw = String(text || '').trim();
  if (raw.length < 8) return true;
  const compact = raw.replace(/\s+/g, '');
  if (compact.length < 6) return true;

  const hasChoices = /A\s*\)/i.test(raw) && /B\s*\)/i.test(raw);
  const hasQuestionCue =
    /kaçtır|hangisidir|denklem|yüzde|sağlayan|aşağıdakilerden|işlemin|toplamı|sonucu|gerçel|kesir/i.test(
      raw,
    );
  // Any MCQ / exam cue ⇒ keep; solvers decide if they can answer.
  if (hasChoices || hasQuestionCue) {
    return false;
  }

  const letters = (raw.match(/[A-Za-zÇĞİÖŞÜçğıöşü0-9]/g) || []).length;
  const ratio = letters / Math.max(compact.length, 1);
  if (ratio < 0.16) return true;
  const pipes = (raw.match(/\|/g) || []).length;
  const words = (raw.match(/[A-Za-zÇĞİÖŞÜçğıöşü]{3,}/g) || []).length;
  // Blank-frame / ruler noise: many pipes, almost no real words.
  if (pipes >= 8 && pipes / Math.max(compact.length, 1) > 0.32 && words < 2) {
    return true;
  }
  if (words < 2 && pipes + (raw.match(/[Il1\[\]]/g) || []).length >= 12) {
    return true;
  }
  return false;
}

/** Weak but possibly recoverable — try Gemini/Tesseract before accepting. */
export function isWeakOcrText(text) {
  if (isGarbageOcrText(text)) return true;
  const raw = String(text || '').trim();
  const hasChoices =
    /A\s*\)\s*\S+/i.test(raw) && /B\s*\)\s*\S+/i.test(raw);
  if (hasChoices && raw.length >= 36) return false;
  if (/[0-9].*[+\-−*/÷:=^xX]|[+\-−*/÷:=^].*[0-9]/.test(raw) && raw.length >= 24) {
    return false;
  }
  return raw.length < 48;
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

/** EXIF-correct + mild enhance before Vision (helps zoom softness / monitor glare). */
async function preprocessForVision(cleaned) {
  const raw = Buffer.from(cleaned, 'base64');
  try {
    const meta = await sharp(raw, SHARP_INPUT_OPTIONS).metadata();
    const width = meta.width || 0;
    // Digital zoom crops are often soft and under 1200px wide — upscale before OCR.
    const targetWidth =
      width > 0 && width < 1100
        ? Math.min(1800, Math.round(width * 1.75))
        : Math.min(2000, Math.max(1400, width || 1400));
    // Soft / slightly blurry phone & monitor shots: lift, gentle denoise, unsharp.
    const buf = await sharp(raw, SHARP_INPUT_OPTIONS)
      .rotate()
      .normalize()
      .modulate({ brightness: 1.1 })
      .median(1)
      .sharpen({ sigma: 1.2, m1: 1.1, m2: 0.6 })
      .resize({
        width: targetWidth,
        kernel: 'lanczos3',
        withoutEnlargement: false,
      })
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer();
    return buf.toString('base64');
  } catch {
    return cleaned;
  }
}

async function ocrViaVision(cleaned) {
  const key = process.env.GOOGLE_CLOUD_VISION_API_KEY?.trim();
  if (!key) return null;

  const content = await preprocessForVision(cleaned);
  const url = `https://vision.googleapis.com/v1/images:annotate?key=${key}`;
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        {
          image: { content },
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
  const text = repairOcrText(String(full).trim());
  return text || null;
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
  // Always re-encode so HEIC / progressive JPEG / RN odd blobs become usable JPEG.
  // Small / zoomed crops are enlarged — withoutEnlargement was starving OCR.
  try {
    const meta = await sharp(input, SHARP_INPUT_OPTIONS).metadata();
    const width = meta.width || 0;
    const targetWidth =
      width > 0 && width < 1000
        ? Math.min(1600, Math.round(width * 1.8))
        : Math.min(1600, Math.max(1200, width || 1400));
    return await sharp(input, SHARP_INPUT_OPTIONS)
      .rotate()
      .resize({
        width: targetWidth,
        kernel: 'lanczos3',
        withoutEnlargement: false,
      })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();
  } catch (err) {
    throw new Error(
      `unsupported image format (${err instanceof Error ? err.message : err})`,
    );
  }
}

async function buildOcrVariant(input, { threshold, boost, screen, zoom } = {}) {
  const meta = await sharp(input, SHARP_INPUT_OPTIONS).metadata();
  const sourceWidth = meta.width || 1200;
  let targetWidth = Math.min(1600, Math.max(1100, sourceWidth));
  if (zoom) {
    // Camera digital-zoom: soft pixels — upscale then unsharp.
    targetWidth = Math.min(2200, Math.max(1600, Math.round(sourceWidth * 1.7)));
  } else if (screen) {
    targetWidth = Math.min(1800, Math.max(1300, sourceWidth));
  }
  let pipeline = sharp(input, SHARP_INPUT_OPTIONS)
    .rotate()
    .grayscale()
    .normalize();
  if (screen) {
    // PC-monitor photos: kill moiré/glare, lift contrast for dark UI themes.
    pipeline = pipeline
      .median(2)
      .modulate({ brightness: 1.2 })
      .linear(1.5, -36)
      .gamma(1.15);
  } else if (zoom) {
    pipeline = pipeline.modulate({ brightness: 1.1 }).linear(1.3, -18);
  } else if (boost) {
    // Dark phone photos of worksheets — lift midtones before thresholding.
    pipeline = pipeline.modulate({ brightness: 1.2 }).linear(1.25, -20);
  }
  pipeline = pipeline.resize({
    width: targetWidth,
    kernel: 'lanczos3',
    withoutEnlargement: false,
  });
  if (zoom) {
    pipeline = pipeline.sharpen({ sigma: 1.5, m1: 1.2, m2: 0.7 });
  } else if (!screen) {
    pipeline = pipeline.sharpen({ sigma: 1 });
  } else {
    pipeline = pipeline.sharpen({ sigma: 0.85 });
  }
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
  if (score < 220) return false;
  if (looksLikeBrokenEquation(text)) return false;
  const hasChoices = /A\s*\)\s*\S+/i.test(text) && /B\s*\)\s*\S+/i.test(text);
  const pctCount = (text.match(/%\s*\d{1,3}/g) || []).length;
  if (hasChoices && (pctCount >= 1 || text.length >= 48)) return true;
  if (hasChoices && score >= 500) return true;
  if (!isWeakOcrText(text) && score >= 350) return true;
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
    // Avoid \\b — Turkish letters break JS word boundaries (ö/ü).
    t = t.replace(/önce\s+(\d{1,2})\s+(artır)/gi, 'önce %$1 $2');
    t = t.replace(/sonra\s+(\d{1,2})\s+(azalt)/gi, 'sonra %$1 $2');
  }
  return t;
}

/** Phone OCR often drops "+" / "=" in linear equations (3(x-2)+4=2x+7). */
export function repairEquationOcr(text) {
  let t = String(text || '');
  t = t.replace(/[—–−~∼]/g, '-');
  // C) misread as 0)
  t = t.replace(/(^|\n)\s*0\)\s*/g, '$1C) ');
  // 3(x-2)4 4 = → 3(x-2)+4=
  t = t.replace(/\)(\d)\s+(\d)\s*=/g, ')+$2=');
  t = t.replace(/\)(\d)=/g, ')+$1=');
  // Camera/screen: ")44 - 2x" or ")44-2x" is often "+4 = 2x"
  t = t.replace(/\)(\d)\1\s*[-–—]\s*([0-9xX])/g, ')+$1=$2');
  t = t.replace(/\)(\d)(\d)\s*[-–—]\s*([0-9xX])/g, ')+$2=$3');
  // ")44=2x" → ")+4=2x"
  t = t.replace(/\)(\d)\1\s*=/g, ')+$1=');
  t = t.replace(/\)(\d)(\d)\s*=/g, ')+$2=');
  // Missing "=" between sides: "3(x-2)+4 2x+7" → "3(x-2)+4=2x+7"
  t = t.replace(
    /(\)[+*]?\d|\d)\s+([0-9]*[xX][^\n=]{0,24})\s*(?=denklem|sağlayan|x\s*değeri|hangisidir)/i,
    '$1=$2 ',
  );
  // 2x4 7 → 2x+7
  t = t.replace(/([0-9])([xX])(\d)\s+(\d)\b/g, '$1$2+$4');
  t = t.replace(/([xX])(\d)\s+(\d)\b/g, '$1+$3');
  // Ensure equation marker before "denklemini"
  if (/denklem/i.test(t) && /[xX]/.test(t) && !/=/.test(t.split(/denklem/i)[0] || '')) {
    t = t.replace(
      /(\)[+*]?\d+)\s*([-–—]\s*)?([0-9]*[xX][0-9+*/().\s-]*)\s*(?=denklem)/i,
      '$1=$3 ',
    );
  }
  return t;
}

/** Recover exam math OCR: missing ^ on 2x=4y, colon division, years. */
export function repairMathNotationOcr(text) {
  let t = String(text || '');
  t = t.replace(/\(20\d{2}\)/g, ' ');
  // Mixed şık: "A) 2 10/23" spacing (Vision sometimes glues "210/23")
  t = t.replace(
    /([A-E])\)\s*(\d)(\d{1,2})\s*\/\s*(\d{2,})/gi,
    (full, lab, whole, num, den) => {
      // Only split when it looks like mixed number (num < den)
      if (Number(num) < Number(den) && Number(whole) <= 20) {
        return `${lab}) ${whole} ${num}/${den}`;
      }
      return full;
    },
  );
  if (/gerçel|üslü|olduğuna göre/i.test(t)) {
    t = t.replace(/\b(\d)\s*([xyXY])\s*\+\s*(\d)\b/g, '$1^($2+$3)');
    t = t.replace(/\b(\d)\s*([xyXY])\s*=\s*(\d)\s*([xyXY])\b/g, '$1^$2=$3^$4');
  }
  // Ensure colon between fraction groups stays as division cue for the solver
  t = t.replace(/(\d)\s*\/\s*(\d)\s*:\s*\(/g, '$1/$2 : (');
  return t;
}

function repairOcrText(text) {
  return repairMathNotationOcr(repairEquationOcr(repairPercentOcr(text)));
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

    // Soft / boosted first — hard threshold blanks many phone-camera worksheets.
    // Screen pass targets glare/moiré from photographing a monitor.
    // Zoom pass upscales soft digital-zoom crops before Tesseract.
    // Keep a hard AUTO pass for % signs (KPSS yüzde).
    const passPlan = [
      { threshold: undefined, boost: false, screen: false, zoom: false, psm: PSM.AUTO },
      { threshold: undefined, boost: true, screen: false, zoom: false, psm: PSM.AUTO },
      { threshold: undefined, boost: false, screen: true, zoom: false, psm: PSM.AUTO },
      { threshold: undefined, boost: false, screen: false, zoom: true, psm: PSM.AUTO },
      { threshold: 160, boost: false, screen: true, zoom: false, psm: PSM.SPARSE_TEXT },
      { threshold: 170, boost: false, screen: false, zoom: true, psm: PSM.SPARSE_TEXT },
      { threshold: 180, boost: false, screen: false, zoom: false, psm: PSM.AUTO },
      { threshold: 180, boost: false, screen: false, zoom: false, psm: PSM.SPARSE_TEXT },
    ];

    const candidates = [];
    let best = '';
    let bestScore = -1;
    const variantCache = new Map();

    for (const pass of passPlan) {
      const cacheKey = `${pass.threshold ?? 'soft'}:${pass.boost ? 'b' : 'n'}:${pass.screen ? 's' : 'p'}:${pass.zoom ? 'z' : 'n'}`;
      if (!variantCache.has(cacheKey)) {
        variantCache.set(
          cacheKey,
          await buildOcrVariant(input, {
            threshold: pass.threshold,
            boost: pass.boost,
            screen: pass.screen,
            zoom: pass.zoom,
          }),
        );
      }
      const variant = variantCache.get(cacheKey);
      const text = repairOcrText(await recognizeBuffer(worker, variant, pass.psm));
      if (text) candidates.push(text);
      ({ best, bestScore } = mergeBestCandidate(candidates));
      if (isGoodEnoughOcr(best, bestScore)) break;
    }

    // If every pass looked like garbage, keep the longest raw text for diagnostics
    // and let the server return rejected_not_question instead of empty OCR.
    let result = bestScore >= 0 ? best : '';
    if (!result && candidates.length > 0) {
      result = candidates.reduce((a, b) => (b.length > a.length ? b : a), '');
      console.warn(
        'tesseract best was garbage; using longest candidate',
        result.slice(0, 120).replace(/\s+/g, ' '),
      );
    }
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

/**
 * Vision → Gemini (multimodal, soft photos) → Tesseract.
 * Accept soft OCR; only hard-reject blank frames.
 */
export async function ocrImageBase64(imageBase64, mimeType = 'image/jpeg') {
  const cleaned = String(imageBase64 || '').replace(/^data:[^;]+;base64,/, '');
  if (!cleaned) throw new Error('empty image');

  const errors = [];
  /** @type {string[]} */
  const softCandidates = [];

  try {
    const viaVision = await ocrViaVision(cleaned);
    if (viaVision && !isWeakOcrText(viaVision)) {
      console.info('ocr: vision');
      return viaVision;
    }
    if (viaVision) {
      softCandidates.push(viaVision);
      errors.push('vision: weak_ocr');
    }
  } catch (err) {
    errors.push(`vision: ${err instanceof Error ? err.message : err}`);
  }

  // Gemini next — better on soft / PC-screen photos than brittle Tesseract.
  try {
    const viaGemini = await ocrViaGemini(cleaned, mimeType);
    if (viaGemini && !isGarbageOcrText(viaGemini)) {
      console.info('ocr: gemini');
      return repairOcrText(viaGemini);
    }
    if (viaGemini) {
      softCandidates.push(viaGemini);
      errors.push('gemini: garbage_ocr');
    }
  } catch (err) {
    errors.push(`gemini: ${err instanceof Error ? err.message : err}`);
    console.warn('gemini OCR failed', err instanceof Error ? err.message : err);
  }

  try {
    const viaTess = await ocrViaTesseract(cleaned, mimeType);
    if (viaTess && !isGarbageOcrText(viaTess)) {
      console.info('ocr: tesseract');
      return viaTess;
    }
    if (viaTess) {
      softCandidates.push(viaTess);
      errors.push('tesseract: garbage_ocr');
      console.warn('tesseract OCR garbage', viaTess.slice(0, 120).replace(/\s+/g, ' '));
    } else {
      errors.push('tesseract: empty');
    }
  } catch (err) {
    errors.push(`tesseract: ${err instanceof Error ? err.message : err}`);
    console.warn('tesseract OCR failed', err instanceof Error ? err.message : err);
  }

  // Last resort: longest soft candidate (still better than hard fail on soft photos).
  if (softCandidates.length > 0) {
    const best = softCandidates.reduce((a, b) => (b.length > a.length ? b : a));
    console.warn('ocr: soft-accept', best.slice(0, 120).replace(/\s+/g, ' '));
    return repairOcrText(best);
  }

  throw new Error(
    `OCR unavailable (${errors.join(' | ') || 'no providers'}). ` +
      'Set GOOGLE_CLOUD_VISION_API_KEY / GEMINI_API_KEY or keep tesseract.js installed.',
  );
}
