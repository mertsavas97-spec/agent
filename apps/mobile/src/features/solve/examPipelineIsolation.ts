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
 * On cross-package remap: clear foreign answer/steps and mark assisted —
 * never keep Ehliyet şık under LGS (or reverse).
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
    const crossPackage = !isSubjectAllowedForExam(result.subject, 'trafik');
    if (crossPackage) {
      throw Object.assign(new Error('EXAM_PIPELINE_MISMATCH'), {
        code: 'solve/exam-mismatch',
      });
    }
    return {
      ...result,
      subject,
      topicId,
      answer: result.answer,
      assisted: result.assisted,
      steps: result.steps,
      transparencyNote: result.transparencyNote,
      classification: result.classification
        ? { ...result.classification, subject, needsConfirm: false }
        : { subject, confidence: 'medium', needsConfirm: false },
    };
  }

  // LGS / YGS / KPSS: never keep trafik branş / topic / answers
  const leakedTrafik =
    result.subject === 'traffic' ||
    result.subject === 'vehicle' ||
    result.subject === 'firstaid' ||
    Boolean(result.topicId?.startsWith('trafik-'));
  if (leakedTrafik) {
    throw Object.assign(new Error('EXAM_PIPELINE_MISMATCH'), {
      code: 'solve/exam-mismatch',
    });
  }
  const subject: Subject = leakedTrafik
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
    answer: result.answer,
    assisted: result.assisted,
    steps: result.steps,
    transparencyNote: result.transparencyNote,
    classification: result.classification
      ? {
          ...result.classification,
          subject,
          needsConfirm: result.classification.needsConfirm,
        }
      : undefined,
  };
}
