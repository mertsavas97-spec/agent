/**
 * End-to-end answer detection matrix for LGS / YGS / KPSS / Ehliyet.
 * Simulates: classify → verbal/traffic/math → must produce answerLabel/answerText
 * (or math value) for known fixtures. Also checks exam-switch isolation.
 */
import assert from 'node:assert/strict';
import { evaluateExpression, buildStepsFromEval } from './arithSolve.mjs';
import { classifyOcr, topicIdFor } from './classifyOcr.mjs';
import {
  assertPipelineIsolation,
  mayRunMathSolver,
} from './examPipeline.mjs';
import { tryVerbalSolve } from './verbalSolve.mjs';

function solveDogfood(ocrText, examType) {
  const classified = classifyOcr(ocrText, examType);
  const topicId = topicIdFor(examType, classified.subject, classified.topicKey);

  if (classified.subject !== 'math') {
    const verbal = tryVerbalSolve(ocrText, classified, examType);
    if (verbal?.steps?.length && (verbal.answerText || verbal.answerLabel)) {
      const subject = verbal.subject || classified.subject;
      const topicKey = verbal.topicKey || classified.topicKey;
      return {
        subject,
        topicId: topicIdFor(examType, subject, topicKey),
        answerLabel: verbal.answerLabel,
        answerText: verbal.answerText,
        steps: verbal.steps,
        via: 'verbal',
      };
    }
  }

  if (mayRunMathSolver(examType)) {
    const evaluated = evaluateExpression(ocrText);
    if (evaluated) {
      const steps = buildStepsFromEval(evaluated);
      return {
        subject: 'math',
        topicId: topicIdFor(examType, 'math', classified.topicKey || 'temel'),
        answerLabel: evaluated.choice,
        answerText: String(evaluated.value),
        steps,
        via: 'math',
      };
    }
  }

  return {
    subject: classified.subject,
    topicId,
    answerLabel: undefined,
    answerText: undefined,
    steps: [],
    via: 'miss',
  };
}

function assertHasAnswer(result, label) {
  assert.ok(
    result.answerText || result.answerLabel,
    `${label}: expected answer, via=${result.via} subject=${result.subject}`,
  );
}

const FIXTURES = [
  // --- LGS ---
  {
    id: 'lgs-math-order',
    exam: 'lgs',
    ocr: `3. 2 + 2 × 3 işleminin sonucu kaçtır?
A) 6
B) 8
C) 10
D) 12`,
    expectSubject: 'math',
    expectAnswer: /8|B/i,
  },
  {
    id: 'lgs-turkish-anlatim',
    exam: 'lgs',
    ocr: `Sokakta başı boş dolaşan köpeklere yiyecek vermeyi ihmal etmeyen komşumuz her sabah onlarla ilgilenir.
Bu parçanın anlatım biçimi nedir?
A) öyküleme
B) betimleme
C) açıklama
D) tartışma`,
    expectSubject: 'turkish',
    expectAnswer: /öyküleme|A/i,
  },
  {
    id: 'lgs-turkish-anlam',
    exam: 'lgs',
    ocr: `Yıllık planlarını yapmak için saatlerce çalışma masasında çalışmıştı.
Bu parçadaki anlam ilgisi nedir?
A) neden-sonuç
B) amaç-sonuç
C) koşul-sonuç
D) karşıtlık`,
    expectSubject: 'turkish',
    expectAnswer: /amaç|B/i,
  },

  // --- YGS ---
  {
    id: 'ygs-math',
    exam: 'ygs',
    ocr: `4. 15 + 3 × 4 işleminin sonucu kaçtır?
A) 27
B) 72
C) 19
D) 60`,
    expectSubject: 'math',
    expectAnswer: /27|A/i,
  },
  {
    id: 'ygs-turkish-anlatim',
    exam: 'ygs',
    ocr: `Komşumuz her sabah köpeklerle ilgilenir ve onlarla konuşurdu.
Bu parçanın anlatım biçimi nedir?
A) betimleme
B) öyküleme
C) tartışma
D) açıklama`,
    expectSubject: 'turkish',
    expectAnswer: /öyküleme|B/i,
  },
  {
    id: 'ygs-biology-classify',
    exam: 'ygs',
    ocr: `Fotosentez hangi organelde gerçekleşir?
A) Mitokondri
B) Kloroplast
C) Ribozom
D) Lizozom`,
    expectSubject: 'biology',
    soft: true, // classify only until fen solvers exist
  },

  // --- KPSS ---
  {
    id: 'kpss-math-fraction',
    exam: 'kpss',
    ocr: `5(2-3/5)/2(3-5/2) işleminin sonucu kaçtır?
A) 1
B) 3
C) 5
D) 6
E) 7`,
    expectSubject: 'math',
    expectAnswer: /7|E/i,
  },
  {
    id: 'kpss-turkish-anlatim',
    exam: 'kpss',
    ocr: `96. Sokakta başı boş dolaşan köpeklere yiyecek vermeyi ihmal etmeyen komşumuz her sabah onlarla ilgilenir.
Bu parçanın anlatım biçimi nedir?
A) öyküleme
B) betimleme
C) açıklama
D) tartışma`,
    expectSubject: 'turkish',
    expectAnswer: /öyküleme/i,
  },
  {
    id: 'kpss-turkish-anlam',
    exam: 'kpss',
    ocr: `97. Yıllık planlarını yapmak için saatlerce çalışma masasında çalışmıştı.
Bu parçadaki anlam ilgisi nedir?
A) neden-sonuç
B) amaç-sonuç
C) koşul-sonuç
D) karşıtlık`,
    expectSubject: 'turkish',
    expectAnswer: /amaç/i,
  },

  // --- Ehliyet ---
  {
    id: 'trafik-light',
    exam: 'trafik',
    ocr: `Şekildeki gibi ışıklı trafik işaret cihazında, sarı ve kırmızı ışığın birlikte yandığını gören sürücü ne yapmalıdır?
A) Harekete hazırlanmalı
B) Yolun en sağına yaklaşmalı
C) Hızlanmalı
D) Geçmeli`,
    expectSubject: 'traffic',
    expectAnswer: /hazırlan|A/i,
  },
  {
    id: 'trafik-shaft',
    exam: 'trafik',
    ocr: `Şekildeki araç güç aktarma organlarının adları hangi seçenekte doğru olarak verilmiştir?
A) I. Şaft II. Diferansiyel III. Aks
B) I. Şaft II. Aks III. Diferansiyel
C) I. Diferansiyel II. Aks III. Şaft
D) I. Aks II. Diferansiyel III. Şaft`,
    expectSubject: 'vehicle',
    expectAnswer: /Şaft|A/i,
  },
  {
    id: 'trafik-abs',
    exam: 'trafik',
    ocr: `ABS sisteminin görevi nedir?
A) Yakıt tasarrufu sağlamak
B) Tekerleklerin kilitlenmesini önlemek
C) Motor ısısını düşürmek
D) Farları otomatik yakmak`,
    expectSubject: 'vehicle',
    expectAnswer: /kilitlen|B/i,
  },
  {
    id: 'trafik-abc',
    exam: 'trafik',
    ocr: `İlk yardımda ABC kontrolünün doğru sırası hangisidir?
A) Dolaşım - solunum - hava yolu
B) Hava yolu - solunum - dolaşım
C) Solunum - hava yolu - dolaşım
D) Bilinç - dolaşım - solunum`,
    expectSubject: 'firstaid',
    expectAnswer: /Hava yolu|B|ABC/i,
  },
  {
    id: 'trafik-speed',
    exam: 'trafik',
    ocr: `Yerleşim yeri içinde aksine bir işaret yoksa azami hız limiti kaç km/s'tir?
A) 30
B) 50
C) 70
D) 90`,
    expectSubject: 'traffic',
    expectAnswer: /50|B/i,
  },
];

