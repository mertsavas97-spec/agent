import { EXAM_LABEL } from '@/src/features/exam/examLabels';
import type {
  ExamHintMeta,
  ExamType,
  SolveQuestionResponse,
} from '@/src/lib/api/types';

import { shouldConfirmExamMismatch } from './subjectClassification';

export type BatchExamReject = {
  reject: true;
  detected: ExamType;
  message: string;
};

export type BatchExamOk = { reject: false };

/**
 * User-facing warning when a multi-batch photo belongs to another exam package.
 */
export function examModeMismatchMessage(
  activeExam: ExamType,
  detectedExam: ExamType,
): string {
  return `Bu soru ${EXAM_LABEL[activeExam]}’ye ait değil; ${EXAM_LABEL[detectedExam]} sorusu gibi görünüyor. Ayarlar’dan modu değiştir veya bu fotoğrafı çıkar.`;
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
  }

  const fromTopic = examFromTopicPrefix(response.topicId);
  if (fromTopic && fromTopic !== activeExam) return fromTopic;

  return null;
}

/**
 * Multi-batch must stay on the selected mode. Reject slots that clearly belong elsewhere.
 */
export function shouldRejectBatchSlotForExamMode(
  activeExam: ExamType,
  response: SolveQuestionResponse,
): BatchExamReject | BatchExamOk {
  const hint = 'examHint' in response ? response.examHint : undefined;
  const detected = inferForeignExamFromResponse(response, activeExam, hint);
  if (!detected || detected === activeExam) {
    return { reject: false };
  }
  return {
    reject: true,
    detected,
    message: examModeMismatchMessage(activeExam, detected),
  };
}
