import type {
  ExamType,
  SolveQuestionResponse,
} from '@/src/lib/api/types';

import { resolveExamModeBlock, type ExamModeBlock } from './examModeGuard';
import { enforceExamPipeline } from './examPipelineIsolation';
import { normalizeSolvedBranch } from './normalizeSolvedBranch';
import type { SolvedWithClassification } from './subjectClassification';

export type SolveResultRoute =
  | { kind: 'examBlocked'; block: ExamModeBlock }
  | { kind: 'rejected'; response: Exclude<SolveQuestionResponse, { status: 'solved' }> }
  | { kind: 'solved'; result: SolvedWithClassification };

/**
 * Decide the UI route from the raw backend response.
 *
 * The exam guard MUST run before normalization/isolation. Isolation intentionally
 * rewrites foreign subject/topic fields into the active package and would erase
 * the evidence needed for a hard mismatch block.
 */
export function routeSolveResponse(
  response: SolveQuestionResponse,
  examType: ExamType,
  opts: {
    sourceText?: string;
  } = {},
): SolveResultRoute {
  const modeBlock = resolveExamModeBlock(examType, response);
  if (modeBlock.blocked) {
    return { kind: 'examBlocked', block: modeBlock };
  }

  if (response.status !== 'solved') {
    return { kind: 'rejected', response };
  }

  const result = enforceExamPipeline(
    normalizeSolvedBranch(response, examType, {
      sourceText: opts.sourceText,
    }),
    examType,
  ) as SolvedWithClassification;

  return { kind: 'solved', result };
}
