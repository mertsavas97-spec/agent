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
    return message || 'Çözüm servisine şu an ulaşılamıyor. Biraz sonra tekrar dene.';
  }
  if (
    code === 'functions/permission-denied' ||
    code === 'functions/unauthenticated' ||
    code === 'storage/unauthorized'
  ) {
    return 'Çözüm servisine erişilemiyor. Lütfen biraz sonra tekrar dene.';
  }
  if (code === 'functions/failed-precondition') {
    return message || 'Çözüm şu an hazır değil (Vision / AI yapılandırması).';
  }
  if (code === 'functions/resource-exhausted') {
    return 'Günlük hak veya istek limiti doldu.';
  }
  if (code === 'functions/internal' || code === 'functions/unknown') {
    return message || 'Çözüm üretilemedi. Lütfen tekrar dene.';
  }
  if (
    code === 'functions/deadline-exceeded' ||
    /SOLVE_TIMEOUT/i.test(message)
  ) {
    return 'Çözüm beklenenden uzun sürdü. Lütfen tekrar dene.';
  }
  if (/403|Forbidden|permission/i.test(message) || /403|Forbidden|permission/i.test(code)) {
    return 'Çözüm servisine erişilemiyor. Lütfen biraz sonra tekrar dene.';
  }
  return 'Çözüm şu an üretilemedi. Tekrar dener misin?';
}
