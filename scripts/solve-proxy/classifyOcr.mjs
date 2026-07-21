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
const PHYSICS_STEM =
  /kuvvet|ivme|enerji|basınç|elektrik|hareket|newton|iş\b|güç\b|sürtünme|ivmelenme|hız\b/i;
const CHEM_STEM =
  /atom|molekül|asit|baz|element|periyodik|iyon|reaksiyon|çözelti|bileşik/i;
const BIO_STEM =
  /fotosentez|hücre|dolaşım|solunum|bitki|canlı|enzim|dna|organ|doku|mitokondri/i;

const HISTORY_STEM =
  /osmanlı|cumhuriyet|inkılap|savaş|antlaşma|padişah|tbmm|kurtuluş|malazgirt|istanbul'?un fethi|milli mücadele/i;

const GEO_STEM = /coğrafya|iklim|nüfus|akarsu|dağ|ova|bölge|maden|tarım/i;
const CIVICS_STEM = /anayasa|tbmm|vatandaş|temel hak|seçim|cumhurbaşkan/i;

const TRAFFIC_STEM =
  /trafik|hız sınırı|azami hız|kavşak|geçiş üstünlüğü|ehliyet|levha|işaret|dur işareti|yol çizgi|yerleşim yeri|ışıklı trafik|trafik işaret|sürücü ne yapmalı|sarı ve kırmızı|kırmızı ışık|yeşil ışık|geçiş üstün|emniyet şeridi|sollama|park yasağı|kırmızı\s*[x×]|şerit kontrol|yeşil ok|çarpı işaret/i;
const VEHICLE_STEM =
  /abs|esp|fren|süspansiyon|motor|debriyaj|şanzıman|akü|far|silecek|emniyet kemeri|hava yastığı|şaft|diferansiyel|güç aktarma|\baks\b|aktarma organ/i;
const FIRSTAID_STEM =
  /ilk yardım|kanama|şok|kırık|yanık|bilinç|abc|solunum|kalp masajı|kazazede/i;

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
  if (subject === 'traffic') {
    if (/hız|mesafe|takip/.test(lower)) return 'hiz-mesafe';
    if (/kavşak|geçiş üstün/.test(lower)) return 'kavsak';
    if (/ışık|ışıklı|sarı|kırmızı|yeşil|sinyal/.test(lower)) return 'kurallar';
    if (/uyarı/.test(lower)) return 'isaretler-uyari';
    if (/yasak|park yasağı|sollama yasağı/.test(lower)) return 'isaretler-yasak';
    if (/bilgi|çizgi/.test(lower)) return 'isaretler-bilgi';
    if (/çevre|emisyon|gürültü/.test(lower)) return 'cevre';
    return 'kurallar';
  }
  if (subject === 'vehicle') {
    if (/fren|süspansiyon/.test(lower)) return 'fren-suspansiyon';
    if (/elektrik|far|akü/.test(lower)) return 'elektrik';
    if (/abs|esp|kemer|yastık|güvenlik/.test(lower)) return 'guvenlik';
    return 'motor';
  }
  if (subject === 'firstaid') {
    if (/kanama|şok/.test(lower)) return 'kanama';
    if (/kırık|yanık/.test(lower)) return 'kirik-yanik';
    if (/abc|bilinç|solunum/.test(lower)) return 'abc';
    return 'temel';
  }
  return 'genel';
}

