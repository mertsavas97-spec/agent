/**
 * Cross-exam isolation: Ehliyet pipeline must never emit LGS/YGS/KPSS
 * subjects/topics, and vice versa.
 */
import assert from 'node:assert/strict';
import { applySubjectHint, classifyOcr, topicIdFor } from './classifyOcr.mjs';
import { detectExamHint } from './examHint.mjs';
import {
  assertPipelineIsolation,
  mayRunMathSolver,
  mayRunTrafficSolver,
  mayRunTurkishSolver,
  resolveSolveExam,
  topicBelongsToExam,
} from './examPipeline.mjs';
import { tryVerbalSolve } from './verbalSolve.mjs';

const TRAFIK_OCR = `
Şekildeki gibi ışıklı trafik işaret cihazında, sarı ve kırmızı ışığın birlikte yandığını gören sürücü ne yapmalıdır?
A) Harekete hazırlanmalı
B) Yolun en sağına yaklaşmalı
C) Hızlanmalı
D) Geçmeli
`;

const SHAFT_OCR = `
Şekildeki araç güç aktarma organlarının adları hangi seçenekte doğru olarak verilmiştir?
A) I. Şaft II. Diferansiyel III. Aks
B) I. Şaft II. Aks III. Diferansiyel
C) I. Diferansiyel II. Aks III. Şaft
D) I. Aks II. Diferansiyel III. Şaft
`;

const TURKISH_OCR = `
96. Sokakta başı boş dolaşan köpeklere yiyecek vermeyi ihmal etmeyen komşumuz her sabah onlarla ilgilenir.
Bu parçanın anlatım biçimi nedir?
A) öyküleme
B) betimleme
C) açıklama
D) tartışma
`;

const MATH_OCR = `
3. 2 + 2 × 3 işleminin sonucu kaçtır?
A) 6
B) 8
C) 10
D) 12
`;

// --- resolveSolveExam never switches ---
assert.equal(resolveSolveExam('trafik'), 'trafik');
assert.equal(resolveSolveExam('kpss'), 'kpss');
assert.equal(resolveSolveExam('lgs'), 'lgs');
assert.equal(resolveSolveExam('ygs'), 'ygs');

// --- Solver gates ---
assert.equal(mayRunTrafficSolver('trafik', 'turkish'), true);
assert.equal(mayRunTrafficSolver('trafik', 'traffic'), true);
assert.equal(mayRunTrafficSolver('kpss', 'turkish'), false);
assert.equal(mayRunTrafficSolver('kpss', 'traffic'), false); // never cross package
assert.equal(mayRunTrafficSolver('lgs', 'vehicle'), false);
assert.equal(mayRunTrafficSolver('ygs', 'firstaid'), false);
assert.equal(mayRunTurkishSolver('trafik', 'turkish'), false);
assert.equal(mayRunTurkishSolver('kpss', 'turkish'), true);
assert.equal(mayRunMathSolver('trafik'), false);
assert.equal(mayRunMathSolver('lgs'), true);

// --- classifyOcr never leaks trafik subjects into other exams ---
{
  const c = classifyOcr(TRAFIK_OCR, 'kpss');
  assert.notEqual(c.subject, 'traffic');
  assert.notEqual(c.subject, 'vehicle');
  assert.notEqual(c.subject, 'firstaid');
  const tid = topicIdFor('kpss', c.subject, c.topicKey);
  assert.ok(!tid.startsWith('trafik-'), tid);
  console.log('ok kpss + trafik OCR → non-trafik subject', c.subject, tid);
}

{
  const c = classifyOcr(SHAFT_OCR, 'lgs');
  assert.ok(!['traffic', 'vehicle', 'firstaid'].includes(c.subject), c.subject);
  const tid = topicIdFor('lgs', 'vehicle', 'motor');
  assert.ok(tid.startsWith('lgs-'), tid);
  assert.ok(!tid.startsWith('trafik-'), tid);
  console.log('ok lgs topicIdFor(vehicle) remaps away from trafik-*', tid);
}

{
  const c = classifyOcr(TRAFIK_OCR, 'trafik');
  assert.equal(c.subject, 'traffic');
  const tid = topicIdFor('trafik', c.subject, c.topicKey);
  assert.ok(tid.startsWith('trafik-traffic-'), tid);
  console.log('ok trafik + light OCR → traffic topic', tid);
}

{
  const c = classifyOcr(TURKISH_OCR, 'trafik');
  // Allowed subjects only — never turkish under trafik classify
  assert.ok(['traffic', 'vehicle', 'firstaid'].includes(c.subject), c.subject);
  console.log('ok trafik + turkish OCR classify stays in ehliyet subjects', c.subject);
}

// --- verbalSolve isolation ---
{
  const kpssClass = { subject: 'turkish', confidence: 'high', topicKey: 'paragraf' };
  const hit = tryVerbalSolve(TRAFIK_OCR, kpssClass, 'kpss');
  // Must NOT return Ehliyet traffic answer under KPSS
  assert.ok(!hit || hit.subject !== 'traffic', JSON.stringify(hit));
  assert.ok(!hit || !hit.topicKey || hit.topicKey !== 'kurallar' || hit.subject === 'turkish');
  assert.equal(mayRunTrafficSolver('kpss', 'turkish'), false);
  // With turkish class, may still try turkish solvers — trafik OCR won't match anlatım
  console.log('ok kpss verbal on trafik OCR does not emit vehicle/traffic branş', hit?.subject);
}

