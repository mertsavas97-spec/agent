import type { ExamType, SolveQuestionResponse, Subject } from '@/src/lib/api/types';

import { classifyTrafikBranchFromText } from './trafikBranchFromText';

function defaultTopicId(examType: ExamType, subject: Subject): string | null {
  if (subject === 'unknown') return null;
  if (subject === 'turkish') {
    return examType === 'kpss'
      ? 'kpss-turkish-paragraf'
      : examType === 'ygs'
        ? 'ygs-turkish-paragraf'
        : 'lgs-turkish-paragraf';
  }
  if (subject === 'history') {
    return examType === 'kpss'
      ? 'kpss-history-inkilap'
      : examType === 'ygs'
        ? 'ygs-history-inkilap'
        : 'lgs-history-inkilaplar';
  }
  if (subject === 'science') {
    return 'lgs-science-enerji';
  }
  if (subject === 'physics') return 'ygs-physics-hareket';
  if (subject === 'chemistry') return 'ygs-chemistry-atom';
  if (subject === 'biology') return 'ygs-biology-hucre';
  if (subject === 'geography') {
    return examType === 'kpss' ? 'kpss-geography-turkiye' : 'ygs-geography-turkiye';
  }
  if (subject === 'geometry') return 'kpss-geometry-ucgen';
  if (subject === 'civics') return 'kpss-civics-anayasa';
  if (subject === 'traffic') return 'trafik-traffic-kurallar';
  if (subject === 'vehicle') return 'trafik-vehicle-motor';
  if (subject === 'firstaid') return 'trafik-firstaid-abc';
  if (examType === 'trafik') return 'trafik-traffic-kurallar';
  if (examType === 'kpss') return 'kpss-math-temel-islemler';
  if (examType === 'ygs') return 'ygs-math-temel-kavramlar';
  return 'lgs-math-kesirler';
}

function trafikSteps(subject: Subject): { title: string; body: string }[] {
  if (subject === 'vehicle') {
    return [
      {
        title: '1. Sistemi tanı',
        body: 'Motor, güç aktarma (şaft / diferansiyel / aks), fren, elektrik veya güvenlik sistemi mi soruluyor?',
      },
      {
        title: '2. Parçaları sırayla düşün',
        body: 'Güç yolu genelde motor → şanzıman → şaft → diferansiyel → aks → tekerlek şeklindedir.',
      },
      {
        title: '3. Şıkları ele',
        body: 'Yanlış sıralı veya yanlış adlı parçaları eleyen şıkkı seç. Net çözülemezse fotoğrafı daha keskin çek.',
      },
    ];
  }
  if (subject === 'firstaid') {
    return [
      {
        title: '1. Öncelik',
        body: 'Önce kendi ve olay yeri güvenliği, sonra kazazede.',
      },
      {
        title: '2. ABC',
        body: 'Hava yolu → solunum → dolaşım; bilinç kontrolü ses + hafif uyaran ile yapılır.',
      },
      {
        title: '3. 112',
        body: 'Gerekirse 112’ye konum ve durum bildir; gereksiz hareket ettirme.',
      },
    ];
  }
  return [
    {
      title: '1. Kuralı bul',
      body: 'İşaret, şerit, hız, kavşak veya geçiş üstünlüğü mü isteniyor? Anahtar kelimeyi ayır.',
    },
    {
      title: '2. Sahneyi kur',
      body: 'Hız, kavşak veya levha durumunu zihninde canlandır; şıkları buna göre ele.',
    },
    {
      title: '3. Güvenliği seç',
      body: '“Önce güvenlik” ilkesine uymayan şıkkı eleyen seçeneği tercih et.',
    },
  ];
}

/**
 * Last-resort offline fallback when server + OCR proxy unavailable.
 * User-facing copy only — no deploy shell commands.
 * Never silently force Matematik when subject is unknown.
 */
