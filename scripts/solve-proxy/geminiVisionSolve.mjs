/**
 * Image → Gemini multimodal solve (primary dogfood path).
 * Does not depend on brittle OCR→regex solvers for the answer.
 */

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

export function isGeminiVisionSolveEnabled() {
  if (process.env.COZBIL_PROXY_GEMINI_FIRST === '0') return false;
  return Boolean(process.env.GEMINI_API_KEY?.trim());
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
  const key = process.env.GEMINI_API_KEY.trim();
  const cleaned = String(imageBase64 || '').replace(/^data:[^;]+;base64,/, '');
  if (cleaned.length < 80) return null;

  const model =
    process.env.GEMINI_SOLVE_MODEL?.trim() ||
    process.env.GEMINI_OCR_MODEL?.trim() ||
    'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const prompt = geminiSolvePrompt(examType, subjectHint);

  const callOnce = async (extra, { jsonMime = true } = {}) => {
    const generationConfig = {
      temperature: 0,
      maxOutputTokens: 4096,
    };
    // Some restricted keys reject responseMimeType — retry without it.
    if (jsonMime) generationConfig.responseMimeType = 'application/json';
    const res = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: extra ? `${prompt}\n\n${extra}` : prompt },
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
        }),
      },
      45_000,
    );
    const data = await res.json();
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
    // One more attempt without JSON mime if first path threw API restriction.
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

/** Startup smoke — proxy must not pretend Gemini is on when the key is Vision-only. */
export async function smokeGeminiVisionSolve() {
  if (!isGeminiVisionSolveEnabled()) {
    return { ok: false, error: 'GEMINI_API_KEY missing or COZBIL_PROXY_GEMINI_FIRST=0' };
  }
  const key = process.env.GEMINI_API_KEY.trim();
  const model =
    process.env.GEMINI_SOLVE_MODEL?.trim() ||
    process.env.GEMINI_OCR_MODEL?.trim() ||
    'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  try {
    const res = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: '{"ok":true}' }] }],
        }),
      },
      20_000,
    );
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data?.error?.message || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'smoke_failed',
    };
  }
}
