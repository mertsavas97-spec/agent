import { classifyOcr, topicIdFor } from './classifyOcr.mjs';

/** @deprecated prefer classifyOcr + topicIdFor; kept for math-evaluated path */
export function pickTopicId(examType, ocrText, evaluated) {
  const classified = classifyOcr(ocrText, examType);
  if (classified.subject === 'math' && evaluated) {
    const t = (ocrText || '').toLowerCase();
    const isFraction =
      t.includes('kesir') ||
      /\/\s*\d/.test(t) ||
      (evaluated?.expr || '').includes('/');
    if (isFraction) {
      return topicIdFor(examType, 'math', 'kesir');
    }
  }
  return topicIdFor(examType, classified.subject, classified.topicKey);
}

export { classifyOcr, topicIdFor };