export function buildLocalSolveFallback(input: {
  examType?: ExamType;
  subjectHint?: Subject;
  topicId?: string | null;
  requestId: string;
  /** Why we fell back — tweaks user-facing transparency copy */
  reason?: 'unavailable' | 'unsupported';
  /** OCR / stem snippet — locks Ehliyet branş correctly */
  ocrText?: string | null;
}): SolveQuestionResponse {
  const examType = input.examType ?? 'lgs';
  const hint = input.subjectHint && input.subjectHint !== 'unknown' ? input.subjectHint : null;
  const trafikSubjects = new Set<Subject>(['traffic', 'vehicle', 'firstaid']);

  const fromOcr =
    examType === 'trafik' && input.ocrText
      ? classifyTrafikBranchFromText(input.ocrText)
      : null;

  let subject: Subject =
    fromOcr?.subject ??
    hint ??
    (examType === 'trafik'
      ? 'traffic'
      : input.reason === 'unsupported' || input.reason === 'unavailable'
        ? 'unknown'
        : 'math');

  // Never cross packages in offline fallback
  if (examType === 'trafik' && !trafikSubjects.has(subject) && subject !== 'unknown') {
    subject = fromOcr?.subject ?? 'traffic';
  } else if (examType !== 'trafik' && trafikSubjects.has(subject)) {
    subject = 'turkish';
  }

  let topicId =
    fromOcr?.topicId ??
    (input.topicId !== undefined && input.topicId !== null
      ? input.topicId
      : defaultTopicId(examType, subject));

  if (examType === 'trafik') {
    if (!topicId || !topicId.startsWith('trafik-')) {
      topicId = defaultTopicId(examType, subject) ?? 'trafik-traffic-kurallar';
    }
  } else if (topicId?.startsWith('trafik-')) {
    topicId = defaultTopicId(examType, subject);
  }
  const isVerbal = subject === 'turkish' || subject === 'literature';
  const isTrafik =
    subject === 'traffic' || subject === 'vehicle' || subject === 'firstaid';
  const isUnknown = subject === 'unknown';

  const transparencyNote =
    input.reason === 'unsupported'
      ? isVerbal
        ? 'Bu sözel soru tam otomatik çözülemedi. Şıkları da net görünecek şekilde yeniden dene.'
        : isTrafik
          ? 'Bu ehliyet sorusu tam otomatik çözülemedi. Konu branşı fotoğraftan kilitlendi; şıklar net görünsün diye yeniden dene.'
          : 'Bu fotoğraftaki soru otomatik çözülemedi. Dersini onayla; soru ve şıklar net olsun.'
      : 'Şu an otomatik çözüme ulaşılamadı; branşa uygun hatırlatma gösteriyoruz. Biraz sonra tekrar dener misin?';

  return {
    attemptId: `local-${input.requestId}`,
    solutionId: `local-sol-${input.requestId}`,
    status: 'solved',
    /** Tip-only — never invent a final answer */
    assisted: true,
    cached: false,
    topicId,
    subject,
    steps: isUnknown
      ? [
          {
            title: '1. Dersi onayla',
            body: 'Önce doğru dersi seç — yanlış Matematik etiketi yapıştırmıyoruz.',
          },
          {
            title: '2. Soruyu oku',
            body: 'Kök cümleyi ve şıkları ayır; fotoğrafta tam görünsünler.',
          },
          {
            title: '3. Tekrar dene',
            body: 'Ders netleşince adımlar o derse göre düzenlenir.',
          },
        ]
      : isTrafik
        ? trafikSteps(subject)
        : isVerbal
          ? [
              {
                title: '1. Soru kökünü bul',
                body: 'Ana fikir, anlatım biçimi, çıkarım veya dil bilgisi mi isteniyor? Kök cümleyi ayır.',
              },
              {
                title: '2. Metni tara',
                body: 'Şıkları kendi bilginle değil metne götürerek ele; dayanağı olmayanı çıkar.',
              },
              {
                title: '3. Kontrol et',
                body: 'Seçtiğin şık metindeki bir cümleyle desteklenebiliyor mu? Destek yoksa eler.',
              },
            ]
          : [
              {
                title: '1. Soruyu oku',
                body: 'Verilenleri ve isteneni ayır. Şıklar ve işlem fotoğrafta tam görünsün.',
              },
              {
                title: '2. İşlemi kur',
                body:
                  subject === 'math' || subject === 'geometry'
                    ? 'Parantez → çarpma/bölme → toplama/çıkarma sırasıyla ilerle. Kesirlerde paydaları dikkat et.'
                    : 'Verilenleri maddele; soru köküne göre eleme yap.',
              },
              {
                title: '3. Kontrol et',
                body: 'Sonucu yerine koyarak veya şıkları eleyerek doğrula.',
              },
            ],
    transparencyNote,
    quota: { remainingToday: 5, unlimited: false },
  };
}

export function isServerSolveUnavailable(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code =
    'code' in err && typeof (err as { code: unknown }).code === 'string'
      ? (err as { code: string }).code
      : '';
  const message = err instanceof Error ? err.message : String(err);
  return (
    code === 'functions/deadline-exceeded' ||
    code === 'functions/permission-denied' ||
    code === 'functions/unavailable' ||
    code === 'functions/unauthenticated' ||
    /SOLVE_TIMEOUT|SOLVE_TRIGGER|403|permission-denied|trigger/i.test(`${code} ${message}`)
  );
}

/** Local / proxy solutions cannot call explainAgain callable. */
export function isOfflineSolutionId(solutionId: string | null | undefined): boolean {
  if (!solutionId) return true;
  return (
    solutionId.startsWith('local-') ||
    solutionId.startsWith('proxy-')
  );
}
