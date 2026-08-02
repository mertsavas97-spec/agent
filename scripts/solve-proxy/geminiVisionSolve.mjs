/**
 * Image → Gemini multimodal solve (primary dogfood path).
 * Does not depend on brittle OCR→regex solvers for the answer.
 *
 * Transport (prefer Vertex — GCP Startup / org policy):
 *   COZBIL_USE_VERTEX=1  → Vertex AI + gcloud ADC (or GOOGLE_ACCESS_TOKEN)
 *   GEMINI_API_KEY       → Generative Language API key (AI Studio only;
 *                          Cloud Console API keys often return API_KEY_INVALID)
 */

import { execFileSync } from 'node:child_process';

const SUBJECTS = new Set([
  'math',
  'turkish',
  'science',
  'physics',
  'chemistry',
  'biology',
  'history',
  'geography',
  'philosophy',
  'literature',
  'religion',
  'english',
  'geometry',
  'civics',
  'current',
  'traffic',
  'vehicle',
  'firstaid',
  'unknown',
]);

function examAudience(examType) {
  switch (examType) {
    case 'ygs':
      return 'YKS (TYT/AYT) sınav paketi — matematik, Türkçe, fen, sosyal.';
    case 'kpss':
      return 'KPSS GY–GK — Türkçe, matematik, geometri, tarih, coğrafya, vatandaşlık.';
    case 'trafik':
      return 'Ehliyet / MTS — trafik kuralları, işaretler, araç tekniği, ilk yardım.';
    default:
      return 'LGS (8. sınıf) — Türkçe, matematik, fen, inkılap, din, İngilizce.';
  }
}

/** Compact exam-aware prompt — mirrors functions systemPromptForSolve contract. */
export function geminiSolvePrompt(examType, subjectHint) {
  const exam = ['lgs', 'ygs', 'kpss', 'trafik'].includes(examType)
    ? examType
    : 'lgs';
  const hint =
    subjectHint && SUBJECTS.has(subjectHint) && subjectHint !== 'unknown'
      ? `Öncelik ders ipucu: ${subjectHint}. Görsel başka derse aitse doğru subject yaz.`
      : 'Görseldeki sorunun dersini (subject) doğru tespit et.';

  return [
    'Sen ÇözBil sınav çözüm asistanısın. Öğrenciye adım adım, sade Türkçe anlat.',
    examAudience(exam),
    hint,
    'Görseldeki soruyu OKU ve ÇÖZ. Bulanık / ekran fotoğrafı olsa bile şıkları ve işlemleri dikkatle çıkar.',
    'Diyagram çizimi şartsa unsupported=true. Soru değilse isQuestion=false.',
    'Doğruluk garantisi / abartılı dil kullanma.',
    'Yanıtını YALNIZCA JSON olarak ver (markdown yok):',
    '{',
    '  "isQuestion": boolean,',
    '  "unsupported": boolean,',
    '  "unsupportedReason": string | null,',
    '  "subject": string,',
    '  "topicKey": string | null,',
    '  "ocrText": string,',
    '  "steps": [ { "title": string, "body": string } ],',
    '  "answer": { "label": "A"|"B"|"C"|"D"|"E"|null, "text": string }',
    '}',
    'ZORUNLU: Çözülebilen sorularda answer doldur (çoktan seçmeliyse label A–E).',
    'Son adım title="Cevap"; body içinde Doğru şık / Sonuç yaz.',
    'ocrText: görselden okuduğun soru + şıklar (debug için).',
  ].join('\n');
}

export function stripFences(text) {
  const trimmed = String(text || '').trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fenced ? fenced[1].trim() : trimmed;
}

export function repairJsonText(text) {
  let t = stripFences(text);
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  t = t.replace(/,\s*([\]}])/g, '$1');
  return t;
}

function parseAnswer(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const text = typeof raw.text === 'string' ? raw.text.trim() : '';
  const labelRaw = typeof raw.label === 'string' ? raw.label.trim().toUpperCase() : '';
  const label = /^[A-E]$/.test(labelRaw) ? labelRaw : null;
  if (!text && !label) return null;
  return {
    text: text || label,
    ...(label ? { label } : {}),
  };
}

function parseSteps(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => ({
      title: typeof s?.title === 'string' ? s.title.trim() : '',
      body: typeof s?.body === 'string' ? s.body.trim() : '',
    }))
    .filter((s) => s.title || s.body)
    .slice(0, 12);
}

