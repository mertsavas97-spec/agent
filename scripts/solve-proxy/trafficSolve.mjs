/**
 * Deterministic Trafik / ehliyet solvers for dogfood OCR — no LLM.
 * Each hit returns subject + topicKey so konu anlatımı doğru branşa bağlanır.
 */

function parseChoices(ocrText) {
  const map = {};
  const text = String(ocrText || '');

  // Multiline blocks: A)\nI. Şaft\nII. ... until next letter or end
  const multi = /([A-E])\)\s*\n([\s\S]*?)(?=(?:^|\n)\s*[A-E]\)|$)/gim;
  let m;
  while ((m = multi.exec(text))) {
    const label = m[1].toUpperCase();
    const body = m[2]
      .replace(/\s+/g, ' ')
      .replace(/\bABONE\b.*$/i, '')
      .trim();
    if (body.length >= 3 && !/^cevab/i.test(body)) map[label] = body.slice(0, 160);
  }

  // Inline A) text on same line
  const re = /([A-E])\)\s*([^\n]{1,120})/gi;
  while ((m = re.exec(text))) {
    const label = m[1].toUpperCase();
    if (map[label]) continue;
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

function tag(result, subject, topicKey) {
  return { ...result, subject, topicKey };
}

const LOOKS_TRAFFIC =
  /trafik|hız sınırı|azami hız|kavşak|geçiş üstünlüğü|ehliyet|levha|ışıklı trafik|trafik işaret|sürücü ne yapmalı|sarı ve kırmızı|kırmızı ışık|yeşil ışık|emniyet şeridi|sollama|park yasağı|abs|esp|emniyet kemeri|hava yastığı|ilk yardım|kanama|kazazede|şaft|diferansiyel|güç aktarma|\baks\b/i;

/**
 * @returns {{
 *   steps: object[],
 *   answerLabel?: string,
 *   answerText?: string,
 *   subject?: string,
 *   topicKey?: string,
 * } | null}
 */
export function tryTrafficSolve(ocrText, classification) {
  const text = String(ocrText || '');
  const subject = classification?.subject;
  const branşOk =
    subject === 'traffic' || subject === 'vehicle' || subject === 'firstaid';
  if (!branşOk && !LOOKS_TRAFFIC.test(text)) {
    return null;
  }

  const blob = text.toLocaleLowerCase('tr-TR');
  const choices = parseChoices(text);
  const prepHit = pickChoice(choices, [
    /hazırlan|harekete hazır|geçişe hazır|kalkışa hazır/i,
  ]);

  // --- Trafik ışığı: kırmızı + sarı (hazırlık) ---
  const redYellowPhrase =
    /sarı.*kırmızı|kırmızı.*sarı|kırmızı ve sarı|sarı ve kırmızı/i.test(blob);
  const lightDevice = /ışıklı|trafik işaret cihaz|sinyal/i.test(blob);
  if (
    (redYellowPhrase && /birlikte|yan/i.test(blob)) ||
    (lightDevice && /sarı|kırmızı/i.test(blob) && prepHit)
  ) {
    const hit = prepHit || pickChoice(choices, [/durmalı|beklemeli/i]);
    const answerText = hit?.text ?? 'Harekete / geçişe hazırlanmalı';
    return tag(
      {
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
      },
      'traffic',
      'kurallar',
    );
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
    const hit2 =
      hit || pickChoice(choices, [/ok/i, /sağ/i, /yönünde git|devam et/i]);
    const answerText =
      hit2?.text ??
      'Kırmızı X olan şerit kullanılmaz; yeşil okun gösterdiği yöne gidilir.';
    return tag(
      {
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
      },
      'traffic',
      'kurallar',
    );
  }

  // --- Yerleşim yeri hız ---
  if (/yerleşim yeri|azami hız|hız sınırı/i.test(blob) && /km/i.test(blob)) {
    const hit = pickChoice(choices, [/\b50\b/, /elli/]);
    return tag(
      {
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
      },
      'traffic',
      'hiz-mesafe',
    );
  }

  // --- Güç aktarma: şaft / diferansiyel / aks → Araç Tekniği ---
  if (/şaft|saft|diferansiyel|güç aktarma|aktarma organ/i.test(blob)) {
    const hit = pickChoice(choices, [
      /şaft.*diferansiyel.*aks|saft.*diferansiyel.*aks|i\.\s*şaft.*ii\.\s*diferansiyel.*iii\.\s*aks/i,
    ]);
    let bestLabel = hit?.label;
    let bestText = hit?.text;
    if (!bestLabel) {
      // Prefer the classic order even when OCR wraps lines
      for (const [label, text] of Object.entries(choices)) {
        const n = text.toLocaleLowerCase('tr-TR');
        const hasShaft = /şaft|saft/.test(n);
        const hasDiff = /diferansiyel/.test(n);
        const hasAks = /\baks\b/.test(n);
        const order =
          n.search(/şaft|saft/) < n.search(/diferansiyel/) &&
          n.search(/diferansiyel/) < n.search(/\baks\b/);
        if (hasShaft && hasDiff && hasAks && order) {
          bestLabel = label;
          bestText = text;
          break;
        }
      }
    }
    if (!bestLabel) {
      const block = text.match(
        /([A-E])\)\s*I\.\s*Şaft\s*II\.\s*Diferansiyel\s*III\.\s*Aks/i,
      );
      if (block) {
        bestLabel = block[1].toUpperCase();
        bestText = 'I. Şaft · II. Diferansiyel · III. Aks';
      }
    }
    const answerText = bestText ?? 'I. Şaft, II. Diferansiyel, III. Aks';
    return tag(
      {
        steps: [
          {
            title: '1. Güç yolu',
            body: 'Motor → şanzıman sonrası güç şaft ile diferansiyele, oradan aks ile tekerleklere gider.',
          },
          {
            title: '2. Sıra',
            body: 'Doğru adlar: I. Şaft, II. Diferansiyel, III. Aks.',
          },
          {
            title: 'Cevap',
            body: bestLabel
              ? `Doğru şık: ${bestLabel}) ${answerText}`
              : `Doğru sıra: ${answerText}`,
          },
        ],
        answerLabel: bestLabel,
        answerText,
      },
      'vehicle',
      'motor',
    );
  }

  // --- ABS ---
  if (/\babs\b/i.test(blob)) {
    const hit = pickChoice(choices, [
      /kilitlen/i,
      /yön kontrol/i,
      /tekerlek.*kilit/i,
    ]);
    return tag(
      {
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
      },
      'vehicle',
      'guvenlik',
    );
  }

  // --- İlk yardım ABC ---
  if (
    /bilinç|abc|hava yolu|solunum|dolaşım|ilk yardım|kazazede/i.test(blob) &&
    (/ilk kontrol|sıra|abc/i.test(blob) || subject === 'firstaid')
  ) {
    const hit = pickChoice(choices, [
      /hava yolu.*solunum.*dolaşım/i,
      /\babc\b/i,
    ]);
    return tag(
      {
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
      },
      'firstaid',
      'abc',
    );
  }

  // --- Generic trafik (son çare) — ışıklı hazırlık sorularını çalma ---
  if (
    Object.keys(choices).length >= 2 &&
    /sürücü|yapmalıdır|hangisi/i.test(blob) &&
    !prepHit
  ) {
    const safety = pickChoice(choices, [
      /durmalı|yavaşlamalı|öncelik vermeli|emniyet|kemer/i,
    ]);
    if (safety && /trafik|ışık|işaret|kavşak|şerit|hız/i.test(blob)) {
      return tag(
        {
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
        },
        'traffic',
        'kurallar',
      );
    }
  }

  return null;
}
