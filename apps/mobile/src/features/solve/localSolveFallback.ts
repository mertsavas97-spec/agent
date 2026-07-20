import type { ExamType, SolveQuestionResponse, Subject } from '@/src/lib/api/types';

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
  if (subject === 'geography') {
    return examType === 'kpss' ? 'kpss-geography-turkiye' : 'ygs-geography-turkiye';
  }
  if (subject === 'geometry') return 'kpss-geometry-ucgen';
  if (subject === 'civics') return 'kpss-civics-anayasa';
  if (subject === 'traffic') return 'trafik-traffic-kurallar';
  if (subject === 'vehicle') return 'trafik-vehicle-guvenlik';
  if (subject === 'firstaid') return 'trafik-firstaid-temel';
  if (examType === 'trafik') return 'trafik-traffic-kurallar';
  if (examType === 'kpss') return 'kpss-math-temel-islemler';
  if (examType === 'ygs') return 'ygs-math-temel-kavramlar';
  return 'lgs-math-kesirler';
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
}): SolveQuestionResponse {
  const examType = input.examType ?? 'lgs';
  const subject: Subject =
    input.subjectHint && input.subjectHint !== 'unknown'
      ? input.subjectHint
      : input.reason === 'unsupported' || input.reason === 'unavailable'
        ? 'unknown'
        : 'math';

  const topicId =
    input.topicId !== undefined && input.topicId !== null
      ? input.topicId
      : defaultTopicId(examType, subject);
  const isVerbal = subject === 'turkish' || subject === 'literature';
  const isTrafik =
    subject === 'traffic' || subject === 'vehicle' || subject === 'firstaid';
  const isUnknown = subject === 'unknown';

  const transparencyNote =
    input.reason === 'unsupported'
      ? isVerbal
        ? 'Bu sözel soru tam otomatik çözülemedi. Şıkları da net görünecek şekilde yeniden dene.'
        : 'Bu fotoğraftaki soru otomatik çözülemedi. Dersini onayla; soru ve şıklar net olsun.'
      : 'Şu an otomatik çözüme ulaşılamadı; genel hatırlatma gösteriyoruz. Biraz sonra tekrar dener misin?';

  return {
    attemptId: `local-${input.requestId}`,
    solutionId: `local-sol-${input.requestId}`,
    status: 'solved',
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
        ? [
            {
              title: '1. Kökü ayır',
              body: 'Kural, işaret, araç sistemi veya ilk yardım mı isteniyor? Anahtar kelimeyi bul.',
            },
            {
              title: '2. Sahneyi kur',
              body: 'Hız, kavşak, levha veya kazazede durumunu zihninde canlandır; şıkları buna göre ele.',
            },
            {
              title: '3. Güvenliği seç',
              body: 'Trafik ve ilk yardımda “önce güvenlik” ilkesine uymayan şıkkı eler.',
            },
          ]
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
