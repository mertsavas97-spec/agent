/**
 * Deterministic Trafik / ehliyet solvers for dogfood OCR — no LLM.
 */

function parseChoices(ocrText) {
  const map = {};
  const re = /([A-E])\)\s*([^\n]{1,100})/gi;
  let m;
  while ((m = re.exec(ocrText))) {
    const label = m[1].toUpperCase();
    const body = m[2].replace(/\s+/g, ' ').trim();
    if (body && !/^cevab/i.test(body)) map[label] = body;
  }
  return map;
}

function pickChoice(choices, predicates) {
  for (const [label, text] of Object.entries(choices)) {
    const t = text.toLocaleLowerCase('tr-TR');
    if (predicates.some((p) => p.test(t))) return { label, text };
  }
  return null;
}

/**
 * @returns {{ steps: object[], answerLabel?: string, answerText?: string } | null}
 */
export function tryTrafficSolve(ocrText, classification) {
  const subject = classification?.subject;
  if (subject !== 'traffic' && subject !== 'vehicle' && subject !== 'firstaid') {
    return null;
  }

  const text = String(ocrText || '');
  const blob = text.toLocaleLowerCase('tr-TR');
  const choices = parseChoices(text);

  // --- Trafik ışığı: kırmızı + sarı birlikte ---
  if (
    /sarı.*kırmızı|kırmızı.*sarı|kırmızı ve sarı|sarı ve kırmızı/i.test(blob) &&
    /birlikte|yan/i.test(blob)
  ) {
    const hit =
      pickChoice(choices, [
        /hazırlan|harekete hazır|geçişe hazır|kalkışa hazır/i,
      ]) ||
      pickChoice(choices, [/durmalı|beklemeli/i]);
    const answerText = hit?.text ?? 'Harekete / geçişe hazırlanmalı';
    return {
      steps: [
        {
          title: '1. İşareti oku',
          body: 'Işıklı cihazda kırmızı ile sarı birlikte yanıyor — bu, yeşile geçmeden önceki uyarı/hazırlık fazıdır.',
        },
        {
          title: '2. Kural',
          body: 'Sürücü duruşunu korur; kalkışa/geçişe hazırlanır. Hemen gazlayıp geçmez, yolun sağına da çekilmez.',
        },
        {
          title: '3. Şıkları ele',
          body: Object.keys(choices).length
            ? `Şıklar: ${Object.entries(choices)
                .map(([k, v]) => `${k}) ${v}`)
                .join(' · ')}`
            : '“Hazırlanmalı” anlamındaki şıkkı seç; “geçmeli / hızlanmalı”yı ele.',
        },
        {
          title: 'Cevap',
          body: hit
            ? `Doğru şık: ${hit.label}) ${hit.text}`
            : `Doğru yaklaşım: ${answerText}`,
        },
      ],
      answerLabel: hit?.label,
      answerText,
    };
  }

  // --- Şerit kontrol: kırmızı X + yeşil ok ---
  if (
    (/kırmızı\s*[x×]|kırmızı\s*çarpı|kırmızı\s*x/i.test(blob) ||
      /x\s*işaret|çarpı\s*işaret/i.test(blob)) &&
    /yeşil|ok|sağ|yön/i.test(blob)
  ) {
    const hit = pickChoice(choices, [
      /ok.*yön|gösterilen yön|sağa.*devam|ok yönünde|serbest.*ok|okun gösterdiği/i,
      /ilgili şerit|ok.*şerit|yeşil ok/i,
    ]);
    // Fallback: choice mentioning arrow / right / proceed in direction
    const hit2 =
      hit ||
      pickChoice(choices, [/ok/i, /sağ/i, /yönünde git|devam et/i]);
    const answerText =
      hit2?.text ??
      'Kırmızı X olan şerit kullanılmaz; yeşil okun gösterdiği yöne gidilir.';
    return {
      steps: [
        {
          title: '1. İşaretleri ayır',
          body: 'Kırmızı X: o şerit kapalı / kullanılmaz. Yeşil ok: okun gösterdiği yönde ilerlenebilir.',
        },
        {
          title: '2. Sahne',
          body: 'Şerit kontrol lambalarında her ışık ayrı şerit/yön içindir; X ile ok birlikte görünüyorsa anlamları karıştırma.',
        },
        {
          title: '3. Güvenli seçim',
          body: 'X’li şeride girme; ok yönündeki hareket serbestse o yöne devam et.',
        },
        {
          title: 'Cevap',
          body: hit2
            ? `Doğru şık: ${hit2.label}) ${hit2.text}`
            : answerText,
        },
      ],
      answerLabel: hit2?.label,
      answerText,
    };
  }

  // --- Yerleşim yeri hız ---
  if (/yerleşim yeri|azami hız|hız sınırı/i.test(blob) && /km/i.test(blob)) {
    const hit = pickChoice(choices, [/\b50\b/, /elli/]);
    return {
      steps: [
        {
          title: '1. Kök',
          body: 'Yerleşim yeri azami hız (aksi işaret yoksa) soruluyor.',
        },
        {
          title: '2. Kural',
          body: 'Aksi bir hız işareti yoksa yerleşim yerinde genel azami hız 50 km/s’tir.',
        },
        {
          title: 'Cevap',
          body: hit
            ? `Doğru şık: ${hit.label}) ${hit.text}`
            : 'Doğru cevap: 50 km/s',
        },
      ],
      answerLabel: hit?.label,
      answerText: hit?.text ?? '50 km/s',
    };
  }

  // --- ABS ---
  if (/\babs\b/i.test(blob) && subject === 'vehicle') {
    const hit = pickChoice(choices, [
      /kilitlen/i,
      /yön kontrol/i,
      /tekerlek.*kilit/i,
    ]);
    return {
      steps: [
        {
          title: '1. Sistem',
          body: 'ABS, ani frenlemede tekerleklerin kilitlenmesini önler.',
        },
        {
          title: '2. Sonuç',
          body: 'Kilitlenme engellenince sürücü yön kontrolünü koruyabilir.',
        },
        {
          title: 'Cevap',
          body: hit
            ? `Doğru şık: ${hit.label}) ${hit.text}`
            : 'ABS tekerlek kilitlenmesini önler / yön kontrolünü korur.',
        },
      ],
      answerLabel: hit?.label,
      answerText: hit?.text ?? 'Tekerlek kilitlenmesini önlemek',
    };
  }

  // --- İlk yardım ABC ---
  if (
    subject === 'firstaid' &&
    (/bilinç|abc|hava yolu|solunum|dolaşım/i.test(blob) ||
      /ilk kontrol sırası/i.test(blob))
  ) {
    const hit = pickChoice(choices, [
      /hava yolu.*solunum.*dolaşım/i,
      /\babc\b/i,
    ]);
    return {
      steps: [
        {
          title: '1. Öncelik',
          body: 'Önce kendi ve olay yeri güvenliği, sonra kazazede.',
        },
        {
          title: '2. ABC',
          body: 'Hava yolu → solunum → dolaşım sırası izlenir.',
        },
        {
          title: 'Cevap',
          body: hit
            ? `Doğru şık: ${hit.label}) ${hit.text}`
            : 'Hava yolu → solunum → dolaşım (ABC)',
        },
      ],
      answerLabel: hit?.label,
      answerText: hit?.text ?? 'Hava yolu → solunum → dolaşım (ABC)',
    };
  }

  // --- Generic trafik with choices: pick safety-first heuristic only if stem is clear ---
  if (Object.keys(choices).length >= 2 && /sürücü|yapmalıdır|hangisi/i.test(blob)) {
    const safety = pickChoice(choices, [
      /durmalı|yavaşlamalı|öncelik vermeli|emniyet|kemer|hazırlanmalı/i,
    ]);
    if (safety && /trafik|ışık|işaret|kavşak|şerit|hız/i.test(blob)) {
      return {
        steps: [
          {
            title: '1. Kökü ayır',
            body: 'Kural / işaret / şerit / hız — sorunun anahtarını bul.',
          },
          {
            title: '2. Güvenlik',
            body: 'Trafikte “önce güvenlik” ilkesine uymayan şıkları ele.',
          },
          {
            title: '3. Seçim',
            body: `En güvenli / kurala uygun şık: ${safety.label}) ${safety.text}`,
          },
          {
            title: 'Cevap',
            body: `Doğru şık: ${safety.label}) ${safety.text}`,
          },
        ],
        answerLabel: safety.label,
        answerText: safety.text,
      };
    }
  }

  return null;
}
