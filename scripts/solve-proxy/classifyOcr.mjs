/**
 * Scored subject/topic classification from OCR (dogfood, no LLM).
 * High confidence auto-locks; medium/low → client subject confirm sheet.
 */

const MATH_STEM =
  /işleminin sonucu|kaçtır\??|eşitliği|denklem|kesir|yüzde|%\d|oran|orantı|kök|üslü|x\s*=/i;
const MATH_OPS = /[÷×·√∫]|[0-9]\s*[+\-*/]\s*[0-9]|[0-9].*[÷×/].*[0-9]/;

const TURKISH_STEM =
  /anlatım biçimi|anlatim bicimi|paragraf|ana düşünce|ana dusunce|ana fikir|cümlede anlam|cumlede anlam|anlam ilgisi|anlam ilişkisi|sözcükte|sozcukte|dil bilgisi|fiilims|özne|nesne|yüklem|anlamca|hangisi çıkarılamaz|çıkarılabilecek|anlatımında|düşünceyi geliştirme|yazım yanlışı|noktalama/i;

const SCIENCE_STEM =
  /fotosentez|hücre|atom|molekül|kuvvet|ivme|enerji|asit|baz|element|dolaşım|solunum|bitki|canlı|basınç|elektrik/i;

const HISTORY_STEM =
  /osmanlı|cumhuriyet|inkılap|savaş|antlaşma|padişah|tbmm|kurtuluş|malazgirt|istanbul'?un fethi|milli mücadele/i;

const GEO_STEM = /coğrafya|iklim|nüfus|akarsu|dağ|ova|bölge|maden|tarım/i;
const CIVICS_STEM = /anayasa|tbmm|vatandaş|temel hak|seçim|cumhurbaşkan/i;

function topicKeyFor(subject, t) {
  const lower = t.toLowerCase();
  if (subject === 'turkish') {
    if (/anlatım biçimi|anlatim bicimi|anlatımında/i.test(t)) return 'anlatim';
    if (/anlam ilgisi|anlam ilişkisi|cümlede anlam|cumlede anlam/i.test(t)) return 'anlam';
    if (/dil bilgisi|fiilims|özne|nesne|yüklem|yazım|noktalama/i.test(t)) return 'dilbilgisi';
    if (/sözcük|sozcuk|anlamca|eş anlamlı|zıt/i.test(t)) return 'anlam';
    return 'paragraf';
  }
  if (subject === 'math' || subject === 'geometry') {
    if (/kesir|\/\s*\d/.test(lower)) return 'kesir';
    if (/%|yüzde|yuzde/.test(lower)) return 'yuzde';
    if (/oran|orantı|oranti/.test(lower)) return 'oran';
    if (/denklem/.test(lower)) return 'denklem';
    return 'temel';
  }
  return 'genel';
}

function allowedSubjects(examType) {
  if (examType === 'kpss') {
    return ['turkish', 'math', 'geometry', 'history', 'geography', 'civics', 'current'];
  }
  if (examType === 'ygs') {
    return [
      'turkish',
      'literature',
      'math',
      'physics',
      'chemistry',
      'biology',
      'history',
      'geography',
      'philosophy',
      'religion',
    ];
  }
  return ['turkish', 'math', 'science', 'history', 'religion', 'english'];
}

/**
 * @returns {{
 *   subject: string,
 *   topicKey: string,
 *   confidence: 'high' | 'medium' | 'low',
 *   score: number,
 *   alternatives: { subject: string, score: number }[],
 *   needsConfirm: boolean,
 * }}
 */
