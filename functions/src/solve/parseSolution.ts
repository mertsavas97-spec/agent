import { isKnownSubject } from '../data/subjects';
import type { SolutionAnswer, SolutionStep, Subject } from '../types/contracts';

export type ParsedModelSolution = {
  isQuestion: boolean;
  unsupported: boolean;
  unsupportedReason: string | null;
  subject: Subject;
  topicId: string | null;
  steps: SolutionStep[];
  answer?: SolutionAnswer;
};

export function stripFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fenced ? fenced[1].trim() : trimmed;
}

/** Best-effort repair before JSON.parse (fence, slice, trailing commas). */
export function repairJsonText(text: string): string {
  let t = stripFences(text);
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start >= 0 && end > start) {
    t = t.slice(start, end + 1);
  }
  t = t.replace(/,\s*([\]}])/g, '$1');
  return t;
}

function parseAnswerField(raw: unknown): SolutionAnswer | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const obj = raw as { label?: unknown; text?: unknown };
  const text = typeof obj.text === 'string' ? obj.text.trim() : '';
  if (!text) return undefined;
  const label =
    typeof obj.label === 'string' && obj.label.trim()
      ? obj.label.trim().toUpperCase().slice(0, 1)
      : undefined;
  return label ? { label, text } : { text };
}

function extractFromBody(
  body: string,
  opts: { allowShortFallback?: boolean } = {},
): SolutionAnswer | null {
  if (!body) return null;

  const choice = body.match(/Doğru şık\s*[:：]\s*([A-E])\)\s*(.+)$/im);
  if (choice) {
    return {
      label: choice[1].toUpperCase(),
      text: choice[2].replace(/\.\s*$/, '').trim(),
    };
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

  const cevapLetter = body.match(/Cevap\s*[:：]?\s*([A-E])\b/i);
  if (cevapLetter) {
    return { label: cevapLetter[1].toUpperCase(), text: cevapLetter[1].toUpperCase() };
  }

  const sonuc = body.match(/Sonuç\s*[:：]\s*([0-9]+(?:\/[0-9]+)?|[^\n.]{1,40})\s*$/im);
  if (sonuc) {
    return { text: sonuc[1].replace(/\.\s*$/, '').trim() };
  }

  if (!opts.allowShortFallback) return null;

  const cleaned = body
    .replace(/Şıklar kadrajda değilse[^.]*\./gi, '')
    .trim();
  if (
    cleaned.length > 0 &&
    cleaned.length <= 80 &&
    !/yeniden dene|kadraj|hatırlat|onayla|doğrula|ayır|eşitle/i.test(cleaned)
  ) {
    return { text: cleaned };
  }
  return null;
}

/** Pull answer from a dedicated Cevap/Sonuç step when JSON omitted `answer`. */
export function extractAnswerFromSteps(steps: SolutionStep[]): SolutionAnswer | undefined {
  const answerStep = [...steps]
    .reverse()
    .find((s) => {
      const t = (s.title ?? '').trim();
      return /^(cevap|sonuç|doğru)/i.test(t) || /\b(cevap|sonuç)\b/i.test(t);
    });
  if (answerStep?.body) {
    const fromTitle = extractFromBody(answerStep.body, { allowShortFallback: true });
    if (fromTitle) return fromTitle;
  }
  for (const step of [...steps].reverse().slice(0, 2)) {
    const fromBody = extractFromBody(step.body ?? '', { allowShortFallback: false });
    if (fromBody) return fromBody;
  }
  return undefined;
}

function mapParsed(data: Partial<ParsedModelSolution> & { answer?: unknown }): ParsedModelSolution {
  const steps = Array.isArray(data.steps)
    ? data.steps
        .filter((s) => s && typeof s.body === 'string' && s.body.trim().length > 0)
        .map((s) => ({
          title: typeof s.title === 'string' ? s.title : undefined,
          body: String(s.body),
        }))
    : [];

  const subject: Subject = isKnownSubject(data.subject)
    ? data.subject
    : 'unknown';

  const answer =
    parseAnswerField(data.answer) ?? extractAnswerFromSteps(steps);

  return {
    isQuestion: Boolean(data.isQuestion),
    unsupported: Boolean(data.unsupported),
    unsupportedReason:
      typeof data.unsupportedReason === 'string' ? data.unsupportedReason : null,
    subject,
    topicId: typeof data.topicId === 'string' ? data.topicId : null,
    steps,
    answer,
  };
}

export function parseModelSolution(raw: string): ParsedModelSolution {
  try {
    const data = JSON.parse(stripFences(raw)) as Partial<ParsedModelSolution> & {
      answer?: unknown;
    };
    return mapParsed(data);
  } catch {
    const repaired = repairJsonText(raw);
    const data = JSON.parse(repaired) as Partial<ParsedModelSolution> & {
      answer?: unknown;
    };
    return mapParsed(data);
  }
}

export function isGeometryUnsupported(parsed: ParsedModelSolution): boolean {
  if (!parsed.unsupported) return false;
  const reason = (parsed.unsupportedReason ?? '').toLowerCase();
  return (
    reason.includes('geometr') ||
    reason.includes('diyagram') ||
    reason.includes('şekil') ||
    reason.includes('sekil') ||
    parsed.unsupported
  );
}
