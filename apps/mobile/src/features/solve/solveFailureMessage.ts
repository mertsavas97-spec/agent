/** Map solve/upload failures to short Turkish copy for the error screen. */
export function solveFailureMessage(err: unknown): string {
  const code =
    err && typeof err === 'object' && 'code' in err && typeof (err as { code: unknown }).code === 'string'
      ? (err as { code: string }).code
      : '';
  const message = err instanceof Error ? err.message : '';

  if (
    code === 'functions/not-found' ||
    code === 'functions/unavailable' ||
    code.includes('not-found')
  ) {
    return 'Çözüm sunucusu bulunamadı. Functions deploy / bölge kontrol et.';
  }
  if (
    code === 'functions/permission-denied' ||
    code === 'functions/unauthenticated' ||
    code === 'storage/unauthorized'
  ) {
    return 'Sunucu erişim engeli (403). Cloud Functions IAM / org policy — solveQuestion çağrılamıyor.';
  }
  if (code === 'functions/failed-precondition') {
    return message || 'Çözüm şu an hazır değil (Vision / AI yapılandırması).';
  }
  if (code === 'functions/resource-exhausted') {
    return 'Günlük hak veya istek limiti doldu.';
  }
  if (code === 'functions/internal' || code === 'functions/unknown') {
    return 'Sunucu hatası. Network veya Functions loglarına bak.';
  }
  if (
    code === 'functions/deadline-exceeded' ||
    /SOLVE_TIMEOUT/i.test(message)
  ) {
    return 'Çözüm zaman aşımı. Mac’te deploy-firestore-solve.sh çalıştır (onSolveUploadFinalized), sonra tekrar dene.';
  }
  if (/403|Forbidden|permission/i.test(message) || /403|Forbidden|permission/i.test(code)) {
    return 'Sunucu erişim engeli (403). Cloud Functions IAM / org policy.';
  }
  return 'Çözüm şu an üretilemedi. Tekrar dener misin?';
}
