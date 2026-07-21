import type { SolutionStep } from '@/src/lib/api/types';

export type SolutionAnswer = {
  /** Choice letter when known, e.g. "E" */
  label?: string;
  /** Display text, e.g. "öyküleme" or "7" */
  text: string;
};

/** Pull a display answer from API field or the trailing "Cevap" step. */
export function resolveSolutionAnswer(
  answer: SolutionAnswer | null | undefined,
  steps: SolutionStep[],
): SolutionAnswer | null {
  if (answer?.text?.trim()) {
    return {
      label: answer.label?.trim() || undefined,
      text: answer.text.trim(),
    };
  }
  return extractAnswerFromSteps(steps);
}

export function extractAnswerFromSteps(steps: SolutionStep[]): SolutionAnswer | null {
  const answerStep = [...steps]
    .reverse()
    .find((s) => {
      const t = (s.title ?? '').trim();
      return (
        /^(cevap|sonuç|doğru)/i.test(t) ||
        /\b(cevap|sonuç)\b/i.test(t) ||
        /^doğru\s+(şık|cevap|yaklaşım|sıra)/i.test(t)
      );
    });
  const body = (answerStep?.body ?? '').trim();
  if (!body) return null;

  const choice = body.match(
    /Doğru şık\s*[:：]\s*([A-E])\)\s*(.+)$/im,
  );
  if (choice) {
    return { label: choice[1].toUpperCase(), text: choice[2].replace(/\.\s*$/, '').trim() };
  }

  const choiceBare = body.match(
    /Doğru şık\s*[:：]?\s*([A-E])\b(?:\s*[)．.]?\s*(.+))?$/im,
  );
  if (choiceBare) {
    return {
      label: choiceBare[1].toUpperCase(),
      text: (choiceBare[2] ?? choiceBare[1]).replace(/\.\s*$/, '').trim(),
    };
  }

  const dogruYaklasim = body.match(
    /Doğru\s+(?:yaklaşım|sıra|cevap)\s*[:：]\s*(.+)$/im,
  );
  if (dogruYaklasim) {
    const text = dogruYaklasim[1].replace(/\.\s*$/, '').trim();
    if (text) return { text };
  }

  const cevapLetter = body.match(/Cevap\s+([A-E])\b/i);
  if (cevapLetter) {
    return { label: cevapLetter[1].toUpperCase(), text: cevapLetter[1].toUpperCase() };
  }

  const anlatim = body.match(
    /(?:En uygun anlatım biçimi|anlatım biçimi)\s*[:：]?\s*([a-zA-ZçğıöşüÇĞİÖŞÜ]+)/i,
  );
  if (anlatim) {
    return { text: anlatim[1].trim() };
  }

  const anlamIlgisi = body.match(
    /Anlam ilgisi\s*[:：]\s*([a-zA-ZçğıöşüÇĞİÖŞÜ0-9\-]+)/i,
  );
  if (anlamIlgisi) {
    return { text: anlamIlgisi[1].trim() };
  }

  const sonuc = body.match(/Sonuç\s*[:：]?\s*([0-9]+(?:\/[0-9]+)?)/i);
  if (sonuc) {
    return { text: sonuc[1] };
  }

  // Last resort: short body from an explicit Cevap/Sonuç step only (never tip cards)
  const cleaned = body
    .replace(/Şıklar kadrajda değilse[^.]*\./gi, '')
    .replace(/Sonucu şıklarla[^.]*\./gi, '')
    .trim();
  if (
    cleaned.length > 0 &&
    cleaned.length <= 80 &&
    !/yeniden dene|kadraj|hatırlat|onayla|ele\.|tercih et|düzenlenir|doğrula/i.test(
      cleaned,
    )
  ) {
    return { text: cleaned };
  }
  return null;
}

/** Reasoning steps only — drop the final "Cevap" card (shown in hero). */
export function reasoningSteps(steps: SolutionStep[]): SolutionStep[] {
  const filtered = steps.filter((s) => {
    const t = (s.title ?? '').trim();
    return !/^(cevap|sonuç)$/i.test(t) && !/\bcevap\b/i.test(t);
  });
  return filtered.length > 0 ? filtered : steps;
}

/** Short-tab copy: answer first, then one why line from reasoning. */
export function buildShortSummary(
  answer: SolutionAnswer | null,
  steps: SolutionStep[],
): string {
  const reason = reasoningSteps(steps);
  const why =
    reason.length > 0
      ? reason[reason.length - 1]?.body?.trim()
      : undefined;

  if (answer) {
    const head = answer.label
      ? `Cevap: ${answer.label}) ${answer.text}`
      : `Cevap: ${answer.text}`;
    if (why && !why.toLowerCase().includes(answer.text.toLowerCase().slice(0, 8))) {
      return `${head}\n\n${why}`;
    }
    if (why) return `${head}\n\n${why}`;
    return head;
  }

  if (reason.length === 0) {
    return steps.map((s, i) => `${i + 1}) ${s.body}`).join('\n\n');
  }
  return reason.map((s, i) => `${i + 1}) ${s.body}`).join('\n\n');
}

export function formatAnswerDisplay(answer: SolutionAnswer): string {
  if (answer.label) return `${answer.label}) ${answer.text}`;
  return answer.text;
}
