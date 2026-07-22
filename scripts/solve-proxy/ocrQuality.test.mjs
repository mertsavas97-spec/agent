import assert from 'node:assert/strict';

import {
  isGarbageOcrText,
  repairEquationOcr,
  repairPercentOcr,
} from './visionOcr.mjs';

assert.equal(isGarbageOcrText(''), true);
assert.equal(isGarbageOcrText('||||||||||'), true);
assert.equal(
  isGarbageOcrText(
    [
      'Hi',
      '|       |',
      'I',
      '[]',
      'i',
      '|',
      '|',
      '|',
      '|  | i',
      '|',
      '|',
      'D) 7',
    ].join('\n'),
  ),
  true,
);
assert.equal(
  isGarbageOcrText(
    'Bir sınıfta 24 öğrenci vardır. Öğrencilerin 3/8 i kızdır. Spor kulübüne giden kız öğrenci sayısı kaçtır?\nA) 2  B) 3  C) 4  D) 6',
  ),
  false,
);

assert.match(
  repairPercentOcr('önce 020 artırılıp sonra 94,25 azaltılıyor. yüzde kaçıdır?'),
  /%20[\s\S]*%25/,
);
assert.match(
  repairPercentOcr('önce 620 artırılıp sonra %25 azaltılıyor'),
  /%20[\s\S]*%25/,
);

assert.match(
  repairEquationOcr('3(X—2)4 4 = 2x4 7 denklemini sağlayan\n0) 5\nE) 9'),
  /3\(X-2\)\+4=\s*2x\+7[\s\S]*C\) 5/,
);
assert.match(
  repairEquationOcr(
    '3(X-2)44 - 2x+7 denklemini sağlayan\nx değeri aşağıdakilerden hangisidir?\nA) 1\nB) 3\nC) 5\nD) 7\nE) 9',
  ),
  /3\(X-2\)\+4=\s*2x\+7/i,
);
assert.equal(
  isGarbageOcrText(
    '| |\nbi\nHH\n3(x-2)+4=2x+7 denklemini sağlayan\nx değeri hangisidir?\nA) 1\nB) 3\nC) 5\nD) 7\nE) 9',
  ),
  false,
);

console.log('ocrQuality.test.mjs OK');
