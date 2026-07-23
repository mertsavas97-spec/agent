import { EXAM_LABEL } from '@/src/features/exam/examLabels';
import type {
  ExamHintMeta,
  ExamType,
  SolveQuestionResponse,
} from '@/src/lib/api/types';

import { shouldConfirmExamMismatch } from './subjectClassification';

export type ExamModeBlock = {
  blocked: true;
  activeExam: ExamType;
  detectedExam: ExamType;
  message: string;
  headline: string;
};

export type ExamModeBlockResult = ExamModeBlock | { blocked: false };

/**
 * User-facing warning when a photo belongs to another exam package.
 */
export function examModeMismatchMessage(
  activeExam: ExamType,
  detectedExam: ExamType,
): string {
  return `Bu soru ${EXAM_LABEL[detectedExam]} sınavına ait görünüyor. Şu an ${EXAM_LABEL[activeExam]} modundasın — doğru çözüm için modu değiştir.`;
}

export function examModeBlockHeadline(detectedExam: ExamType): string {
  return `Bu soru ${EXAM_LABEL[detectedExam]} sınavına ait`;
}

function examFromTopicPrefix(topicId: string | null | undefined): ExamType | null {
  if (!topicId) return null;
  if (topicId.startsWith('lgs-')) return 'lgs';
  if (topicId.startsWith('ygs-')) return 'ygs';
  if (topicId.startsWith('kpss-')) return 'kpss';
  if (topicId.startsWith('trafik-')) return 'trafik';
  return null;
}

function isTrafikSubject(subject: string | undefined): boolean {
  return subject === 'traffic' || subject === 'vehicle' || subject === 'firstaid';
}

/**
 * Infer a foreign exam package from OCR hint / subject / topic — never the active mode.
 */
export function inferForeignExamFromResponse(
  response: SolveQuestionResponse,
  activeExam: ExamType,
  hint?: ExamHintMeta,
): ExamType | null {
  const examHint = hint ?? ('examHint' in response ? response.examHint : undefined);

  if (shouldConfirmExamMismatch(examHint, activeExam) && examHint?.suggested) {
    return examHint.suggested;
  }

  if (response.status !== 'solved') return null;

  if (activeExam !== 'trafik' && isTrafikSubject(response.subject)) {
    return 'trafik';
  }

  if (activeExam === 'trafik' && response.subject !== 'unknown' && !isTrafikSubject(response.subject)) {
    const fromTopic = examFromTopicPrefix(response.topicId);
    if (fromTopic && fromTopic !== 'trafik') return fromTopic;
    if (examHint?.suggested && examHint.suggested !== 'trafik') {
      return examHint.suggested;
    }
    // Academic subject under Ehliyet with no topic/hint — still block (guess LGS for STEM).
    return academicFallbackExam(response.subject);
  }

  const fromTopic = examFromTopicPrefix(response.topicId);
  if (fromTopic && fromTopic !== activeExam) return fromTopic;

  return null;
}

function academicFallbackExam(subject: string | undefined): ExamType {
  if (
    subject === 'turkish' ||
    subject === 'history' ||
    subject === 'geography' ||
    subject === 'civics'
  ) {
    return 'kpss';
  }
  return 'lgs';
}

/**
 * Hard block — never show solution steps when packages disagree.
 */
export function resolveExamModeBlock(
  activeExam: ExamType,
  response: SolveQuestionResponse,
): ExamModeBlockResult {
  const detected = inferForeignExamFromResponse(response, activeExam);
  if (!detected || detected === activeExam) {
    return { blocked: false };
  }
  return {
    blocked: true,
    activeExam,
    detectedExam: detected,
    message: examModeMismatchMessage(activeExam, detected),
    headline: examModeBlockHeadline(detected),
  };
}

export type BatchExamReject = {
  reject: true;
  detected: ExamType;
  message: string;
  headline: string;
};

export type BatchExamOk = { reject: false };

/**
 * Multi-batch must stay on the selected mode. Reject slots that clearly belong elsewhere.
 */
export function shouldRejectBatchSlotForExamMode(
  activeExam: ExamType,
  response: SolveQuestionResponse,
): BatchExamReject | BatchExamOk {
  const block = resolveExamModeBlock(activeExam, response);
  if (!block.blocked) {
    return { reject: false };
  }
  return {
    reject: true,
    detected: block.detectedExam,
    message: block.message,
    headline: block.headline,
  };
}
