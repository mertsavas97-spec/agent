import { isKnownSubject } from '../data/subjects';
import type { SolutionStep, Subject } from '../types/contracts';

export type ParsedModelSolution = {
  isQuestion: boolean;
  unsupported: boolean;
  unsupportedReason: string | null;
  subject: Subject;
  topicId: string | null;
  steps: SolutionStep[];
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

function mapParsed(data: Partial<ParsedModelSolution>): ParsedModelSolution {
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

  return {
    isQuestion: Boolean(data.isQuestion),
    unsupported: Boolean(data.unsupported),
    unsupportedReason:
      typeof data.unsupportedReason === 'string' ? data.unsupportedReason : null,
    subject,
    topicId: typeof data.topicId === 'string' ? data.topicId : null,
    steps,
  };
}

export function parseModelSolution(raw: string): ParsedModelSolution {
  try {
    const data = JSON.parse(stripFences(raw)) as Partial<ParsedModelSolution>;
    return mapParsed(data);
  } catch {
    const repaired = repairJsonText(raw);
    const data = JSON.parse(repaired) as Partial<ParsedModelSolution>;
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
