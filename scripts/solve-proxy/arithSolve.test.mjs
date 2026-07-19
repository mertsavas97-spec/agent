import assert from 'node:assert/strict';
import { evaluateExpression, reconstructVerticalMath } from './arithSolve.mjs';

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

console.log('all arithSolve tests passed');
