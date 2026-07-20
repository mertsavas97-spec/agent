import { normalizeSolvedBranch } from '@/src/features/solve/normalizeSolvedBranch';

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
});
