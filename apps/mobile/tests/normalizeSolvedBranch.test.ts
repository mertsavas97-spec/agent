import { normalizeSolvedBranch } from '@/src/features/solve/normalizeSolvedBranch';
import { buildLocalSolveFallback } from '@/src/features/solve/localSolveFallback';

describe('normalizeSolvedBranch', () => {
  it('remaps şaft answer from traffic to vehicle + motor topic', () => {
    const out = normalizeSolvedBranch(
      {
        attemptId: 'a',
        solutionId: 's',
        status: 'solved',
        cached: false,
        topicId: 'trafik-traffic-kurallar',
        subject: 'traffic',
        steps: [
          { title: '1. Güç yolu', body: 'Motor → şaft → diferansiyel → aks' },
        ],
        answer: { text: 'I. Şaft · II. Diferansiyel · III. Aks', label: 'A' },
        transparencyNote: 'ok',
        quota: { remainingToday: 5, unlimited: false },
      },
      'trafik',
    );
    expect(out.subject).toBe('vehicle');
    expect(out.topicId).toBe('trafik-vehicle-motor');
  });

  it('keeps traffic for ışık / hazırlanmalı', () => {
    const out = normalizeSolvedBranch(
      {
        attemptId: 'a',
        solutionId: 's',
        status: 'solved',
        cached: false,
        topicId: 'trafik-traffic-kurallar',
        subject: 'traffic',
        steps: [{ title: '1', body: 'Işıklı cihazda kırmızı ile sarı' }],
        answer: { text: 'Harekete hazırlanmalı', label: 'A' },
        transparencyNote: 'ok',
        quota: { remainingToday: 5, unlimited: false },
      },
      'trafik',
    );
    expect(out.subject).toBe('traffic');
    expect(out.topicId).toBe('trafik-traffic-kurallar');
  });

  it('does NOT remap generic trafik fallback tips to firstaid', () => {
    const fallback = buildLocalSolveFallback({
      examType: 'trafik',
      requestId: 'x',
      reason: 'unavailable',
    });
    expect(fallback.status).toBe('solved');
    if (fallback.status !== 'solved') throw new Error('expected solved');
    expect(fallback.subject).toBe('traffic');

    const out = normalizeSolvedBranch(fallback, 'trafik');
    expect(out.subject).toBe('traffic');
    expect(out.topicId).toBe('trafik-traffic-kurallar');
    expect(out.subject).not.toBe('firstaid');
  });

  it('locks vehicle from OCR sourceText even when steps are generic', () => {
    const fallback = buildLocalSolveFallback({
      examType: 'trafik',
      requestId: 'pt',
      reason: 'unsupported',
    });
    expect(fallback.status).toBe('solved');
    if (fallback.status !== 'solved') throw new Error('expected solved');

    const out = normalizeSolvedBranch(fallback, 'trafik', {
      sourceText:
        'Şekildeki araç güç aktarma organlarının adları hangi seçenekte doğru olarak verilmiştir? I. Şaft II. Diferansiyel III. Aks',
    });
    expect(out.subject).toBe('vehicle');
    expect(out.topicId).toBe('trafik-vehicle-motor');
  });
});
