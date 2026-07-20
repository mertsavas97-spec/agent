/**
 * Soft exam-type hints from OCR vs profile exam.
 * Q97 in a KPSS profile is a classic mismatch (KPSS Türkçe ~30 Q).
 * Ehliyet profilinde anlatım/anlam soruları → KPSS/YGS.
 */

const TURKISH_STEM =
  /anlatım biçimi|anlatim bicimi|paragraf|ana düşünce|ana dusunce|ana fikir|cümlede anlam|cumlede anlam|anlam ilgisi|anlam ilişkisi|sözcükte|sozcukte|dil bilgisi|fiilims|özne|nesne|yüklem|anlamca|hangisi çıkarılamaz|çıkarılabilecek|anlatımında|düşünceyi geliştirme|yazım yanlışı|noktalama/i;

/**
 * @returns {{
 *   suggested: 'lgs' | 'ygs' | 'kpss' | 'trafik' | null,
 *   confidence: 'high' | 'medium' | 'low',
 *   reason: string | null,
 *   questionNumber: number | null,
 *   mismatchesProfile: boolean,
 * }}
 */
export function detectExamHint(ocrText, profileExam = 'lgs') {
  const t = String(ocrText || '');
  const profile = ['lgs', 'ygs', 'kpss', 'trafik'].includes(profileExam)
    ? profileExam
    : 'lgs';

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
  } else if (
    /\b(?:ehliyet|MTS|trafik levha|azami hız|geçiş üstünlüğü)\b/i.test(t) ||
    /\bilk\s*yardım\b/i.test(t) ||
    /ışıklı trafik|trafik işaret|sürücü ne yapmalı|sarı ve kırmızı|kırmızı (?:ile )?sarı|yeşil ışık yan/i.test(
      t,
    ) ||
    /şaft|diferansiyel|güç aktarma|aktarma organ|\babs\b|hava yastığı|emniyet kemeri/i.test(
      t,
    )
  ) {
    suggested = 'trafik';
    confidence = 'high';
    reason = 'ocr_keyword_trafik';
  } else if (
    profile === 'trafik' &&
    TURKISH_STEM.test(t) &&
    !/trafik|ehliyet|kavşak|levha|sürücü/i.test(t)
  ) {
    // Ehliyet modunda KPSS/YGS Türkçe sorusu — branşı traffic sanma
    suggested = 'kpss';
    confidence = 'high';
    reason = 'turkish_under_trafik';
  }

  const qMatch = t.match(/(?:^|\n)\s*(\d{1,3})\.\s+\S/);
  const questionNumber = qMatch ? Number(qMatch[1]) : null;

  // High question numbers rarely fit KPSS Türkçe (~30) or single LGS subject blocks.
  // Do NOT use Q# alone against Ehliyet — booklets often run past 40/80.
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

  if (
    suggested === 'kpss' &&
    reason === 'turkish_under_trafik' &&
    questionNumber != null &&
    questionNumber >= 80
  ) {
    suggested = 'ygs';
    reason = 'turkish_high_q_under_trafik';
  }

  // Ehliyet OCR + traffic keywords → trust trafik even if a Q# heuristic fired earlier
  if (
    profile === 'trafik' &&
    suggested &&
    suggested !== 'trafik' &&
    /şaft|diferansiyel|güç aktarma|abs\b|hava yastığı|kavşak|azami hız|ışıklı|sürücü ne yapmalı|ilk yardım|emniyet kemeri/i.test(
      t,
    )
  ) {
    suggested = 'trafik';
    confidence = 'high';
    reason = 'trafik_keywords_override';
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
