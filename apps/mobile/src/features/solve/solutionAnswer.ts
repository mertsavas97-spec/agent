import type { SolutionStep } from '@/src/lib/api/types';

export type SolutionAnswer = {
  /** Choice letter when known, e.g. "E" */
  label?: string;
  /** Display text, e.g. "öyküleme" or "7" */
  text: string;
};

/** Pull a display answer from API field or trailing Cevap / last-step bodies. */
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
  if (answer?.label?.trim()) {
    const label = answer.label.trim().toUpperCase();
    return { label, text: label };
  }
  return extractAnswerFromSteps(steps);
}

function extractFromBody(
  body: string,
  opts: { allowShortFallback: boolean },
): SolutionAnswer | null {
  const trimmed = body.trim();
  if (!trimmed) return null;

  const choice = trimmed.match(
    /Doğru şık\s*[:：]\s*([A-E])\)\s*(.+)$/im,
  );
  if (choice) {
    return { label: choice[1].toUpperCase(), text: choice[2].replace(/\.\s*$/, '').trim() };
  }

  const choiceBare = trimmed.match(
    /Doğru şık\s*[:：]?\s*([A-E])\b(?:\s*[)．.]?\s*(.+))?$/im,
  );
  if (choiceBare) {
    return {
      label: choiceBare[1].toUpperCase(),
      text: (choiceBare[2] ?? choiceBare[1]).replace(/\.\s*$/, '').trim(),
    };
  }

  const dogruYaklasim = trimmed.match(
    /Doğru\s+(?:yaklaşım|sıra|cevap)\s*[:：]\s*(.+)$/im,
  );
  if (dogruYaklasim) {
    const text = dogruYaklasim[1].replace(/\.\s*$/, '').trim();
    if (text) return { text };
  }

  const cevapLetter = trimmed.match(/Cevap\s*[:：]?\s*([A-E])\b/i);
  if (cevapLetter) {
    return { label: cevapLetter[1].toUpperCase(), text: cevapLetter[1].toUpperCase() };
  }

  const anlatim = trimmed.match(
    /(?:En uygun anlatım biçimi|anlatım biçimi)\s*[:：]?\s*([a-zA-ZçğıöşüÇĞİÖŞÜ]+)/i,
  );
  if (anlatim) {
    return { text: anlatim[1].trim() };
  }

  const anlamIlgisi = trimmed.match(
    /Anlam ilgisi\s*[:：]\s*([a-zA-ZçğıöşüÇĞİÖŞÜ0-9\-]+)/i,
  );
  if (anlamIlgisi) {
    return { text: anlamIlgisi[1].trim() };
  }

  // Explicit "Sonuç:" with numeric/short value — not "Sonucu yerine koy…"
  const sonuc = trimmed.match(/Sonuç\s*[:：]\s*([0-9]+(?:\/[0-9]+)?|[^\n.]{1,40})\s*$/im);
  if (sonuc) {
    return { text: sonuc[1].replace(/\.\s*$/, '').trim() };
  }

  const bareEnd = trimmed.match(/(?:→|->|=)\s*([A-E])\s*$/i);
  if (bareEnd) {
    return { label: bareEnd[1].toUpperCase(), text: bareEnd[1].toUpperCase() };
  }

  if (!opts.allowShortFallback) return null;

  const cleaned = trimmed
    .replace(/Şıklar kadrajda değilse[^.]*\./gi, '')
    .replace(/Sonucu şıklarla[^.]*\./gi, '')
    .trim();
  if (
    cleaned.length > 0 &&
    cleaned.length <= 80 &&
    !/yeniden dene|kadraj|hatırlat|onayla|ele\.|tercih et|düzenlenir|doğrula|ayır|eşitle/i.test(
      cleaned,
    )
  ) {
    return { text: cleaned };
  }
  return null;
}

export function extractAnswerFromSteps(steps: SolutionStep[]): SolutionAnswer | null {
  const titled = [...steps]
    .reverse()
    .find((s) => {
      const t = (s.title ?? '').trim();
      return (
        /^(cevap|sonuç|doğru)/i.test(t) ||
        /\b(cevap|sonuç)\b/i.test(t) ||
        /^doğru\s+(şık|cevap|yaklaşım|sıra)/i.test(t)
      );
    });
  if (titled?.body) {
    const fromTitle = extractFromBody(titled.body, { allowShortFallback: true });
    if (fromTitle) return fromTitle;
  }

  // Untitled steps: only strong patterns (Doğru şık / Cevap A / Sonuç: n) — never tip prose
  for (const step of [...steps].reverse().slice(0, 2)) {
    const fromBody = extractFromBody(step.body ?? '', { allowShortFallback: false });
    if (fromBody) return fromBody;
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
