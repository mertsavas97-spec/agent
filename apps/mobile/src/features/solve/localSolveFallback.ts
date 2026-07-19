import type { ExamType, SolveQuestionResponse, Subject } from '@/src/lib/api/types';

/**
 * Offline / org-policy dogfood fallback when Cloud triggers are not deployed
 * and callable returns 403. Does not burn server quota.
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
      ? 'kpss-math-yuzde'
      : examType === 'ygs'
        ? 'ygs-math-denklemler'
        : 'lgs-math-kesirler';

  const attemptId = `local-${input.requestId}`;
  const solutionId = `local-sol-${input.requestId}`;

  return {
    attemptId,
    solutionId,
    status: 'solved',
    cached: false,
    topicId,
    subject,
    steps: [
      {
        title: '1. Soruyu oku',
        body: 'Verilenleri ve isteneni ayır. Şıkları da framesine al — net kadraj çözüm kalitesini artırır.',
      },
      {
        title: '2. İşlemi kur',
        body:
          subject === 'math' || subject === 'geometry'
            ? 'İşlem / denklem için adım adım yaz: önce sadeleştir, sonra bilinmeyeni yalnız bırak.'
            : 'Metni parçala: ana düşünceyi bul, şıkları metne götürerek ele.',
      },
      {
        title: '3. Kontrol et',
        body: 'Sonucu yerine koyarak veya şıkları eleyerek doğrula.',
      },
      {
        title: 'Not',
        body:
          'Bu çözüm cihaz içi yedek anlatımdır (sunucu tetikleyicisi / callable şu an yanıt vermedi). ' +
          'Canlı AI için Mac’te: bash scripts/deploy-firestore-solve.sh',
      },
    ],
    transparencyNote:
      'Yerel yedek anlatım — sunucu çözümü gelmedi. Kontrol etmeni öneririz. Canlı AI için Functions deploy gerekir.',
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
    /SOLVE_TIMEOUT|403|permission-denied|deploy-firestore-solve|trigger/i.test(
      `${code} ${message}`,
    )
  );
}