/** Extract answer from Cevap step when JSON omitted answer. */
export function extractAnswerFromSteps(steps) {
  const answerStep = [...steps]
    .reverse()
    .find((s) => /^(cevap|sonuç|doğru)/i.test((s.title || '').trim()));
  if (!answerStep?.body) return null;
  const choice = answerStep.body.match(
    /Doğru şık\s*[:：]\s*([A-E])\)\s*(.+)$/im,
  );
  if (choice) {
    return {
      label: choice[1].toUpperCase(),
      text: choice[2].replace(/\.\s*$/, '').trim(),
    };
  }
  const letter = answerStep.body.match(/Doğru şık\s*[:：]?\s*([A-E])\b/i);
  if (letter) {
    return { label: letter[1].toUpperCase(), text: letter[1].toUpperCase() };
  }
  return null;
}

/**
 * @returns {{
 *   ok: boolean,
 *   isQuestion?: boolean,
 *   unsupported?: boolean,
 *   unsupportedReason?: string | null,
 *   subject?: string,
 *   topicKey?: string | null,
 *   ocrText?: string,
 *   steps?: {title:string,body:string}[],
 *   answer?: {label?: string, text: string} | null,
 *   error?: string,
 * }}
 */
export function parseGeminiSolveResponse(text) {
  try {
    const data = JSON.parse(repairJsonText(text));
    const steps = parseSteps(data.steps);
    let answer = parseAnswer(data.answer);
    if (!answer) answer = extractAnswerFromSteps(steps);
    const subject =
      typeof data.subject === 'string' && SUBJECTS.has(data.subject)
        ? data.subject
        : 'unknown';
    return {
      ok: true,
      isQuestion: data.isQuestion !== false,
      unsupported: Boolean(data.unsupported),
      unsupportedReason:
        typeof data.unsupportedReason === 'string' ? data.unsupportedReason : null,
      subject,
      topicKey: typeof data.topicKey === 'string' ? data.topicKey : null,
      ocrText: typeof data.ocrText === 'string' ? data.ocrText : '',
      steps,
      answer,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'json_parse',
    };
  }
}

export function useVertexForProxy() {
  return process.env.COZBIL_USE_VERTEX === '1';
}

