/**
 * Deterministic verbal (Türkçe) solvers for dogfood OCR — no LLM.
 */

function parseChoices(ocrText) {
  const map = {};
  const re = /([A-E])\)\s*([^\n]{1,60})/gi;
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
    /\n?\s*((?:Bu parçanın|Bu parçaya|Bu metne|Yukarıdaki|Aşağıdaki|Paragrafın|Metnin)[^\n?]+\?)/i,
  );
  let stem = stemMatch ? stemMatch[1].trim() : '';
  if (!stem) {
    const alt = text.match(/\n\s*([^?\n]{8,120}\?)\s*(?:\n|$)/);
    stem = alt ? alt[1].trim() : '';
  }

  let passage = text;
  if (stemMatch) {
    passage = text.slice(0, stemMatch.index).trim();
  }
  passage = passage
    .replace(/^Soru\s*\|?\s*Cevap\s*/i, '')
    .replace(/^CEVAP:?\s*/gim, '')
    .replace(/^\d{1,3}\.\s*/gm, (m, offset, whole) => {
      // keep first question number strip only at start of lines that look like Q#
      return '';
    })
    .replace(/\b\d{2,3}\b/g, (m) => {
      // drop stray neighboring question numbers like "98"
      const n = Number(m);
      return n >= 90 && n <= 120 ? '' : m;
    })
    .replace(/\s+/g, ' ')
    .trim();

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

  // öyküleme — olay / zaman / eylem zinciri
  if (/her sabah|bir gün|sonra|önce|derken|iken|di\.|du\.|dı\.|dü\./i.test(passage))
    scores.öyküleme += 2;
  if (/(ırdı|irdi|urdu|ürdü|yordu|yordu|irdi|ardı)/i.test(passage)) scores.öyküleme += 2;
  if (/ilgilenir|konuşur|gider|gelir|yapar|verir|bakar/i.test(p)) scores.öyküleme += 1;

  // betimleme — duyular / sıfat yığını
  if (/gibi|kadar|rengi|kokusu|görün|ışıltı|yumuşak|sert|uzun|kısa/i.test(p))
    scores.betimleme += 1;
  if (/betim|tasvir/i.test(p)) scores.betimleme += 3;

  // açıklama — tanım / bilgi
  if (/demektir|yani|çünkü|nedeni|olarak adlandırılır|bilgi/i.test(p)) scores.açıklama += 2;
  if (/nedir\?/i.test(p) && /tanım/i.test(p)) scores.açıklama += 1;

  // tartışma — tez / kanı
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
  // partial: oykuleme / öyküleme
  for (const [k, v] of Object.entries(choices)) {
    if (norm(v).includes('oykule') && target.includes('oykule')) return k;
    if (norm(v).includes('betim') && target.includes('betim')) return k;
    if (norm(v).includes('acikla') && target.includes('acikla')) return k;
    if (norm(v).includes('tartis') && target.includes('tartis')) return k;
  }
  return undefined;
}

/**
 * @returns {{ steps: object[], answerLabel?: string, answerText?: string } | null}
 */
export function tryVerbalSolve(ocrText, classification) {
  if (!classification || classification.subject !== 'turkish') return null;

  const { passage, stem } = extractPassageAndStem(ocrText);
  const choices = parseChoices(ocrText);
  const stemL = (stem || ocrText).toLowerCase();

  if (/anlatım biçimi|anlatim bicimi/.test(stemL) || /anlatım biçimi/.test(ocrText)) {
    const { answer, scores } = scoreAnlatim(passage || ocrText);
    const choice = matchChoice(answer, choices);
    const steps = [
      {
        title: '1. Soru kökünü belirle',
        body: 'İstenen: parçanın anlatım biçimi (öyküleme, betimleme, açıklama, tartışma…).',
      },
      {
        title: '2. Parçadaki ipuçları',
        body:
          passage.length > 20
            ? `Metin eylem ve zaman ekseninde ilerliyor: “${passage.slice(0, 160)}${passage.length > 160 ? '…' : ''}”`
            : 'Metinde olay/zaman bildiren eylemler anlatım biçimini ele verir.',
      },
      {
        title: '3. Biçimi seç',
        body:
          answer === 'öyküleme'
            ? 'Olaylar zaman içinde aktarılıyor (her sabah, ilgilenir, konuşurdu…) → öyküleme.'
            : answer === 'betimleme'
              ? 'Varlık/ortam duyusal ayrıntılarla resmediliyor → betimleme.'
              : answer === 'açıklama'
                ? 'Bilgi ve tanım ağırlıklı → açıklama.'
                : 'Kanı/savunma ağırlıklı → tartışma.',
      },
      {
        title: 'Cevap',
        body: choice
          ? `Doğru şık: ${choice}) ${choices[choice]}`
          : `En uygun anlatım biçimi: ${answer}.${Object.keys(choices).length ? ' Şıklarla eşleştir.' : ' Şıklar kadrajda değilse kitapçuktaki seçeneklerle kontrol et.'}`,
      },
    ];
    return { steps, answerLabel: choice, answerText: answer, debugScores: scores };
  }

  // Generic paragraf / anlam guidance with passage awareness
  const steps = [
    {
      title: '1. Soruyu ayır',
      body: stem
        ? `Soru kökü: ${stem}`
        : 'Soru kökünü bul: ana fikir, çıkarım, anlatım biçimi, dil bilgisi vb.',
    },
    {
      title: '2. Metni tara',
      body:
        passage.length > 24
          ? `Parça: “${passage.slice(0, 200)}${passage.length > 200 ? '…' : ''}” — şıkları kendi bilginle değil metne göre ele.`
          : 'Parçadaki ana eylem / ana yargıyı tek cümlede özetle.',
    },
    {
      title: '3. Şıkları ele',
      body: Object.keys(choices).length
        ? `Şıklar: ${Object.entries(choices)
            .map(([k, v]) => `${k}) ${v}`)
            .join(' · ')}. Metinde dayanağı olmayanı eler.`
        : 'Şıkları metne götür; metinde olmayan bilgiyi seçme.',
    },
    {
      title: 'Cevap',
      body: 'Şıklar tam görünmüyorsa kadrajı genişletip yeniden dene; kök “anlatım biçimi” ise öyküleme/betimleme ayrımına bak.',
    },
  ];
  return { steps };
}
