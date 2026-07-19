import type { ExamType, SolveQuestionSuccess, Subject } from '@/src/lib/api/types';
import { subjectsForExam } from '@/src/data';

import { buildLocalSolveFallback } from './localSolveFallback';

export type SubjectClassification = {
  subject: Subject;
  confidence: 'high' | 'medium' | 'low';
  needsConfirm: boolean;
  alternatives?: { subject: string; score: number }[];
  topicKey?: string;
  score?: number;
};

export type SolvedWithClassification = SolveQuestionSuccess & {
  classification?: SubjectClassification;
};

/** Show confirm sheet unless user already pinned a hint or model is high-confidence. */
export function shouldConfirmSubject(
  result: SolvedWithClassification,
  opts: { subjectHint?: Subject; examType: ExamType },
): boolean {
  if (opts.subjectHint && opts.subjectHint !== 'unknown') {
    return false;
  }
  if (result.subject === 'unknown') return true;
  if (result.classification?.needsConfirm) return true;
  if (result.classification?.confidence && result.classification.confidence !== 'high') {
    return true;
  }
  return false;
}

/** Apply user-confirmed (or pre-selected hint) subject onto a solved payload. */
export function applySubjectOverride(
  result: SolveQuestionSuccess,
  examType: ExamType,
  subject: Exclude<Subject, 'unknown'>,
): SolveQuestionSuccess {
  if (!subjectsForExam(examType).includes(subject)) {
    return result;
  }
  if (result.subject === subject) {
    return {
      ...result,
      subject,
      classification: result.classification
        ? { ...result.classification, needsConfirm: false, confidence: 'high' }
        : undefined,
    };
  }

  const remapped = buildLocalSolveFallback({
    examType,
    subjectHint: subject,
    requestId: result.solutionId.replace(/^(proxy-sol-|local-sol-)/, '') || 'override',
    reason: 'unsupported',
  });

  if (remapped.status !== 'solved') return { ...result, subject };

  const sameFamily =
    (result.subject === 'math' || result.subject === 'geometry') &&
    (subject === 'math' || subject === 'geometry');
  const keepSteps =
    sameFamily ||
    (result.subject === subject) ||
    // Keep verbal solver steps when user confirms the predicted turkish subject family
    (result.subject === 'turkish' && subject === 'turkish');

  return {
    ...result,
    subject,
    topicId: remapped.topicId,
    steps: keepSteps ? result.steps : remapped.steps,
    answer: keepSteps ? result.answer : undefined,
    transparencyNote: keepSteps
      ? result.transparencyNote
      : `Ders güncellendi. Adımlar ${subject} için yeniden düzenlendi.`,
    classification: {
      subject,
      confidence: 'high',
      needsConfirm: false,
    },
  };
}
