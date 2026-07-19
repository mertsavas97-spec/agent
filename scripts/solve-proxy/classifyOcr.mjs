/**
 * Lightweight subject/topic classification from OCR (dogfood, no LLM).
 */

const MATH_HINTS =
  /işleminin sonucu|kaçtır\??|eşitliği|denklem|kesir|yüzde|%\d|oran|orantı|kök|üslü|x\s*=|∫|√|[÷×·]|[0-9]\s*[+\-*/]\s*[0-9]/i;

const TURKISH_HINTS =
  /anlatım biçimi|anlatim bicimi|paragraf|ana düşünce|ana dusunce|ana fikir|cümlede anlam|cumlede anlam|sözcükte|sozcukte|dil bilgisi|fiilims|özne|nesne|yüklem|anlamca|hangisi çıkarılamaz|çıkarılabilecek|anlatımında|düşünceyi geliştirme|yazım yanlışı|noktalama/i;

const SCIENCE_HINTS =
  /fotosentez|hücre|atom|molekül|kuvvet|ivme|enerji|asit|baz|element|dolaşım|solunum|bitki|canlı/i;

const HISTORY_HINTS =
  /osmanlı|cumhuriyet|inkılap|savaş|antlaşma|padişah|tbmm|kurtuluş|malazgirt|istanbul'?un fethi/i;

/**
 * @returns {{ subject: string, topicKey: string, confidence: 'high' | 'medium' | 'low' }}
 */
export function classifyOcr(ocrText, examType = 'lgs') {
  const t = String(ocrText || '');
  const lower = t.toLowerCase();

  const hasMathOps =
    MATH_HINTS.test(t) ||
    (/\d/.test(t) && /[÷×·+\-*/=]/.test(t) && t.split(/\s+/).length < 40);
  const hasTurkish = TURKISH_HINTS.test(t);
  const hasScience = SCIENCE_HINTS.test(t);
  const hasHistory = HISTORY_HINTS.test(t);

  // Long prose + verbal stem → turkish even if a stray digit (question no.) appears
  const wordCount = t.trim().split(/\s+/).filter(Boolean).length;
  const proseHeavy = wordCount >= 18 && !hasMathOps;

  if (hasTurkish || (proseHeavy && !hasMathOps && !hasScience)) {
    let topicKey = 'paragraf';
    if (/anlatım biçimi|anlatim bicimi|anlatımında/i.test(t)) topicKey = 'anlatim';
    else if (/ana düşünce|ana dusunce|ana fikir|konusu nedir/i.test(t)) topicKey = 'paragraf';
    else if (/dil bilgisi|fiilims|özne|nesne|yüklem|yazım|noktalama/i.test(t))
      topicKey = 'dilbilgisi';
    else if (/sözcük|sozcuk|anlamca|eş anlamlı|zıt/i.test(t)) topicKey = 'anlam';
    return { subject: 'turkish', topicKey, confidence: hasTurkish ? 'high' : 'medium' };
  }

  if (hasScience && !hasMathOps) {
    return { subject: 'science', topicKey: 'genel', confidence: 'medium' };
  }
  if (hasHistory && !hasMathOps) {
    return { subject: 'history', topicKey: 'genel', confidence: 'medium' };
  }

  if (hasMathOps || /[0-9].*[÷×/].*[0-9]/.test(t) || lower.includes('kaçtır')) {
    let topicKey = 'temel';
    if (/kesir|\/\s*\d/.test(lower)) topicKey = 'kesir';
    else if (/%|yüzde|yuzde/.test(lower)) topicKey = 'yuzde';
    else if (/oran|orantı|oranti/.test(lower)) topicKey = 'oran';
    else if (/denklem/.test(lower)) topicKey = 'denklem';
    return { subject: 'math', topicKey, confidence: 'high' };
  }

  // Default: if exam photo looks empty of signals, lean math only for short digit-heavy OCR
  if ((t.match(/\d/g) || []).length >= 4 && wordCount < 12) {
    return { subject: 'math', topicKey: 'temel', confidence: 'low' };
  }

  return {
    subject: proseHeavy ? 'turkish' : 'math',
    topicKey: proseHeavy ? 'paragraf' : 'temel',
    confidence: 'low',
  };
}

export function topicIdFor(examType, subject, topicKey) {
  const exam = ['lgs', 'ygs', 'kpss'].includes(examType) ? examType : 'lgs';

  if (subject === 'turkish') {
    if (topicKey === 'dilbilgisi') return `${exam}-turkish-dilbilgisi`;
    if (topicKey === 'anlam' || topicKey === 'anlatim') {
      // LGS uses anlam; KPSS/YGS use anlam — anlatım biçimi → paragraf/anlam
      if (exam === 'lgs' && topicKey === 'anlam') return 'lgs-turkish-anlam';
      if (topicKey === 'anlatim') return `${exam}-turkish-paragraf`;
      return exam === 'lgs' ? 'lgs-turkish-anlam' : `${exam}-turkish-anlam`;
    }
    return `${exam}-turkish-paragraf`;
  }

  if (subject === 'science') {
    return exam === 'lgs' ? 'lgs-science-enerji' : 'ygs-biology-hucre';
  }

  if (subject === 'history') {
    if (exam === 'lgs') return 'lgs-history-inkilaplar';
    if (exam === 'kpss') return 'kpss-history-inkilap';
    return 'ygs-history-inkilap';
  }

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
