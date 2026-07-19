export function pickTopicId(examType, ocrText, evaluated) {
  const t = (ocrText || '').toLowerCase();
  const isFraction =
    t.includes('kesir') ||
    /\/\s*\d/.test(t) ||
    (evaluated?.expr || '').includes('/');

  if (examType === 'kpss') {
    if (t.includes('%') || t.includes('yüzde') || t.includes('yuzde')) return 'kpss-math-yuzde';
    if (t.includes('oran')) return 'kpss-math-oran-oranti';
    return isFraction ? 'kpss-math-kesirler' : 'kpss-math-temel-islemler';
  }
  if (examType === 'ygs') {
    if (t.includes('denklem')) return 'ygs-math-denklemler';
    return 'ygs-math-temel-kavramlar';
  }
  // lgs
  if (t.includes('%') || t.includes('yüzde')) return 'lgs-math-yuzdeler';
  return isFraction ? 'lgs-math-kesirler' : 'lgs-math-denklemler';
}