export function isGeminiVisionSolveEnabled() {
  if (process.env.COZBIL_PROXY_GEMINI_FIRST === '0') return false;
  if (useVertexForProxy()) return true;
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

function vertexProjectId() {
  return (
    process.env.GCLOUD_PROJECT ||
    process.env.GCP_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    'cozbil-dev-f9583'
  );
}

function vertexLocation() {
  return process.env.VERTEX_LOCATION || 'us-central1';
}

function solveModel() {
  return (
    process.env.VERTEX_MODEL?.trim() ||
    process.env.GEMINI_SOLVE_MODEL?.trim() ||
    process.env.GEMINI_OCR_MODEL?.trim() ||
    'gemini-2.5-flash'
  );
}

let cachedToken = { value: '', exp: 0 };

/** Bearer token for Vertex — env override or `gcloud auth print-access-token`. */
export function vertexAccessToken() {
  const fromEnv = process.env.GOOGLE_ACCESS_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  const now = Date.now();
  if (cachedToken.value && cachedToken.exp > now + 60_000) {
    return cachedToken.value;
  }
  try {
    const token = execFileSync('gcloud', ['auth', 'print-access-token'], {
      encoding: 'utf8',
      timeout: 15_000,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    if (!token) throw new Error('empty_token');
    cachedToken = { value: token, exp: now + 45 * 60_000 };
    return token;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Vertex token fail (gcloud auth login?): ${msg}`);
  }
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

function buildGenerateRequest(prompt, cleaned, mimeType, { jsonMime = true } = {}) {
  const generationConfig = {
    temperature: 0,
    maxOutputTokens: 4096,
  };
  if (jsonMime) generationConfig.responseMimeType = 'application/json';
  return {
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleaned,
            },
          },
        ],
      },
    ],
    generationConfig,
  };
}

async function postGenerateContent(body, timeoutMs) {
  const model = solveModel();
  if (useVertexForProxy()) {
    const project = vertexProjectId();
    const location = vertexLocation();
    const url =
      `https://${location}-aiplatform.googleapis.com/v1/projects/${project}` +
      `/locations/${location}/publishers/google/models/${model}:generateContent`;
    const token = vertexAccessToken();
    const res = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
      timeoutMs,
    );
    const data = await res.json();
    return { res, data, transport: 'vertex' };
  }

  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error('GEMINI_API_KEY missing');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    timeoutMs,
  );
  const data = await res.json();
  return { res, data, transport: 'api_key' };
}

/**
 * Primary solve: send the photo to Gemini. Returns null if disabled / failed.
 */
export async function solveImageWithGemini({
  imageBase64,
  mimeType = 'image/jpeg',
  examType = 'lgs',
  subjectHint = null,
}) {
  if (!isGeminiVisionSolveEnabled()) return null;
  const cleaned = String(imageBase64 || '').replace(/^data:[^;]+;base64,/, '');
  if (cleaned.length < 80) return null;

  const prompt = geminiSolvePrompt(examType, subjectHint);

  const callOnce = async (extra, { jsonMime = true } = {}) => {
    const fullPrompt = extra ? `${prompt}\n\n${extra}` : prompt;
    const { res, data } = await postGenerateContent(
      buildGenerateRequest(fullPrompt, cleaned, mimeType, { jsonMime }),
      45_000,
    );
    if (!res.ok) {
      throw new Error(data?.error?.message || `Gemini solve HTTP ${res.status}`);
    }
    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p?.text || '')
        .join('')
        .trim() || '';
    if (!text) {
      const block = data?.candidates?.[0]?.finishReason || data?.promptFeedback?.blockReason;
      throw new Error(block ? `gemini_empty (${block})` : 'gemini_empty');
    }
    return parseGeminiSolveResponse(text);
  };

  try {
    let parsed = await callOnce(null, { jsonMime: true });
    if (!parsed.ok) {
      parsed = await callOnce(
        'ÖNCEKİ YANIT GEÇERSİZ JSON İÇERİYORDU. YALNIZCA tek geçerli JSON nesnesi döndür.',
        { jsonMime: true },
      );
    }
    if (!parsed.ok) {
      parsed = await callOnce(null, { jsonMime: false });
    }
    if (!parsed.ok) return { ok: false, error: parsed.error || 'parse_fail' };
    return parsed;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('gemini vision solve failed', message);
    if (/mime|JSON|INVALID_ARGUMENT|responseMimeType/i.test(message)) {
      try {
        const parsed = await callOnce(
          'YALNIZCA tek geçerli JSON nesnesi döndür.',
          { jsonMime: false },
        );
        if (parsed.ok) return parsed;
      } catch (retryErr) {
        console.warn(
          'gemini vision retry failed',
          retryErr instanceof Error ? retryErr.message : retryErr,
        );
        return {
          ok: false,
          error: retryErr instanceof Error ? retryErr.message : 'gemini_solve_error',
        };
      }
    }
    return {
      ok: false,
      error: message || 'gemini_solve_error',
    };
  }
}

/** Startup smoke — Vertex ADC or AI Studio key (not Cloud Console API keys). */
export async function smokeGeminiVisionSolve() {
  if (!isGeminiVisionSolveEnabled()) {
    return {
      ok: false,
      error: 'Set COZBIL_USE_VERTEX=1 (preferred) or GEMINI_API_KEY; COZBIL_PROXY_GEMINI_FIRST≠0',
    };
  }
  try {
    const model = solveModel();
    let url;
    let headers = { 'Content-Type': 'application/json' };
    if (useVertexForProxy()) {
      const project = vertexProjectId();
      const location = vertexLocation();
      url =
        `https://${location}-aiplatform.googleapis.com/v1/projects/${project}` +
        `/locations/${location}/publishers/google/models/${model}:generateContent`;
      headers = {
        ...headers,
        Authorization: `Bearer ${vertexAccessToken()}`,
      };
    } else {
      const key = process.env.GEMINI_API_KEY.trim();
      url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    }
    const res = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Reply with one word: ok' }] }],
        }),
      },
      25_000,
    );
    const data = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        error: data?.error?.message || `HTTP ${res.status}`,
        transport: useVertexForProxy() ? 'vertex' : 'api_key',
      };
    }
    return { ok: true, transport: useVertexForProxy() ? 'vertex' : 'api_key', model };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'smoke_failed',
      transport: useVertexForProxy() ? 'vertex' : 'api_key',
    };
  }
}
