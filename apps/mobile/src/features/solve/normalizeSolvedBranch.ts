import type { ExamType, SolveQuestionSuccess, Subject } from '@/src/lib/api/types';

import {
  classifyTrafikBranchFromText,
  isGenericTrafikFallbackStep,
} from './trafikBranchFromText';

export type NormalizeSolvedBranchOptions = {
  /** OCR / question stem — preferred over step bodies for branş lock */
  sourceText?: string | null;
};

/**
 * Align subject/topic with solver content so Konu anlatımı / meta match the
 * real branch (e.g. şaft answer must not stay under Trafik Kuralları / İlk Yardım).
 */
export function normalizeSolvedBranch(
  result: SolveQuestionSuccess,
  examType: ExamType,
  opts?: NormalizeSolvedBranchOptions,
): SolveQuestionSuccess {
  if (examType !== 'trafik') return result;

  const contentParts = [
    opts?.sourceText ?? '',
    result.answer?.text ?? '',
    result.answer?.label ?? '',
  ];
  for (const s of result.steps) {
    const title = s.title ?? '';
    const body = s.body ?? '';
    if (isGenericTrafikFallbackStep(title, body)) continue;
    contentParts.push(title, body);
  }
  const blob = contentParts.join('\n');

  const fromText = classifyTrafikBranchFromText(blob);
  if (!fromText) {
    // Do not invent firstaid from polluted generic tips — keep solver subject if already Ehliyet
    return result;
  }

  if (fromText.subject === result.subject && fromText.topicId === result.topicId) {
    return result;
  }

  const subject: Subject = fromText.subject;
  const topicId = fromText.topicId;

  return {
    ...result,
    subject,
    topicId,
    classification: result.classification
      ? {
          ...result.classification,
          subject,
          needsConfirm: false,
          confidence: 'high',
        }
      : {
          subject,
          confidence: 'high',
          needsConfirm: false,
        },
  };
}
