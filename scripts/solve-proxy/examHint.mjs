/**
 * Soft exam-type hints from OCR vs profile exam.
 * Q97 in a KPSS profile is a classic mismatch (KPSS Türkçe ~30 Q).
 */

/**
 * @returns {{
 *   suggested: 'lgs' | 'ygs' | 'kpss' | null,
 *   confidence: 'high' | 'medium' | 'low',
 *   reason: string | null,
 *   questionNumber: number | null,
 *   mismatchesProfile: boolean,
 * }}
 */
export function detectExamHint(ocrText, profileExam = 'lgs') {
  const t = String(ocrText || '');
  const profile = ['lgs', 'ygs', 'kpss'].includes(profileExam) ? profileExam : 'lgs';

  let suggested = null;
  let confidence = 'low';
  let reason = null;

  if (/\bKPSS\b|\bG[Yy]\s*[-–]?\s*G[Kk]\b|genel yetenek/i.test(t)) {
    suggested = 'kpss';
    confidence = 'high';
    reason = 'ocr_keyword_kpss';
  } else if (/\b(?:TYT|AYT|YKS|YGS)\b/i.test(t)) {
    suggested = 'ygs';
    confidence = 'high';
    reason = 'ocr_keyword_yks';
  } else if (/\bLGS\b|\bMEB\b/i.test(t)) {
    suggested = 'lgs';
    confidence = 'high';
    reason = 'ocr_keyword_lgs';
  }

  const qMatch = t.match(/(?:^|\n)\s*(\d{1,3})\.\s+\S/);
  const questionNumber = qMatch ? Number(qMatch[1]) : null;

  // High question numbers rarely fit KPSS Türkçe (~30) or single LGS subject blocks.
  if (!suggested && questionNumber != null) {
    if (profile === 'kpss' && questionNumber >= 40) {
      suggested = 'ygs';
      confidence = questionNumber >= 80 ? 'high' : 'medium';
      reason = 'question_number_vs_kpss';
    } else if (profile === 'lgs' && questionNumber >= 50) {
      suggested = 'ygs';
      confidence = 'medium';
      reason = 'question_number_vs_lgs';
    }
  }

  const mismatchesProfile = Boolean(suggested && suggested !== profile);

  return {
    suggested,
    confidence,
    reason,
    questionNumber,
    mismatchesProfile,
  };
}
