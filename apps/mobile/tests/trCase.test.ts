import { TR_EYEBROW, trUpper } from '@/src/lib/trCase';

describe('trCase', () => {
  it('uppercases Turkish i/İ correctly', () => {
    expect(trUpper('ipucu')).toBe('İPUCU');
    expect(trUpper('ilerleme')).toBe('İLERLEME');
    expect(trUpper('profil')).toBe('PROFİL');
  });

  it('ships dotted-İ eyebrows used across screens', () => {
    expect(TR_EYEBROW.tip).toBe('İPUCU');
    expect(TR_EYEBROW.progress).toBe('İLERLEME');
    expect(TR_EYEBROW.premium).toBe('PREMİUM');
    expect(TR_EYEBROW.legal).toBe('HUKUKİ');
  });
});
