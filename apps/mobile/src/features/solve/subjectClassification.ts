import type {
  ExamHintMeta,
  ExamType,
  SolveQuestionSuccess,
  Subject,
} from '@/src/lib/api/types';
import { subjectsForExam } from '@/src/data';

import { buildLocalSolveFallback } from './localSolveFallback';

export function shouldConfirmExamMismatch(
  hint: ExamHintMeta | undefined,
  profileExam: ExamType,
): boolean {
  if (!hint?.mismatchesProfile || !hint.suggested) return false;
  if (hint.suggested === profileExam) return false;
  return hint.confidence === 'high' || hint.confidence === 'medium';
}

/** Remap topic id prefix when user switches exam after mismatch sheet. */
export function remapTopicIdForExam(
  topicId: string | null | undefined,
  fromExam: ExamType,
  toExam: ExamType,
): string | null {
  if (!topicId) return null;
  if (fromExam === toExam) return topicId;
  if (topicId.startsWith(`${fromExam}-`)) {
    return `${toExam}-${topicId.slice(fromExam.length + 1)}`;
  }
  return topicId;
}

export function applyExamOverride(
  result: SolveQuestionSuccess,
  fromExam: ExamType,
  toExam: ExamType,
): SolveQuestionSuccess {
  if (fromExam === toExam) return result;
  return {
    ...result,
    topicId: remapTopicIdForExam(result.topicId, fromExam, toExam),
    examHint: result.examHint
      ? { ...result.examHint, mismatchesProfile: false, suggested: toExam }
      : undefined,
  };
}

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
