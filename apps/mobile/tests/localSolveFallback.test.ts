import {
  buildLocalSolveFallback,
  isServerSolveUnavailable,
} from '@/src/features/solve/localSolveFallback';

describe('localSolveFallback', () => {
  it('returns solved response with steps for explicit math hint', () => {
    const res = buildLocalSolveFallback({
      examType: 'lgs',
      subjectHint: 'math',
      requestId: '123',
    });
    expect(res.status).toBe('solved');
    if (res.status !== 'solved') throw new Error('expected solved');
    expect(res.assisted).toBe(true);
    expect(res.answer).toBeUndefined();
    expect(res.steps.length).toBeGreaterThanOrEqual(3);
    expect(res.transparencyNote).not.toMatch(/deploy-firestore|bash/i);
    expect(res.topicId).toBe('lgs-math-kesirler');
    expect(res.subject).toBe('math');
  });

  it('does not default to math when unsupported without hint', () => {
    const res = buildLocalSolveFallback({
      examType: 'lgs',
      requestId: '1',
      reason: 'unsupported',
    });
    expect(res.status).toBe('solved');
    if (res.status !== 'solved') throw new Error('expected solved');
    expect(res.subject).toBe('unknown');
    expect(res.steps[0]?.body).toMatch(/ders/i);
    expect(res.transparencyNote).not.toMatch(/deploy|AI deploy/i);
  });

  it('uses turkish topic when subjectHint is turkish', () => {
    const res = buildLocalSolveFallback({
      examType: 'kpss',
      subjectHint: 'turkish',
      requestId: 'tr1',
      reason: 'unsupported',
    });
    expect(res.status).toBe('solved');
    if (res.status !== 'solved') throw new Error('expected solved');
    expect(res.subject).toBe('turkish');
    expect(res.topicId).toBe('kpss-turkish-paragraf');
    expect(res.steps[0]?.body).toMatch(/anlatım|kök|metne/i);
  });

  it('uses temel işlemler topic for KPSS math hint', () => {
    const res = buildLocalSolveFallback({
      examType: 'kpss',
      subjectHint: 'math',
      requestId: '9',
    });
    expect(res.status).toBe('solved');
    if (res.status !== 'solved') throw new Error('expected solved');
    expect(res.topicId).toBe('kpss-math-temel-islemler');
  });

  it('defaults Ehliyet fallback to traffic branşı (no ders popup path)', () => {
    const res = buildLocalSolveFallback({
      examType: 'trafik',
      requestId: 'eh1',
      reason: 'unsupported',
    });
    expect(res.status).toBe('solved');
    if (res.status !== 'solved') throw new Error('expected solved');
    expect(res.subject).toBe('traffic');
    expect(res.topicId).toBe('trafik-traffic-kurallar');
    expect(res.steps[0]?.body).toMatch(/işaret|şerit|hız|kavşak/i);
  });

  it('locks vehicle branş from OCR on Ehliyet fallback', () => {
    const res = buildLocalSolveFallback({
      examType: 'trafik',
      requestId: 'eh2',
      reason: 'unsupported',
      ocrText:
        'Şekildeki araç güç aktarma organlarının adları hangi seçenekte doğru olarak verilmiştir?',
    });
    expect(res.status).toBe('solved');
    if (res.status !== 'solved') throw new Error('expected solved');
    expect(res.subject).toBe('vehicle');
    expect(res.topicId).toBe('trafik-vehicle-motor');
    expect(res.steps[0]?.body).toMatch(/güç aktarma|şaft|motor/i);
  });

  it('never keeps Ehliyet branş/topic under LGS/YGS/KPSS', () => {
    const res = buildLocalSolveFallback({
      examType: 'kpss',
      subjectHint: 'traffic',
      topicId: 'trafik-traffic-kurallar',
      requestId: 'x1',
    });
    expect(res.status).toBe('solved');
    if (res.status !== 'solved') throw new Error('expected solved');
    expect(res.subject).toBe('turkish');
    expect(res.topicId?.startsWith('trafik-')).toBe(false);
    expect(res.topicId?.startsWith('kpss-')).toBe(true);
  });

  it('never keeps turkish topic under Ehliyet', () => {
    const res = buildLocalSolveFallback({
      examType: 'trafik',
      subjectHint: 'turkish',
      topicId: 'kpss-turkish-paragraf',
      requestId: 'x2',
    });
    expect(res.status).toBe('solved');
    if (res.status !== 'solved') throw new Error('expected solved');
    expect(['traffic', 'vehicle', 'firstaid']).toContain(res.subject);
    expect(res.topicId?.startsWith('trafik-')).toBe(true);
  });

  it('detects server unavailable errors', () => {
    expect(
      isServerSolveUnavailable(
        Object.assign(new Error('SOLVE_TIMEOUT'), { code: 'functions/deadline-exceeded' }),
      ),
    ).toBe(true);
    expect(
      isServerSolveUnavailable(
        Object.assign(new Error('403'), { code: 'functions/permission-denied' }),
      ),
    ).toBe(true);
    expect(isServerSolveUnavailable(new Error('random'))).toBe(false);
  });
});
