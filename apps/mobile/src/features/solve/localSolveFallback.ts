import type { ExamType, SolveQuestionResponse, Subject } from '@/src/lib/api/types';

/**
 * Last-resort offline fallback when server + OCR proxy unavailable.
 * User-facing copy only — no deploy shell commands.
 */
export function buildLocalSolveFallback(input: {
  examType?: ExamType;
  subjectHint?: Subject;
  requestId: string;
}): SolveQuestionResponse {
  const examType = input.examType ?? 'lgs';
  const subject: Subject =
    input.subjectHint && input.subjectHint !== 'unknown' ? input.subjectHint : 'math';

  const topicId =
    examType === 'kpss'
      ? 'kpss-math-temel-islemler'
      : examType === 'ygs'
        ? 'ygs-math-temel-kavramlar'
        : 'lgs-math-kesirler';

  return {
    attemptId: `local-${input.requestId}`,
    solutionId: `local-sol-${input.requestId}`,
    status: 'solved',
    cached: false,
    topicId,
    subject,
    steps: [
      {
        title: '1. Soruyu oku',
        body: 'Verilenleri ve isteneni ayır. Şıklar ve işlem tamamen kadrajda olsun.',
      },
      {
        title: '2. İşlemi kur',
        body:
          subject === 'math' || subject === 'geometry'
            ? 'Parantez → çarpma/bölme → toplama/çıkarma sırasıyla ilerle. Kesirlerde paydaları dikkat et.'
            : 'Metni parçala; ana düşünceyi bul, şıkları metne götürerek ele.',
      },
      {
        title: '3. Kontrol et',
        body: 'Sonucu yerine koyarak veya şıkları eleyerek doğrula.',
      },
    ],
    transparencyNote:
      'Şu an canlı çözüm sunucusuna ulaşılamadı; genel hatırlatma gösteriyoruz. Biraz sonra tekrar dener misin?',
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
