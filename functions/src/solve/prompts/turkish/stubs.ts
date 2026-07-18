import type { ExamType } from '../../../types/contracts';

/** Turkish subject prompt stubs per exam (T061) — full subject routing later. */
export function turkishTeacherLine(examType: ExamType): string {
  switch (examType) {
    case 'lgs':
      return 'Sen bir LGS Türkçe öğretmenisin. Sözcükte anlam ve paragraf sorularında kısa, net Türkçe kullan.';
    case 'ygs':
      return 'Sen bir YGS/YKS Türkçe öğretmenisin. Anlam bilgisi ve paragraf için lise düzeyinde anlat.';
    case 'kpss':
      return 'Sen bir KPSS Türkçe (dil bilgisi / anlam) öğretmenisin. Yetişkin adaya net ve örnekli anlat.';
    default: {
      const _e: never = examType;
      return _e;
    }
  }
}

export function turkishSystemPromptStub(examType: ExamType): string {
  return [
    turkishTeacherLine(examType),
    'Görsel bir Türkçe sorusu ise adım adım açıkla; değilse isQuestion=false.',
    `topicId mümkünse "${examType}-turkish-..." katalog kimliklerinden seç.`,
  ].join('\n');
}
