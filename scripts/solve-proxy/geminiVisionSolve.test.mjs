import assert from 'node:assert/strict';

import {
  extractAnswerFromSteps,
  geminiSolvePrompt,
  isGeminiVisionSolveEnabled,
  parseGeminiSolveResponse,
  repairJsonText,
} from './geminiVisionSolve.mjs';

assert.match(geminiSolvePrompt('lgs'), /LGS/);
assert.match(geminiSolvePrompt('ygs'), /YKS/);
assert.match(geminiSolvePrompt('kpss'), /KPSS/);
assert.match(geminiSolvePrompt('trafik'), /Ehliyet/);

const parsed = parseGeminiSolveResponse(`\`\`\`json
{
  "isQuestion": true,
  "unsupported": false,
  "unsupportedReason": null,
  "subject": "math",
  "topicKey": "kesir",
  "ocrText": "8/3 : (3/7+2/3)",
  "steps": [
    { "title": "1. İşlem", "body": "Parantez içini hesapla." },
    { "title": "Cevap", "body": "Doğru şık: A) 2 10/23" }
  ],
  "answer": { "label": "A", "text": "2 10/23" }
}
\`\`\``);
assert.equal(parsed.ok, true);
assert.equal(parsed.answer?.label, 'A');
assert.equal(parsed.answer?.text, '2 10/23');
assert.equal(parsed.subject, 'math');

const fromStep = parseGeminiSolveResponse(
  JSON.stringify({
    isQuestion: true,
    unsupported: false,
    subject: 'math',
    steps: [{ title: 'Cevap', body: 'Doğru şık: B) 3' }],
  }),
);
assert.equal(fromStep.answer?.label, 'B');

assert.equal(
  extractAnswerFromSteps([{ title: 'Cevap', body: 'Doğru şık: C) 6' }])?.label,
  'C',
);

assert.match(repairJsonText('hello {"a":1,} world'), /"a":\s*1/);

const prevGemini = process.env.GEMINI_API_KEY;
const prevFlag = process.env.COZBIL_PROXY_GEMINI_FIRST;
try {
  process.env.GEMINI_API_KEY = 'AIza-test';
  delete process.env.COZBIL_PROXY_GEMINI_FIRST;
  assert.equal(isGeminiVisionSolveEnabled(), true);
  process.env.COZBIL_PROXY_GEMINI_FIRST = '0';
  assert.equal(isGeminiVisionSolveEnabled(), false);
} finally {
  if (prevGemini === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = prevGemini;
  if (prevFlag === undefined) delete process.env.COZBIL_PROXY_GEMINI_FIRST;
  else process.env.COZBIL_PROXY_GEMINI_FIRST = prevFlag;
}

console.log('geminiVisionSolve.test.mjs OK');
