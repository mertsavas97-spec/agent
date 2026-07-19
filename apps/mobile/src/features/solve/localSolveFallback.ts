import type { ExamType, SolveQuestionResponse, Subject } from '@/src/lib/api/types';

function defaultTopicId(examType: ExamType, subject: Subject): string {
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
  if (examType === 'kpss') return 'kpss-math-temel-islemler';
  if (examType === 'ygs') return 'ygs-math-temel-kavramlar';
  return 'lgs-math-kesirler';
}

/**
 * Last-resort offline fallback when server + OCR proxy unavailable.
 * User-facing copy only — no deploy shell commands.
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
    input.subjectHint && input.subjectHint !== 'unknown' ? input.subjectHint : 'math';
  const topicId = input.topicId || defaultTopicId(examType, subject);
  const isVerbal = subject === 'turkish' || subject === 'literature';

  const transparencyNote =
    input.reason === 'unsupported'
      ? isVerbal
        ? 'Bu sözel soru tam otomatik çözülemedi. Şıkları da kadraja alıp tekrar dene.'
        : 'Bu kadrajdaki soru otomatik çözülemedi. Daha net bir fotoğraf dene; soru ve şıklar tam görünsün.'
      : 'Şu an otomatik çözüme ulaşılamadı; genel hatırlatma gösteriyoruz. Biraz sonra tekrar dener misin?';

  return {
    attemptId: `local-${input.requestId}`,
    solutionId: `local-sol-${input.requestId}`,
    status: 'solved',
    cached: false,
    topicId,
    subject,
    steps: isVerbal
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
            body: 'Verilenleri ve isteneni ayır. Şıklar ve işlem tamamen kadrajda olsun.',
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
