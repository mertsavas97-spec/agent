import assert from 'node:assert/strict';
import fs from 'node:fs';

import { evaluateExpression } from './arithSolve.mjs';
import { classifyOcr } from './classifyOcr.mjs';
import { tryTrafficSolve } from './trafficSolve.mjs';
import { closeOcrWorker, ocrImageBase64 } from './visionOcr.mjs';

const fixtureDir = new URL(
  '../../docs/qa/phone-solve-fixtures/images/',
  import.meta.url,
);

const fixtures = [
  {
    exam: 'lgs',
    file: 'lgs-math-kesir-dogfood-001.png',
    label: 'B',
    text: '3',
  },
  {
    exam: 'ygs',
    file: 'ygs-math-denklem-dogfood-001.png',
    label: 'E',
    text: '9',
  },
  {
    exam: 'kpss',
    file: 'kpss-math-yuzde-dogfood-001.png',
    label: 'A',
    text: '90',
  },
  {
    exam: 'trafik',
    file: 'trafik-traffic-hiz-dogfood-001.png',
    label: 'B',
    text: '50',
  },
];

try {
  for (const fixture of fixtures) {
    const bytes = fs.readFileSync(new URL(fixture.file, fixtureDir));
    const ocr = await ocrImageBase64(bytes.toString('base64'), 'image/png');
    assert.ok(ocr, `${fixture.exam}: OCR text required`);

    if (fixture.exam === 'trafik') {
      const classification = classifyOcr(ocr, 'trafik');
      const solved = tryTrafficSolve(ocr, classification);
      assert.equal(solved?.answerLabel, fixture.label, `${fixture.exam}: answer label`);
      assert.match(
        solved?.answerText ?? '',
        new RegExp(`\\b${fixture.text}\\b`),
        `${fixture.exam}: answer text`,
      );
    } else {
      const solved = evaluateExpression(ocr);
      assert.equal(solved?.choice, fixture.label, `${fixture.exam}: answer label\n${ocr}`);
      assert.equal(String(solved?.value), fixture.text, `${fixture.exam}: answer text`);
    }

    console.log('ok real image', fixture.exam, fixture.label, fixture.text);
  }
} finally {
  await closeOcrWorker();
}

console.log('realImagePipeline.test.mjs OK');
