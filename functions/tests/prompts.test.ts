import { explainAgainPrompt, mathSystemPrompt } from '../src/solve/prompts';

describe('exam prompts', () => {
  it('specializes teacher role per exam', () => {
    expect(mathSystemPrompt('lgs')).toContain('LGS');
    expect(mathSystemPrompt('ygs')).toMatch(/YGS|YKS/);
    expect(mathSystemPrompt('kpss')).toContain('KPSS');
  });

  it('explain prompt asks for simpler language', () => {
    expect(explainAgainPrompt('lgs').toLowerCase()).toContain('sade');
  });
});
