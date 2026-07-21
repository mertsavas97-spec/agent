import type {
  ExamHintMeta,
  ExamType,
  SolveQuestionSuccess,
  Subject,
} from '@/src/lib/api/types';
import { subjectsForExam } from '@/src/data';

export function shouldConfirmExamMismatch(
  hint: ExamHintMeta | undefined,
  profileExam: ExamType,
): boolean {
  if (!hint?.mismatchesProfile || !hint.suggested) return false;
  if (hint.suggested === profileExam) return false;
  // Ehliyet booklet Q# alone used to false-trigger KPSS/YGS — ignore that reason client-side too
  if (
    profileExam === 'trafik' &&
    (hint.reason === 'question_number_vs_trafik' ||
      hint.reason === 'question_number_vs_kpss' ||
      hint.reason === 'question_number_vs_lgs')
  ) {
    return false;
  }
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

  const sameFamily =
    (result.subject === 'math' || result.subject === 'geometry') &&
    (subject === 'math' || subject === 'geometry');
  if (!sameFamily) {
    // Never fabricate a solved payload for a different guessed subject. The
    // caller must re-run the image with an explicit hint instead.
    return result;
  }
  return {
    ...result,
    subject,
    classification: result.classification
      ? { ...result.classification, subject, confidence: 'high', needsConfirm: false }
      : undefined,
  };
}
