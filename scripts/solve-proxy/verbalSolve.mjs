/**
 * Deterministic verbal (Türkçe) solvers for dogfood OCR — no LLM.
 */

function parseChoices(ocrText) {
  const map = {};
  const re = /([A-E])\)\s*([^\n]{1,80})/gi;
  let m;
  while ((m = re.exec(ocrText))) {
    const label = m[1].toUpperCase();
    const body = m[2].replace(/\s+/g, ' ').trim();
    if (body && !/^cevab/i.test(body)) map[label] = body;
  }
  return map;
}

function extractPassageAndStem(ocrText) {
  const text = ocrText.replace(/\r/g, '\n');
  const stemMatch = text.match(
    /\n?\s*((?:Bu parçanın|Bu parçadaki|Bu parçaya|Bu metne|Bu cümledeki|Yukarıdaki|Aşağıdaki|Paragrafın|Metnin)[^\n?]+\?)/i,
  );
  let stem = stemMatch ? stemMatch[1].trim() : '';
  if (!stem) {
    const alt = text.match(/\n\s*([^?\n]{8,140}\?)\s*(?:\n|$)/);
    stem = alt ? alt[1].trim() : '';
  }

  let passage = text;
  if (stemMatch) {
    passage = text.slice(0, stemMatch.index).trim();
  } else if (stem) {
    const idx = text.indexOf(stem);
    if (idx > 0) passage = text.slice(0, idx).trim();
  }
  passage = passage
    .replace(/^Soru\s*\|?\s*Cevap\s*/i, '')
    .replace(/^CEVAP:?\s*/gim, '')
    .replace(/^\d{1,3}\.\s*/gm, () => '')
    .replace(/\b\d{2,3}\b/g, (m) => {
      const n = Number(m);
      return n >= 90 && n <= 120 ? '' : m;
    })
    .replace(/\s+/g, ' ')
    .trim();

  // Drop stem accidentally left in passage
  if (stem && passage.includes(stem)) {
    passage = passage.replace(stem, '').trim();
  }

  return { passage, stem };
}

function scoreAnlatim(passage) {
  const p = passage.toLowerCase();
  const scores = {
    öyküleme: 0,
    betimleme: 0,
    açıklama: 0,
    tartışma: 0,
  };

  if (/her sabah|bir gün|sonra|önce|derken|iken|di\.|du\.|dı\.|dü\./i.test(passage))
    scores.öyküleme += 2;
  if (/(ırdı|irdi|urdu|ürdü|yordu|yordu|irdi|ardı)/i.test(passage)) scores.öyküleme += 2;
  if (/ilgilenir|konuşur|gider|gelir|yapar|verir|bakar/i.test(p)) scores.öyküleme += 1;

  if (/gibi|kadar|rengi|kokusu|görün|ışıltı|yumuşak|sert|uzun|kısa/i.test(p))
    scores.betimleme += 1;
  if (/betim|tasvir/i.test(p)) scores.betimleme += 3;

  if (/demektir|yani|çünkü|nedeni|olarak adlandırılır|bilgi/i.test(p)) scores.açıklama += 2;

  if (/bence|kanısındayım|savun|ise de|oysa|ancak|gerekir/i.test(p)) scores.tartışma += 2;

  let best = 'öyküleme';
  let bestScore = -1;
  for (const [k, v] of Object.entries(scores)) {
    if (v > bestScore) {
      best = k;
      bestScore = v;
    }
  }
  return { answer: best, scores };
}

/**
 * Cümlede / parçada anlam ilgisi: amaç-sonuç, neden-sonuç, koşul…
 * Örnek: "… yapmak için … çalışmıştı" → amaç-sonuç
 */
