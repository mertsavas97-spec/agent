import assert from 'node:assert/strict';
import {
  evaluateExpression,
  reconstructVerticalMath,
  recoverParenDiffStack,
} from './arithSolve.mjs';

function check(label, ocr, expect) {
  const r = evaluateExpression(ocr);
  assert.ok(r, `${label}: expected solve, got null`);
  if (expect.approx != null) {
    assert.ok(Math.abs(r.value - expect.approx) < 1e-6, `${label}: value ${r.value}`);
  }
  if (expect.choice) {
    assert.equal(r.choice, expect.choice, `${label}: choice`);
  }
  console.log('ok', label, r.expr, r.value, r.choice ?? '-');
}

check(
  'vertical digits',
  `1\n3\n÷\n1\n7\nA) 1/7\nB) 1/3\nC) 3\nD) 1\nE) 7`,
  { approx: 7 / 3 },
);

check(
  'frac lines',
  `1/3\n÷\n1/7\nA) 7/3\nB) 1/3\nC) 3\nD) 1\nE) 7`,
  { approx: 7 / 3, choice: 'A' },
);

check(
  'bars',
  `1\n—\n3\n÷\n1\n—\n7\nA) 7/3\nB) 1`,
  { approx: 7 / 3, choice: 'A' },
);

check(
  'stacked complex → 7',
  `5(2-3/5)\n/\n2(3-5/2)\nA) 1\nB) 7\nC) 2`,
  { approx: 7, choice: 'B' },
);

assert.equal(
  reconstructVerticalMath(`1\n3\n÷\n1\n7`),
  '(1/3)/(1/7)',
);

const liveOcr = `2.
52-
35
5
23.
2
işleminin sonucu kaçtır?
LO
A) 555
B) 글
C) 3
D) 5
E) 7`;
assert.ok(recoverParenDiffStack(liveOcr).length >= 1, 'recover live OCR');
check('live phone OCR mangled stack', liveOcr, { approx: 7, choice: 'E' });

check(
  'bracket outer grouping → 7',
  `[5*(2-3/5)]/[2*(3-5/2)]
işleminin sonucu kaçtır?
A) 5/2
B) 7/2
C) 3
D) 5
E) 7`,
  { approx: 7, choice: 'E' },
);

check(
  'LGS fraction-of word problem → 3',
  `1. Bir sınıfta 24 öğrenci vardır. Öğrencilerin 3/8'i kızdır. Kız öğrencilerin 1/3'ü spor kulübüne gidiyorsa, spor kulübüne giden kız öğrenci sayısı kaçtır?
A) 2 B) 3 C) 4 D) 6 E) 8`,
  { approx: 3, choice: 'B' },
);

check(
  'YGS linear equation → 9',
  `YGS - Matematik. 1. 3(x-2) + 4 = 2x + 7 denklemini sağlayan x değeri aşağıdakilerden hangisidir?
A) 1 B) 3 C) 5 D) 7 E) 9`,
  { approx: 9, choice: 'E' },
);

check(
  'KPSS percent chain → 90',
  `Bir ürünün fiyatı önce %20 artırılıp sonra %25 azaltılıyor. İşlemler sonunda ürünün fiyatı, başlangıçtaki fiyatının yüzde kaçıdır?
A) 90 B) 95 C) 100 D) 105 E) 110`,
  { approx: 90, choice: 'A' },
);

check(
  'LGS OCR recovered stacked fractions → 3',
  `Bir sınıfta 24 öğrenci vardır. Öğrencilerin — 'i kızdır.
Kız öğrencilerin —'ü spor kulübüne gidiyorsa sayı kaçtır?
OCR_KESIRLER: 3/8 1/3
A) 2
B) 3
C) 4
D) 6
E) 8`,
  { approx: 3, choice: 'B' },
);

check(
  'YGS OCR plus sign read as duplicated four → 9',
  `3(X—2)4 4 = 2x + 7 denklemini sağlayan x değeri hangisidir?
A) 1
B) 3
C) 5
D) 7
E) 9`,
  { approx: 9, choice: 'E' },
);

check(
  'KPSS OCR percent sign read as 94 → 90',
  `Bir ürünün fiyatı önce %20 artırılıp sonra
9425 azaltılıyor. Son fiyat başlangıcın yüzde kaçıdır?
A) 90
B) 95
C) 100
D) 105
E) 110`,
  { approx: 90, choice: 'A' },
);

// Must NOT invent answer 1 from glued 24.3/8.1/3 when şıklar exist
assert.equal(
  evaluateExpression(`24.3/8.1/3\nA) 2\nB) 3\nC) 4`),
  null,
  'reject glued false positive without matching choice',
);

console.log('all arithSolve tests passed');