{
  // Even if classification wrongly says traffic under KPSS, solver must stay closed
  const leaked = tryVerbalSolve(TRAFIK_OCR, { subject: 'traffic', topicKey: 'kurallar' }, 'kpss');
  assert.equal(leaked, null);
  const leakedLgs = tryVerbalSolve(TRAFIK_OCR, { subject: 'vehicle', topicKey: 'motor' }, 'lgs');
  assert.equal(leakedLgs, null);
  console.log('ok traffic solver hard-blocked under LGS/YGS/KPSS even with leaked branş');
}

{
  const trafikClass = classifyOcr(TRAFIK_OCR, 'trafik');
  const hit = tryVerbalSolve(TRAFIK_OCR, trafikClass, 'trafik');
  assert.ok(hit?.steps?.length);
  assert.equal(hit.subject, 'traffic');
  assert.ok(hit.answerLabel);
  console.log('ok trafik verbal returns ehliyet answer', hit.answerLabel);
}

{
  const trafikClass = classifyOcr(TURKISH_OCR, 'trafik');
  const hit = tryVerbalSolve(TURKISH_OCR, trafikClass, 'trafik');
  // Must NOT produce öyküleme / turkish answer under Ehliyet
  assert.ok(!hit || (hit.subject !== 'turkish' && hit.answerText !== 'öyküleme'));
  console.log('ok trafik exam blocks turkish anlatım solver', hit?.subject ?? 'null');
}

{
  const kpssClass = classifyOcr(TURKISH_OCR, 'kpss');
  const hit = tryVerbalSolve(TURKISH_OCR, kpssClass, 'kpss');
  assert.ok(hit?.steps?.length);
  assert.ok(!hit.subject || hit.subject !== 'traffic');
  console.log('ok kpss turkish still solves', hit.answerText);
}

// --- examHint still reports mismatch but pipeline stays on profile ---
{
  const hint = detectExamHint(TRAFIK_OCR, 'kpss');
  assert.equal(hint.suggested, 'trafik');
  assert.equal(hint.mismatchesProfile, true);
  assert.equal(resolveSolveExam('kpss'), 'kpss');
  console.log('ok mismatch hint without pipeline switch');
}

{
  const hint = detectExamHint(TURKISH_OCR, 'trafik');
  assert.equal(hint.mismatchesProfile, true);
  assert.equal(resolveSolveExam('trafik'), 'trafik');
  console.log('ok trafik profile keeps solveExam=trafik despite turkish hint');
}

// --- assertPipelineIsolation ---
{
  const bad = {
    status: 'solved',
    subject: 'traffic',
    topicId: 'trafik-traffic-kurallar',
  };
  assert.equal(assertPipelineIsolation(bad, 'kpss').ok, false);
  assert.equal(assertPipelineIsolation(bad, 'trafik').ok, true);
  assert.equal(topicBelongsToExam('lgs-math-kesirler', 'trafik'), false);
  assert.equal(topicBelongsToExam('trafik-vehicle-motor', 'lgs'), false);
  console.log('ok assertPipelineIsolation');
}

// --- shaft under trafik ---
{
  const c = classifyOcr(SHAFT_OCR, 'trafik');
  assert.equal(c.subject, 'vehicle');
  const hit = tryVerbalSolve(SHAFT_OCR, c, 'trafik');
  assert.equal(hit?.subject, 'vehicle');
  assert.equal(hit?.answerLabel, 'A');
  const tid = topicIdFor('trafik', hit.subject, hit.topicKey);
  assert.equal(tid, 'trafik-vehicle-motor');
  console.log('ok shaft stays in ehliyet vehicle pipeline');
}

// --- YGS science stem maps to physics/chem/bio (not dead-zone drop) ---
{
  const bio = classifyOcr('Fotosentez hangi organelde gerçekleşir?\nA) Mitokondri\nB) Kloroplast', 'ygs');
  assert.equal(bio.subject, 'biology');
  const phys = classifyOcr('Kuvvet ve ivme ilişkisini açıklayan Newton yasası hangisidir?', 'ygs');
  assert.equal(phys.subject, 'physics');
  const chem = classifyOcr('Asit ve baz tepkimesinde hangi iyon oluşur?', 'ygs');
  assert.equal(chem.subject, 'chemistry');
  console.log('ok ygs fen branches classify');
}

// --- subjectHint honor via applySubjectHint ---
{
  const raw = classifyOcr(MATH_OCR, 'lgs');
  const forced = applySubjectHint(raw, 'turkish', 'lgs', MATH_OCR);
  assert.equal(forced.subject, 'turkish');
  assert.equal(forced.confidence, 'high');
  assert.equal(forced.needsConfirm, false);
  console.log('ok subjectHint applied');
}

console.log('all examPipeline isolation tests passed');
