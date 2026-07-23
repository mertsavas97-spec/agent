import assert from 'node:assert/strict';
import { detectExamHint } from './examHint.mjs';

const q97 = `97. Yıllık planlarını yapmak için saatlerce çalışma masasında çalışmıştı.
Bu parçadaki anlam ilgisi nedir?
CEVAP:`;

{
  const hint = detectExamHint(q97, 'kpss');
  assert.equal(hint.questionNumber, 97);
  assert.equal(hint.suggested, 'ygs');
  assert.equal(hint.confidence, 'high');
  assert.equal(hint.mismatchesProfile, true);
  assert.equal(hint.reason, 'question_number_vs_kpss');
  console.log('ok kpss profile + Q97 → ygs mismatch');
}

{
  const hint = detectExamHint(q97, 'ygs');
  assert.equal(hint.mismatchesProfile, false);
  // High number alone does not force a switch when profile already YGS
  assert.ok(!hint.suggested || hint.suggested === 'ygs');
  console.log('ok ygs profile + Q97 → no mismatch sheet');
}

{
  const hint = detectExamHint('KPSS Genel Yetenek\n12. Aşağıdakilerden hangisi…', 'ygs');
  assert.equal(hint.suggested, 'kpss');
  assert.equal(hint.mismatchesProfile, true);
  assert.equal(hint.confidence, 'high');
  console.log('ok ygs profile + KPSS keyword → mismatch');
}

{
  const hint = detectExamHint('15. İki sayının toplamı…', 'kpss');
  assert.equal(hint.mismatchesProfile, false);
  console.log('ok kpss + low Q number → no mismatch');
}

{
  const hint = detectExamHint(
    '12. Işıklı trafikte sarı ve kırmızı birlikte yanıyorsa sürücü ne yapmalıdır?',
    'kpss',
  );
  assert.equal(hint.suggested, 'trafik');
  assert.equal(hint.mismatchesProfile, true);
  assert.equal(hint.confidence, 'high');
  console.log('ok kpss profile + trafik OCR → trafik mismatch');
}

{
  const hint = detectExamHint(
    '96. Sokakta başı boş dolaşan köpeklere yiyecek vermeyi ihmal etmeyen komşumuz…\nBu parçanın anlatım biçimi nedir?',
    'trafik',
  );
  // Türkçe anlatım kökü → YGS (Q# alone no longer flips Ehliyet)
  assert.equal(hint.suggested, 'ygs');
  assert.equal(hint.mismatchesProfile, true);
  assert.equal(hint.confidence, 'high');
  console.log('ok trafik profile + anlatım biçimi Q96 → ygs');
}

{
  const hint = detectExamHint(
    '97. Yıllık planlarını yapmak için saatlerce çalışma masasında çalışmıştı.\nBu parçadaki anlam ilgisi nedir?',
    'trafik',
  );
  assert.equal(hint.suggested, 'ygs');
  assert.equal(hint.mismatchesProfile, true);
  console.log('ok trafik profile + Q97 anlam ilgisi → ygs');
}

{
  const hint = detectExamHint(
    '52. Şekildeki araç güç aktarma organlarının adları hangi seçenekte doğru olarak verilmiştir?\nA) I. Şaft II. Diferansiyel III. Aks',
    'trafik',
  );
  assert.equal(hint.suggested, 'trafik');
  assert.equal(hint.mismatchesProfile, false);
  assert.equal(hint.confidence, 'high');
  console.log('ok trafik profile + Q52 şaft → stay trafik (no Q# false alarm)');
}

{
  const hint = detectExamHint(
    '61. Yerleşim yerinde aksi işaret yoksa azami hız kaç km/s’tir?',
    'trafik',
  );
  // Q61 alone must NOT force KPSS/YGS
  assert.equal(hint.mismatchesProfile, false);
  console.log('ok trafik profile + Q61 hız → no exam mismatch');
}

console.log('all examHint tests passed');
