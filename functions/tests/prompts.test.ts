import {
  explainAgainPrompt,
  mathSystemPrompt,
  systemPromptForSolve,
  turkishSystemPromptStub,
} from '../src/solve/prompts';

describe('exam prompts', () => {
  it('specializes teacher role and item-bank few-shot per exam', () => {
    expect(mathSystemPrompt('lgs')).toContain('LGS');
    expect(mathSystemPrompt('lgs')).toContain('lgs-math-kesirler');
    expect(mathSystemPrompt('lgs')).toMatch(/pastanın|3\/8/);
    expect(mathSystemPrompt('ygs')).toMatch(/YGS|YKS/);
    expect(mathSystemPrompt('ygs')).toContain('ygs-math-denklemler');
    expect(mathSystemPrompt('kpss')).toContain('KPSS');
    expect(mathSystemPrompt('kpss')).toContain('kpss-math-yuzde');
  });

  it('routes turkish subjectHint to turkish teacher + few-shot', () => {
    const p = systemPromptForSolve('lgs', 'turkish');
    expect(p).toMatch(/Türkçe öğretmeni/i);
    expect(p).toContain('lgs-turkish-sozcukte-anlam');
    expect(p).toContain('Öncelik ders: Türkçe');
  });

  it('routes science subjectHint with catalog filter', () => {
    const p = systemPromptForSolve('lgs', 'science');
    expect(p).toMatch(/Fen Bilimleri öğretmeni/);
    expect(p).toMatch(/lgs-science-/);
  });

  it('explain prompt asks for simpler language', () => {
    expect(explainAgainPrompt('lgs').toLowerCase()).toContain('sade');
  });

  it('turkish stubs mention exam and turkish topic prefix', () => {
    expect(turkishSystemPromptStub('lgs')).toContain('LGS');
    expect(turkishSystemPromptStub('kpss')).toContain('kpss-turkish-');
  });
});

