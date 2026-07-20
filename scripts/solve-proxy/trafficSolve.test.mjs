import assert from 'node:assert/strict';
import { classifyOcr } from './classifyOcr.mjs';
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

const powertrain = `
Şekildeki araç güç aktarma organlarının adları hangi seçenekte doğru olarak verilmiştir?
A) I. Şaft II. Diferansiyel III. Aks
B) I. Şaft II. Aks III. Diferansiyel
C) I. Diferansiyel II. Aks III. Şaft
D) I. Aks II. Diferansiyel III. Şaft
`;

const classTraffic = { subject: 'traffic', confidence: 'high', topicKey: 'kurallar' };

const ry = tryTrafficSolve(redYellow, classTraffic);
assert.ok(ry?.steps?.length >= 3);
assert.equal(ry.answerLabel, 'A');
assert.match(ry.answerText, /hazırlan/i);
assert.equal(ry.subject, 'traffic');
assert.equal(ry.topicKey, 'kurallar');
assert.match(ry.steps[0].title, /İşaret/i);

const ln = tryTrafficSolve(lane, classTraffic);
assert.ok(ln?.answerLabel);
assert.equal(ln.answerLabel, 'B');
assert.equal(ln.subject, 'traffic');

const viaVerbal = tryVerbalSolve(redYellow, classTraffic);
assert.equal(viaVerbal?.answerLabel, 'A');
assert.equal(viaVerbal?.subject, 'traffic');

const pt = tryTrafficSolve(powertrain, classTraffic);
assert.equal(pt?.answerLabel, 'A');
assert.equal(pt?.subject, 'vehicle');
assert.equal(pt?.topicKey, 'motor');
assert.match(pt?.answerText ?? '', /Şaft/i);

const classified = classifyOcr(powertrain, 'trafik');
assert.equal(classified.subject, 'vehicle');
assert.equal(classified.topicKey, 'motor');

console.log('trafficSolve.test.mjs OK');
