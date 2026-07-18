import {
  explainAgainPrompt,
  mathSystemPrompt,
  turkishSystemPromptStub,
} from '../src/solve/prompts';

describe('exam prompts', () => {
  it('specializes teacher role and few-shot per exam', () => {
    expect(mathSystemPrompt('lgs')).toContain('LGS');
    expect(mathSystemPrompt('lgs')).toContain('lgs-math-kesirler');
    expect(mathSystemPrompt('ygs')).toMatch(/YGS|YKS/);
    expect(mathSystemPrompt('ygs')).toContain('ygs-math-denklemler');
    expect(mathSystemPrompt('kpss')).toContain('KPSS');
    expect(mathSystemPrompt('kpss')).toContain('kpss-math-yuzde');
  });

  it('explain prompt asks for simpler language', () => {
    expect(explainAgainPrompt('lgs').toLowerCase()).toContain('sade');
  });

  it('turkish stubs mention exam and turkish topic prefix', () => {
    expect(turkishSystemPromptStub('lgs')).toContain('LGS');
    expect(turkishSystemPromptStub('kpss')).toContain('kpss-turkish-');
  });
});

