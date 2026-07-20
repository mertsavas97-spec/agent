import assert from 'node:assert/strict';
import { classifyOcr, topicIdFor } from './classifyOcr.mjs';
import { tryVerbalSolve } from './verbalSolve.mjs';

const liveOcr = `Soru Cevap
96. Sokakta başı boş dolaşan köpeklere yiyecek 98
ve su vermeyi ihmal etmeyen komşumuz her
sabah onlarla ilgilenir hatta uzun uzun konu-
şurdu.
Bu parçanın anlatım biçimi nedir?
CEVAP:`;

const classified = classifyOcr(liveOcr, 'kpss');
assert.equal(classified.subject, 'turkish');
assert.equal(classified.confidence, 'high');
assert.equal(classified.needsConfirm, false);
assert.equal(topicIdFor('kpss', 'turkish', classified.topicKey), 'kpss-turkish-paragraf');

const verbal = tryVerbalSolve(liveOcr, classified);
assert.ok(verbal?.steps?.length >= 3);
assert.match(verbal.steps.at(-1).body, /öyküleme/i);
console.log('ok live turkish anlatım →', verbal.answerText, verbal.steps.at(-1).body);

const mathOcr = `5(2-3/5)\n/\n2(3-5/2)\nişleminin sonucu kaçtır?\nE) 7`;
assert.equal(classifyOcr(mathOcr, 'kpss').subject, 'math');

const anlamOcr = `97. Yıllık planlarını yapmak için saatlerce çalışma masasında çalışmıştı.
Bu parçadaki anlam ilgisi nedir?
CEVAP:`;
const anlamClass = classifyOcr(anlamOcr, 'kpss');
assert.equal(anlamClass.subject, 'turkish');
assert.equal(anlamClass.topicKey, 'anlam');
assert.equal(topicIdFor('kpss', 'turkish', 'anlam'), 'kpss-turkish-anlam');
const anlamVerbal = tryVerbalSolve(anlamOcr, anlamClass);
assert.ok(anlamVerbal?.answerText);
assert.match(anlamVerbal.answerText, /amaç-sonuç/i);
assert.match(anlamVerbal.steps.at(-1).body, /amaç-sonuç/i);
console.log('ok anlam ilgisi →', anlamVerbal.answerText);

console.log('all verbalSolve tests passed');
