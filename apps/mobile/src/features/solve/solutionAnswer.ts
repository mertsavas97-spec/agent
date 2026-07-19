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
    .find((s) => /^(cevap|sonuç|doğru)/i.test((s.title ?? '').trim()));
  const body = (answerStep?.body ?? steps[steps.length - 1]?.body ?? '').trim();
  if (!body) return null;

  const choice = body.match(/Doğru şık:\s*([A-E])\)\s*(.+?)(?:\.|$)/i);
  if (choice) {
    return { label: choice[1].toUpperCase(), text: choice[2].trim() };
  }

  const anlatim = body.match(
    /(?:En uygun anlatım biçimi|anlatım biçimi)\s*[:：]?\s*([a-zA-ZçğıöşüÇĞİÖŞÜ]+)/i,
  );
  if (anlatim) {
    return { text: anlatim[1].trim() };
  }

  const sonuc = body.match(/Sonuç\s*[:：]?\s*([0-9]+(?:\/[0-9]+)?)/i);
  if (sonuc) {
    return { text: sonuc[1] };
  }

  // Last resort: short body without instructional tail
  const cleaned = body
    .replace(/Şıklar kadrajda değilse[^.]*\./gi, '')
    .replace(/Sonucu şıklarla[^.]*\./gi, '')
    .trim();
  if (cleaned.length > 0 && cleaned.length <= 48) {
    return { text: cleaned };
  }
  return null;
}

/** Reasoning steps only — drop the final "Cevap" card (shown in hero). */
export function reasoningSteps(steps: SolutionStep[]): SolutionStep[] {
  const filtered = steps.filter((s) => !/^(cevap|sonuç)$/i.test((s.title ?? '').trim()));
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