let softMiss = 0;
for (const f of FIXTURES) {
  const result = solveDogfood(f.ocr, f.exam);
  assert.equal(
    result.subject,
    f.expectSubject,
    `${f.id}: subject want ${f.expectSubject} got ${result.subject} via=${result.via}`,
  );

  const payload = {
    subject: result.subject,
    topicId: result.topicId,
    steps: result.steps,
  };
  const iso = assertPipelineIsolation(payload, f.exam);
  assert.ok(iso.ok, `${f.id}: isolation ${JSON.stringify(iso.issues)}`);

  if (f.expectAnswer) {
    if (result.via === 'miss' && f.soft) {
      softMiss += 1;
      console.log(`soft-miss ${f.id} (classify-only ok)`);
      continue;
    }
    assertHasAnswer(result, f.id);
    const blob = `${result.answerLabel ?? ''} ${result.answerText ?? ''}`;
    assert.match(blob, f.expectAnswer, `${f.id}: answer blob=${blob}`);
  } else if (f.soft) {
    softMiss += 1;
  }

  console.log(`ok ${f.id} → ${result.via} ${result.subject} ${result.answerLabel ?? ''} ${result.answerText ?? ''}`);
}

// --- Exam switch: academic OCR under Ehliyet must not emit turkish solved as trafik answer leak ---
{
  const turkishOcr = FIXTURES.find((x) => x.id === 'kpss-turkish-anlatim').ocr;
  const underTrafik = solveDogfood(turkishOcr, 'trafik');
  // May miss or map to traffic tips — must NOT return turkish öyküleme as ehliyet answer
  if (underTrafik.via !== 'miss') {
    assert.notEqual(underTrafik.subject, 'turkish');
  }
  console.log('ok exam-switch isolation turkish→trafik via=', underTrafik.via);
}

{
  const shaft = FIXTURES.find((x) => x.id === 'trafik-shaft').ocr;
  const underKpss = solveDogfood(shaft, 'kpss');
  // Traffic solver hard-blocked under KPSS
  if (underKpss.via === 'verbal' && underKpss.subject === 'vehicle') {
    assert.fail('vehicle branş must not solve under KPSS');
  }
  console.log('ok exam-switch isolation shaft→kpss via=', underKpss.via, underKpss.subject);
}

console.log(`pipeline matrix passed (${FIXTURES.length} fixtures, ${softMiss} soft)`);