export function scoreAnlamIlgisi(passage) {
  const p = passage.toLowerCase();
  const scores = {
    'amaç-sonuç': 0,
    'neden-sonuç': 0,
    'koşul-sonuç': 0,
    'karşıtlık': 0,
    'benzerlik': 0,
  };

  // Amaç: -mek/-mak için, diye (purpose)
  if (/m[ae]k için|mak için|mek için/i.test(p)) scores['amaç-sonuç'] += 5;
  if (/\biçin\b/.test(p) && /yapmak|almak|vermek|gitmek|çalışmak|etmek|bulmak/i.test(p)) {
    scores['amaç-sonuç'] += 3;
  }
  if (/\bdiye\b/.test(p) && !/söyle|dedi/i.test(p)) scores['amaç-sonuç'] += 2;

  // Neden: -den dolayı, çünkü, -diği için (causal — weaker than purpose "yapmak için")
  if (/yüzünden|dolayı|sebebiyle|çünkü|-den|-dan dolayı/i.test(p)) scores['neden-sonuç'] += 4;
  if (/\biçin\b/.test(p) && !/m[ae]k için|mak için|mek için/i.test(p)) {
    scores['neden-sonuç'] += 1;
  }

  // Koşul
  if (/ise\b|eğer|şayet|-se\b|-sa\b|takdirde/i.test(p)) scores['koşul-sonuç'] += 3;

  // Karşıtlık / benzerlik
  if (/oysa|halbuki|ise de|ama\b|fakat|rağmen/i.test(p)) scores['karşıtlık'] += 3;
  if (/gibi|kadar|benzer|aynı şekilde/i.test(p)) scores['benzerlik'] += 2;

  let best = 'amaç-sonuç';
  let bestScore = -1;
  for (const [k, v] of Object.entries(scores)) {
    if (v > bestScore) {
      best = k;
      bestScore = v;
    }
  }
  // Require some signal — otherwise still prefer amaç if "için" present
  if (bestScore <= 0 && /\biçin\b/.test(p)) {
    best = 'amaç-sonuç';
    bestScore = 1;
  }
  return { answer: best, scores, bestScore };
}

function matchChoice(answer, choices) {
  const norm = (s) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[^a-zğüşıöç0-9]/gi, '');
  const target = norm(answer);
  for (const [k, v] of Object.entries(choices)) {
    const nv = norm(v);
    if (nv.includes(target) || target.includes(nv)) return k;
  }
  const aliases = {
    'amaç-sonuç': ['amac', 'amaçsonuç', 'amacsonuc'],
    'neden-sonuç': ['neden', 'nedensonuc'],
    'koşul-sonuç': ['kosul', 'şart', 'sart'],
    karşıtlık: ['karsit', 'zitlik'],
    benzerlik: ['benzer'],
    öyküleme: ['oykule'],
    betimleme: ['betim'],
    açıklama: ['acikla'],
    tartışma: ['tartis'],
  };
  const keys = aliases[answer] || [];
  for (const [k, v] of Object.entries(choices)) {
    const nv = norm(v);
    if (keys.some((a) => nv.includes(a))) return k;
  }
  return undefined;
}

function whyAnlam(answer) {
  if (answer === 'amaç-sonuç') {
    return '“… yapmak için …” ifadesi amaç bildirir; ardından gelen eylem sonuçtur → amaç-sonuç.';
  }
  if (answer === 'neden-sonuç') {
    return 'Neden (sebep) ile sonuç bağlanıyor (çünkü / -den dolayı / yüzünden) → neden-sonuç.';
  }
  if (answer === 'koşul-sonuç') {
    return 'Koşul (-se/-sa, eğer) + sonuç var → koşul-sonuç.';
  }
  if (answer === 'karşıtlık') {
    return 'Zıt / karşıt iki durum bağlanıyor → karşıtlık.';
  }
  return 'Benzerlik / denklem ilgisi ağır basıyor → benzerlik.';
}

/** Display label: amaç-sonuç → Amaç-sonuç */
function titleAnlam(answer) {
  if (!answer) return answer;
  return answer
    .split('-')
    .map((part, i) =>
      i === 0 ? part.charAt(0).toLocaleUpperCase('tr-TR') + part.slice(1) : part,
    )
    .join('-');
}

/**
 * @returns {{ steps: object[], answerLabel?: string, answerText?: string } | null}
 */
