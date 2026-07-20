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

/** Show confirm sheet unless user already pinned a hint or model is high-confidence. */
export function shouldConfirmSubject(
  result: SolvedWithClassification,
  opts: { subjectHint?: Subject; examType: ExamType },
): boolean {
  if (opts.subjectHint && opts.subjectHint !== 'unknown') {
    return false;
  }
  if (result.subject === 'unknown') return true;

  const conf = result.classification?.confidence;
  // Ehliyet: traffic / vehicle / firstaid branşı geldiyse ders popup'ı atla
  // (medium güven de yeterli — diğer sınavlar gibi net aksın)
  if (
    opts.examType === 'trafik' &&
    (conf === 'high' || conf === 'medium' || !conf) &&
    (result.subject === 'traffic' ||
      result.subject === 'vehicle' ||
      result.subject === 'firstaid')
  ) {
    return false;
  }

  if (result.classification?.needsConfirm) return true;
  if (conf && conf !== 'high') {
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
    result.subject === subject ||
    // Keep verbal solver steps when user confirms the predicted subject family
    (result.subject === 'turkish' && subject === 'turkish') ||
    ((result.subject === 'traffic' ||
      result.subject === 'vehicle' ||
      result.subject === 'firstaid') &&
      (subject === 'traffic' || subject === 'vehicle' || subject === 'firstaid') &&
      Boolean(result.answer?.text));

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
