/**
 * Hard isolation between exam packages in the solve pipeline.
 * Solving ALWAYS stays on the profile exam; OCR may only emit examHint
 * for the client mismatch sheet — never rewrite topicId / solver family.
 */

export const EXAMS = /** @type {const} */ (['lgs', 'ygs', 'kpss', 'trafik']);

const TRAFIK_SUBJECTS = new Set(['traffic', 'vehicle', 'firstaid']);
const NON_TRAFIK_SUBJECTS = new Set([
  'math',
  'turkish',
  'science',
  'physics',
  'chemistry',
  'biology',
  'history',
  'geography',
  'philosophy',
  'literature',
  'religion',
  'english',
  'geometry',
  'civics',
  'current',
]);

/**
 * @param {string | null | undefined} examType
 * @returns {'lgs'|'ygs'|'kpss'|'trafik'}
 */
export function normalizeExamType(examType) {
  return EXAMS.includes(/** @type {*} */ (examType)) ? /** @type {*} */ (examType) : 'lgs';
}

/**
 * Profile exam is the only solve target. Hint never switches the pipeline.
 * @param {'lgs'|'ygs'|'kpss'|'trafik'} profileExam
 */
export function resolveSolveExam(profileExam) {
  return normalizeExamType(profileExam);
}

/**
 * @param {string | null | undefined} subject
 * @param {'lgs'|'ygs'|'kpss'|'trafik'} examType
 */
export function isSubjectAllowedForExam(subject, examType) {
  if (!subject || subject === 'unknown') return false;
  if (examType === 'trafik') return TRAFIK_SUBJECTS.has(subject);
  return NON_TRAFIK_SUBJECTS.has(subject) && !TRAFIK_SUBJECTS.has(subject);
}

/**
 * @param {string | null | undefined} topicId
 * @param {'lgs'|'ygs'|'kpss'|'trafik'} examType
 */
export function topicBelongsToExam(topicId, examType) {
  if (!topicId) return false;
  if (examType === 'trafik') return topicId.startsWith('trafik-');
  return topicId.startsWith(`${examType}-`) && !topicId.startsWith('trafik-');
}

/**
 * Whether verbalSolve may invoke the Ehliyet (traffic) solver.
 * Strict: ONLY the trafik package — never LGS/YGS/KPSS even if OCR
 * looks like ehliyet or classification somehow says traffic/vehicle.
 */
export function mayRunTrafficSolver(examType, _classificationSubject) {
  return normalizeExamType(examType) === 'trafik';
}

/**
 * Whether Turkish (anlatım/anlam) solvers may run.
 * Never under Ehliyet package.
 */
export function mayRunTurkishSolver(examType, classificationSubject) {
  if (normalizeExamType(examType) === 'trafik') return false;
  return classificationSubject === 'turkish' || classificationSubject === 'literature';
}

/**
 * Whether arithmetic / math eval path may run.
 * Never under Ehliyet package (avoids false numeric hits on plate/Q numbers).
 */
export function mayRunMathSolver(examType) {
  return normalizeExamType(examType) !== 'trafik';
}

/**
 * Client / proxy post-check: drop cross-package leakage from a solved payload.
 * @param {object} result
 * @param {'lgs'|'ygs'|'kpss'|'trafik'} examType
 */
export function assertPipelineIsolation(result, examType) {
  const exam = normalizeExamType(examType);
  const issues = [];
  if (!result || result.status !== 'solved') {
    return { ok: true, issues };
  }
  if (result.subject && result.subject !== 'unknown') {
    if (!isSubjectAllowedForExam(result.subject, exam)) {
      issues.push(`subject ${result.subject} not allowed for ${exam}`);
    }
  }
  if (result.topicId && !topicBelongsToExam(result.topicId, exam)) {
    issues.push(`topicId ${result.topicId} not under ${exam}`);
  }
  return { ok: issues.length === 0, issues };
}
