import assert from 'node:assert/strict';

import { isGarbageOcrText, repairPercentOcr } from './visionOcr.mjs';

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

console.log('ocrQuality.test.mjs OK');
