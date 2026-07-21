import {
  buildShortSummary,
  extractAnswerFromSteps,
  reasoningSteps,
  resolveSolutionAnswer,
} from '@/src/features/solve/solutionAnswer';

describe('solutionAnswer', () => {
  it('prefers explicit answer field', () => {
    expect(
      resolveSolutionAnswer(
        { text: 'öyküleme' },
        [{ title: 'Cevap', body: 'Doğru şık: A) betimleme' }],
      ),
    ).toEqual({ text: 'öyküleme' });
  });

  it('extracts choice from Cevap step', () => {
    expect(
      extractAnswerFromSteps([
        { title: '1', body: '...' },
        { title: 'Cevap', body: 'Doğru şık: E) 7.' },
      ]),
    ).toEqual({ label: 'E', text: '7' });
  });

  it('extracts Ehliyet choice without trailing period', () => {
    expect(
      extractAnswerFromSteps([
        {
          title: 'Cevap',
          body: 'Doğru şık: A) I. Şaft · II. Diferansiyel · III. Aks',
        },
      ]),
    ).toEqual({
      label: 'A',
      text: 'I. Şaft · II. Diferansiyel · III. Aks',
    });
  });

  it('extracts anlatım biçimi', () => {
    expect(
      extractAnswerFromSteps([
        { title: 'Cevap', body: 'En uygun anlatım biçimi: öyküleme' },
      ]),
    ).toEqual({ text: 'öyküleme' });
  });

  it('extracts anlam ilgisi label', () => {
    expect(
      extractAnswerFromSteps([
        { title: 'Cevap', body: 'Anlam ilgisi: Amaç-sonuç' },
      ]),
    ).toEqual({ text: 'Amaç-sonuç' });
  });

  it('drops Cevap step from reasoning list', () => {
    const steps = [
      { title: '1. Soru ne istiyor?', body: 'a' },
      { title: 'Cevap', body: 'En uygun anlatım biçimi: öyküleme' },
    ];
    expect(reasoningSteps(steps)).toHaveLength(1);
    expect(reasoningSteps(steps)[0]?.title).toMatch(/Soru/);
  });

  it('builds short summary with answer first', () => {
    const summary = buildShortSummary(
      { text: 'öyküleme' },
      [
        { title: '1', body: 'kök' },
        { title: '3. Neden bu biçim?', body: 'Zaman zinciri öykülemeyi gösterir.' },
        { title: 'Cevap', body: 'En uygun anlatım biçimi: öyküleme' },
      ],
    );
    expect(summary).toMatch(/^Cevap: öyküleme/);
    expect(summary).toMatch(/Zaman zinciri/);
  });

  it('does not promote tip/fallback steps into DOĞRU CEVAP', () => {
    expect(
      extractAnswerFromSteps([
        { title: '1. Soruyu oku', body: 'Verilenleri ayır.' },
        {
          title: '3. Kontrol et',
          body: 'Sonucu yerine koyarak veya şıkları eleyerek doğrula.',
        },
      ]),
    ).toBeNull();
    expect(
      extractAnswerFromSteps([
        {
          title: '3. Güvenliği seç',
          body: '“Önce güvenlik” ilkesine uymayan şıkkı eleyen seçeneği tercih et.',
        },
      ]),
    ).toBeNull();
    expect(
      resolveSolutionAnswer(undefined, [
        { title: '3. Tekrar dene', body: 'Ders netleşince adımlar o derse göre düzenlenir.' },
      ]),
    ).toBeNull();
  });
});