export function classifyOcr(ocrText, examType = 'lgs') {
  const t = String(ocrText || '');
  const wordCount = t.trim().split(/\s+/).filter(Boolean).length;
  const digitCount = (t.match(/\d/g) || []).length;
  const choiceVerbal = /[A-E]\)\s*[A-Za-zÇĞİÖŞÜçğıöşü]{3,}/.test(t);
  const choiceNumeric = /[A-E]\)\s*[-−]?[0-9]+(?:\/[0-9]+)?/.test(t);

  const scores = {
    turkish: 0,
    math: 0,
    science: 0,
    history: 0,
    geography: 0,
    civics: 0,
    geometry: 0,
  };

  if (TURKISH_STEM.test(t)) scores.turkish += 6;
  if (MATH_STEM.test(t)) scores.math += 5;
  if (MATH_OPS.test(t)) scores.math += 4;
  if (SCIENCE_STEM.test(t)) scores.science += 5;
  if (HISTORY_STEM.test(t)) scores.history += 5;
  if (GEO_STEM.test(t)) scores.geography += 4;
  if (CIVICS_STEM.test(t)) scores.civics += 4;
  if (/üçgen|doğru|açı|çember|alan|hacim|geometri/i.test(t)) scores.geometry += 4;

  if (wordCount >= 18 && scores.math < 3) scores.turkish += 3;
  if (choiceVerbal) scores.turkish += 2;
  if (choiceNumeric) scores.math += 2;
  if (digitCount >= 6 && wordCount < 20) scores.math += 2;
  if (digitCount <= 2 && wordCount >= 12) scores.turkish += 1;

  const allowed = new Set(allowedSubjects(examType));
  // Map science→biology-ish not in kpss: keep science only for lgs
  const ranked = Object.entries(scores)
    .filter(([s]) => allowed.has(s) || (s === 'science' && examType === 'lgs'))
    .map(([subject, score]) => ({ subject, score }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  let subject = ranked[0]?.subject;
  let score = ranked[0]?.score ?? 0;
  const second = ranked[1]?.score ?? 0;
  const alternatives = ranked.slice(1, 4);

  if (!subject) {
    // No signal — do NOT silently prefer math
    subject = wordCount >= 12 ? 'turkish' : 'math';
    score = 1;
  }

  const gap = score - second;
  let confidence = 'low';
  if (score >= 6 && gap >= 3) confidence = 'high';
  else if (score >= 4 && gap >= 2) confidence = 'medium';
  else if (score >= 6 && gap >= 2) confidence = 'high';
  else confidence = score >= 3 ? 'medium' : 'low';

  // Strong single-stem overrides
  if (TURKISH_STEM.test(t) && !MATH_STEM.test(t) && !MATH_OPS.test(t)) {
    subject = 'turkish';
    confidence = 'high';
    score = Math.max(score, 8);
  } else if ((MATH_STEM.test(t) || MATH_OPS.test(t)) && !TURKISH_STEM.test(t) && wordCount < 30) {
    subject = allowed.has('math') ? 'math' : subject;
    if (subject === 'math') {
      confidence = 'high';
      score = Math.max(score, 8);
    }
  }

  const needsConfirm = confidence !== 'high';

  return {
    subject,
    topicKey: topicKeyFor(subject, t),
    confidence,
    score,
    alternatives,
    needsConfirm,
  };
}

export function topicIdFor(examType, subject, topicKey) {
  const exam = ['lgs', 'ygs', 'kpss'].includes(examType) ? examType : 'lgs';

  if (subject === 'turkish' || subject === 'literature') {
    if (topicKey === 'dilbilgisi') return `${exam}-turkish-dilbilgisi`;
    if (topicKey === 'anlam') {
      return exam === 'lgs' ? 'lgs-turkish-anlam' : `${exam}-turkish-anlam`;
    }
    if (topicKey === 'anlatim') return `${exam}-turkish-paragraf`;
    return `${exam}-turkish-paragraf`;
  }

  if (subject === 'science') {
    return exam === 'lgs' ? 'lgs-science-enerji' : 'ygs-biology-hucre';
  }
  if (subject === 'physics') return 'ygs-physics-hareket';
  if (subject === 'chemistry') return 'ygs-chemistry-atom';
  if (subject === 'biology') return 'ygs-biology-hucre';

  if (subject === 'history') {
    if (exam === 'lgs') return 'lgs-history-inkilaplar';
    if (exam === 'kpss') return 'kpss-history-inkilap';
    return 'ygs-history-inkilap';
  }
  if (subject === 'geography') {
    return exam === 'kpss' ? 'kpss-geography-turkiye' : 'ygs-geography-turkiye';
  }
  if (subject === 'civics') return 'kpss-civics-anayasa';
  if (subject === 'current') return 'kpss-current-gundem';
  if (subject === 'geometry') return 'kpss-geometry-ucgen';
  if (subject === 'religion') {
    return exam === 'lgs' ? 'lgs-religion-inanc' : 'ygs-religion-inanc-ibadet';
  }
  if (subject === 'english') return 'lgs-english-reading';
  if (subject === 'philosophy') return 'ygs-philosophy-felsefe';

  // math
  if (exam === 'kpss') {
    if (topicKey === 'kesir') return 'kpss-math-kesirler';
    if (topicKey === 'yuzde') return 'kpss-math-yuzde';
    if (topicKey === 'oran') return 'kpss-math-oran-oranti';
    return 'kpss-math-temel-islemler';
  }
  if (exam === 'ygs') {
    if (topicKey === 'denklem') return 'ygs-math-denklemler';
    return 'ygs-math-temel-kavramlar';
  }
  if (topicKey === 'kesir') return 'lgs-math-kesirler';
  if (topicKey === 'yuzde') return 'lgs-math-yuzdeler';
  if (topicKey === 'oran') return 'lgs-math-oran-oranti';
  if (topicKey === 'denklem') return 'lgs-math-denklemler';
  return 'lgs-math-denklemler';
}