function allowedSubjects(examType) {
  if (examType === 'trafik') {
    return ['traffic', 'vehicle', 'firstaid'];
  }
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
    physics: 0,
    chemistry: 0,
    biology: 0,
    history: 0,
    geography: 0,
    civics: 0,
    geometry: 0,
    traffic: 0,
    vehicle: 0,
    firstaid: 0,
  };

  if (TURKISH_STEM.test(t)) scores.turkish += 6;
  if (MATH_STEM.test(t)) scores.math += 5;
  if (MATH_OPS.test(t)) scores.math += 4;
  if (examType === 'lgs') {
    if (SCIENCE_STEM.test(t)) scores.science += 5;
  } else if (examType === 'ygs') {
    if (PHYSICS_STEM.test(t)) scores.physics += 5;
    if (CHEM_STEM.test(t)) scores.chemistry += 5;
    if (BIO_STEM.test(t)) scores.biology += 5;
    // Generic science stem with no specific fen branch → soft biology
    if (
      SCIENCE_STEM.test(t) &&
      scores.physics + scores.chemistry + scores.biology === 0
    ) {
      scores.biology += 3;
    }
  }
  if (HISTORY_STEM.test(t)) scores.history += 5;
  if (GEO_STEM.test(t)) scores.geography += 4;
  if (CIVICS_STEM.test(t)) scores.civics += 4;
  if (/üçgen|doğru|açı|çember|alan|hacim|geometri/i.test(t)) scores.geometry += 4;
  if (TRAFFIC_STEM.test(t)) scores.traffic += 6;
  if (VEHICLE_STEM.test(t)) scores.vehicle += 6;
  if (FIRSTAID_STEM.test(t)) scores.firstaid += 6;

  if (examType !== 'trafik') {
    if (wordCount >= 18 && scores.math < 3) scores.turkish += 3;
    if (choiceVerbal) scores.turkish += 2;
    if (choiceNumeric) scores.math += 2;
    if (digitCount >= 6 && wordCount < 20) scores.math += 2;
    if (digitCount <= 2 && wordCount >= 12) scores.turkish += 1;
  }

  const allowed = new Set(allowedSubjects(examType));
  const ranked = Object.entries(scores)
    .filter(([s]) => allowed.has(s))
    .map(([subject, score]) => ({ subject, score }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  let subject = ranked[0]?.subject;
  let score = ranked[0]?.score ?? 0;
  const second = ranked[1]?.score ?? 0;
  const alternatives = ranked.slice(1, 4);

  if (!subject) {
    // No signal — do NOT silently prefer math
    if (examType === 'trafik') {
      subject = 'traffic';
      score = 1;
    } else {
      subject = wordCount >= 12 ? 'turkish' : 'math';
      score = 1;
    }
  }

  const gap = score - second;
  let confidence = 'low';
  if (score >= 6 && gap >= 3) confidence = 'high';
  else if (score >= 4 && gap >= 2) confidence = 'medium';
  else if (score >= 6 && gap >= 2) confidence = 'high';
  else confidence = score >= 3 ? 'medium' : 'low';

  // Strong single-stem overrides (only when subject is allowed for exam)
  if (
    allowed.has('turkish') &&
    TURKISH_STEM.test(t) &&
    !MATH_STEM.test(t) &&
    !MATH_OPS.test(t)
  ) {
    subject = 'turkish';
    confidence = 'high';
    score = Math.max(score, 8);
  } else if (
    allowed.has('math') &&
    (MATH_STEM.test(t) || MATH_OPS.test(t)) &&
    !TURKISH_STEM.test(t) &&
    wordCount < 30
  ) {
    subject = 'math';
    confidence = 'high';
    score = Math.max(score, 8);
  } else if (examType === 'trafik') {
    if (FIRSTAID_STEM.test(t) && allowed.has('firstaid')) {
      subject = 'firstaid';
      confidence = 'high';
      score = Math.max(score, 8);
    } else if (VEHICLE_STEM.test(t) && allowed.has('vehicle')) {
      subject = 'vehicle';
      confidence = 'high';
      score = Math.max(score, 8);
    } else if (TRAFFIC_STEM.test(t) && allowed.has('traffic')) {
      subject = 'traffic';
      confidence = 'high';
      score = Math.max(score, 8);
    }
  }

  // Güç aktarma organları — trafik kelimesi olsa bile araç tekniği
  if (
    allowed.has('vehicle') &&
    /şaft|diferansiyel|güç aktarma|aktarma organ/i.test(t)
  ) {
    subject = 'vehicle';
    confidence = 'high';
    score = Math.max(score, 9);
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

/** Honor client subjectHint when it is allowed for the exam package. */
export function applySubjectHint(classified, subjectHint, examType, ocrText) {
  const allowed = new Set(allowedSubjects(examType));
  const hint = typeof subjectHint === 'string' ? subjectHint : '';
  if (!hint || hint === 'unknown' || !allowed.has(hint)) {
    return classified;
  }
  return {
    ...classified,
    subject: hint,
    topicKey: topicKeyFor(hint, String(ocrText || '')),
    confidence: 'high',
    needsConfirm: false,
    score: Math.max(classified.score || 0, 8),
  };
}

export function topicIdFor(examType, subject, topicKey) {
  const exam = ['lgs', 'ygs', 'kpss', 'trafik'].includes(examType)
    ? examType
    : 'lgs';

  // Trafik branş id'leri yalnızca Ehliyet paketinde
  if (exam === 'trafik') {
    if (subject === 'traffic') {
      const slug = topicKey || 'kurallar';
      return `trafik-traffic-${slug}`;
    }
    if (subject === 'vehicle') {
      const slug = topicKey || 'motor';
      return `trafik-vehicle-${slug}`;
    }
    if (subject === 'firstaid') {
      const slug = topicKey || 'temel';
      return `trafik-firstaid-${slug}`;
    }
    // Non-trafik subject under Ehliyet → stay in package
    return 'trafik-traffic-kurallar';
  }

  // Other exams must never emit trafik-* topic ids
  if (subject === 'traffic' || subject === 'vehicle' || subject === 'firstaid') {
    return topicIdFor(exam, 'turkish', 'paragraf');
  }

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
