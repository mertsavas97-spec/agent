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

function stripFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fenced ? fenced[1].trim() : trimmed;
}

export function parseModelSolution(raw: string): ParsedModelSolution {
  const jsonText = stripFences(raw);
  const data = JSON.parse(jsonText) as Partial<ParsedModelSolution>;

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
    : data.subject === 'unknown'
      ? 'unknown'
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
