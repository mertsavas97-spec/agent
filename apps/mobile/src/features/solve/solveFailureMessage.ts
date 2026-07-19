import { FirebaseError } from 'firebase/app';

/** Map solve/upload failures to short Turkish copy for the error screen. */
export function solveFailureMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    const code = err.code;
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
      return err.message || 'Çözüm şu an hazır değil (Vision / AI yapılandırması).';
    }
    if (code === 'functions/resource-exhausted') {
      return 'Günlük hak veya istek limiti doldu.';
    }
    if (code === 'functions/internal' || code === 'functions/unknown') {
      return 'Sunucu hatası. Network veya Functions loglarına bak.';
    }
  }
  const msg = err instanceof Error ? err.message : '';
  if (/403|Forbidden|permission/i.test(msg)) {
    return 'Sunucu erişim engeli (403). Cloud Functions IAM / org policy.';
  }
  return 'Çözüm şu an üretilemedi. Tekrar dener misin?';
}
