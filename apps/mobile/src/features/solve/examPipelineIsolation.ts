/**
 * Client-side exam pipeline isolation (mirrors scripts/solve-proxy/examPipeline.mjs).
 */
import type { ExamType, SolveQuestionSuccess, Subject } from '@/src/lib/api/types';

const TRAFIK_SUBJECTS = new Set<Subject>(['traffic', 'vehicle', 'firstaid']);

export function isSubjectAllowedForExam(subject: Subject | null | undefined, exam: ExamType): boolean {
  if (!subject || subject === 'unknown') return false;
  if (exam === 'trafik') return TRAFIK_SUBJECTS.has(subject);
  return !TRAFIK_SUBJECTS.has(subject);
}

export function topicBelongsToExam(topicId: string | null | undefined, exam: ExamType): boolean {
  if (!topicId) return false;
  if (exam === 'trafik') return topicId.startsWith('trafik-');
  return topicId.startsWith(`${exam}-`) && !topicId.startsWith('trafik-');
}

/**
 * Strip cross-package leakage from a solved payload before UI / history.
 * Keeps answer/steps; remaps subject/topic into the active exam family.
 */
export function enforceExamPipeline(
  result: SolveQuestionSuccess,
  examType: ExamType,
): SolveQuestionSuccess {
  if (isSubjectAllowedForExam(result.subject, examType) && topicBelongsToExam(result.topicId, examType)) {
    return result;
  }

  if (examType === 'trafik') {
    const subject: Subject =
      result.subject === 'vehicle' || result.subject === 'firstaid' || result.subject === 'traffic'
        ? result.subject
        : 'traffic';
    const topicId =
      topicBelongsToExam(result.topicId, 'trafik') && result.topicId
        ? result.topicId
        : subject === 'vehicle'
          ? 'trafik-vehicle-motor'
          : subject === 'firstaid'
            ? 'trafik-firstaid-temel'
            : 'trafik-traffic-kurallar';
    return {
      ...result,
      subject,
      topicId,
      classification: result.classification
        ? { ...result.classification, subject, needsConfirm: false }
        : { subject, confidence: 'medium', needsConfirm: false },
    };
  }

  // LGS / YGS / KPSS: never keep trafik branş / topic
  const subject: Subject =
    result.subject === 'traffic' ||
    result.subject === 'vehicle' ||
    result.subject === 'firstaid'
      ? 'turkish'
      : result.subject === 'unknown'
        ? 'turkish'
        : result.subject;
  const topicId = topicBelongsToExam(result.topicId, examType)
    ? result.topicId
    : `${examType}-turkish-paragraf`;

  return {
    ...result,
    subject,
    topicId,
    classification: result.classification
      ? {
          ...result.classification,
          subject,
          needsConfirm: result.classification.needsConfirm,
        }
      : undefined,
  };
}
