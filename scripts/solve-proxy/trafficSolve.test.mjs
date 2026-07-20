import assert from 'node:assert/strict';
import { tryTrafficSolve } from './trafficSolve.mjs';
import { tryVerbalSolve } from './verbalSolve.mjs';

const redYellow = `
Soru 1. Şekildeki gibi ışıklı trafik işaret cihazında, sarı ve kırmızı ışığın birlikte yandığını gören sürücü ne yapmalıdır?
A) Harekete hazırlanmalı
B) Yolun en sağına yaklaşmalı
C) Hızlanmalı
D) Geçmeli
`;

const lane = `
Şekildeki şerit kontrol işaretlerinde kırmızı X ve yeşil ok yanıyorsa sürücü ne yapmalıdır?
A) X olan şeride girmeli
B) Okun gösterdiği yöne devam etmeli
C) Geri gitmeli
D) Durmadan sollamalı
`;

const classTraffic = { subject: 'traffic', confidence: 'high', topicKey: 'kurallar' };

const ry = tryTrafficSolve(redYellow, classTraffic);
assert.ok(ry?.steps?.length >= 3);
assert.equal(ry.answerLabel, 'A');
assert.match(ry.answerText, /hazırlan/i);

const ln = tryTrafficSolve(lane, classTraffic);
assert.ok(ln?.answerLabel);
assert.equal(ln.answerLabel, 'B');

const viaVerbal = tryVerbalSolve(redYellow, classTraffic);
assert.equal(viaVerbal?.answerLabel, 'A');

console.log('trafficSolve.test.mjs OK');