export function tryVerbalSolve(ocrText, classification) {
  if (!classification || classification.subject !== 'turkish') return null;

  const { passage, stem } = extractPassageAndStem(ocrText);
  const choices = parseChoices(ocrText);
  const stemL = (stem || ocrText).toLowerCase();
  const blob = ocrText.toLowerCase();

  if (/anlatım biçimi|anlatim bicimi/.test(stemL) || /anlatım biçimi/.test(ocrText)) {
    const { answer, scores } = scoreAnlatim(passage || ocrText);
    const choice = matchChoice(answer, choices);
    const why =
      answer === 'öyküleme'
        ? 'Olaylar zaman içinde aktarılıyor — öyküleme.'
        : answer === 'betimleme'
          ? 'Duyusal / tasvir ağırlıklı — betimleme.'
          : answer === 'açıklama'
            ? 'Bilgi / tanım ağırlıklı — açıklama.'
            : 'Kanı / savunma — tartışma.';

    return {
      steps: [
        {
          title: '1. Soru ne istiyor?',
          body: 'Anlatım biçimini bul: öyküleme, betimleme, açıklama veya tartışma.',
        },
        {
          title: '2. Metinde ne var?',
          body:
            passage.length > 12
              ? `“${passage.slice(0, 160)}${passage.length > 160 ? '…' : ''}”`
              : 'Metindeki eylem ve zaman ifadelerine bak.',
        },
        { title: '3. Neden bu biçim?', body: why },
        {
          title: 'Cevap',
          body: choice
            ? `Doğru şık: ${choice}) ${choices[choice]}`
            : `En uygun anlatım biçimi: ${answer}`,
        },
      ],
      answerLabel: choice,
      answerText: answer,
      debugScores: scores,
    };
  }

  if (
    /anlam ilgisi|anlam ilişkisi|anlamca|cümledeki anlam/i.test(stemL) ||
    /anlam ilgisi|anlam ilişkisi/i.test(blob)
  ) {
    const { answer, scores, bestScore } = scoreAnlamIlgisi(passage || ocrText);
    const display = titleAnlam(answer);
    const choice = matchChoice(answer, choices);
    const steps = [
      {
        title: '1. Soru ne istiyor?',
        body: 'Anlam ilgisi: amaç-sonuç, neden-sonuç, koşul-sonuç, karşıtlık…',
      },
      {
        title: '2. Bağlantı sözcüğünü bul',
        body:
          passage.length > 8
            ? `Cümle: “${passage.slice(0, 180)}${passage.length > 180 ? '…' : ''}”`
            : '“için”, “çünkü”, “-se/-sa”, “oysa” gibi bağlara bak.',
      },
      {
        title: '3. İlgiyi seç',
        body: whyAnlam(answer),
      },
      {
        title: 'Cevap',
        body: choice
          ? `Doğru şık: ${choice}) ${choices[choice]}`
          : `Anlam ilgisi: ${display}`,
      },
    ];
    return {
      steps,
      answerLabel: choice,
      answerText: display,
      debugScores: scores,
      lowSignal: bestScore <= 0,
    };
  }

  // Generic paragraf / anlam guidance — still try to surface a soft answer if stem is clear
  const steps = [
    {
      title: '1. Soruyu ayır',
      body: stem
        ? `Soru kökü: ${stem}`
        : 'Soru kökünü bul: ana fikir, çıkarım, anlatım biçimi, anlam ilgisi…',
    },
    {
      title: '2. Metni tara',
      body:
        passage.length > 24
          ? `Parça: “${passage.slice(0, 200)}${passage.length > 200 ? '…' : ''}” — şıkları metne götür.`
          : 'Parçadaki ana eylem / bağı tek cümlede özetle.',
    },
    {
      title: '3. Şıkları ele',
      body: Object.keys(choices).length
        ? `Şıklar: ${Object.entries(choices)
            .map(([k, v]) => `${k}) ${v}`)
            .join(' · ')}.`
        : 'Şıkları metne götür; metinde dayanağı olmayanı eler.',
    },
  ];

  // If choices look like anlam-ilgisi options, score anyway
  const choiceBlob = Object.values(choices).join(' ').toLowerCase();
  if (/amaç|neden|koşul|karşıt|benzer/i.test(choiceBlob) && passage.length > 8) {
    const { answer } = scoreAnlamIlgisi(passage);
    const display = titleAnlam(answer);
    const choice = matchChoice(answer, choices);
    steps.push({
      title: 'Cevap',
      body: choice
        ? `Doğru şık: ${choice}) ${choices[choice]}`
        : `Anlam ilgisi: ${display}`,
    });
    return { steps, answerLabel: choice, answerText: display };
  }

  steps.push({
    title: 'Cevap',
    body: 'Şıklar kadrajda değilse genişletip yeniden dene — kök netleşince cevabı yazarız.',
  });
  return { steps };
}
