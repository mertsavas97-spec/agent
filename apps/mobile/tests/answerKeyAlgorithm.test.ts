import { topicsForExam } from '@/src/data';
import {
  itemsForExam,
  itemsForTopic,
  placeCorrectAt,
  type ItemBankChoiceKey,
} from '@/src/data/itemBank';
import type { ExamType } from '@/src/lib/api/types';

const EXAMS: ExamType[] = ['lgs', 'ygs', 'kpss', 'trafik'];
const KEYS: ItemBankChoiceKey[] = ['A', 'B', 'C', 'D', 'E'];

describe('placeCorrectAt', () => {
  it('moves the correct text to the target key and keeps five distinct choices', () => {
    const choices = {
      A: 'doğru',
      B: 'yanlış1',
      C: 'yanlış2',
      D: 'yanlış3',
      E: 'yanlış4',
    };
    const placed = placeCorrectAt(choices, 'A', 'D');
    expect(placed.answerKey).toBe('D');
    expect(placed.choices.D).toBe('doğru');
    expect(new Set(Object.values(placed.choices)).size).toBe(5);
    expect(Object.values(placed.choices)).toContain('yanlış1');
  });
});

describe('sample answer-key algorithm (all exams)', () => {
  it('every item has a non-empty correct choice and five filled options', () => {
    const bad: string[] = [];
    for (const exam of EXAMS) {
      for (const item of itemsForExam(exam)) {
        for (const k of KEYS) {
          if (!String(item.choices[k] ?? '').trim()) bad.push(`${item.id} missing ${k}`);
        }
        if (!String(item.choices[item.answerKey] ?? '').trim()) {
          bad.push(`${item.id} empty correct`);
        }
        const vals = Object.values(item.choices);
        if (new Set(vals).size !== vals.length) bad.push(`${item.id} duplicate choices`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('explanation “Cevap X” matches answerKey when present', () => {
    const bad: string[] = [];
    for (const exam of EXAMS) {
      for (const item of itemsForExam(exam)) {
        const blob = item.explanationSteps.map((s) => s.body).join(' ');
        const m = blob.match(/Cevap\s+([A-E])\b/i);
        if (m && m[1].toUpperCase() !== item.answerKey) {
          bad.push(`${item.id}: steps=${m[1]} key=${item.answerKey}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('no exam parks >55% of correct answers on a single letter', () => {
    const bad: string[] = [];
    for (const exam of EXAMS) {
      const items = itemsForExam(exam);
      const dist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
      for (const item of items) dist[item.answerKey] += 1;
      for (const k of KEYS) {
        const pct = (100 * dist[k]) / items.length;
        if (pct > 55) bad.push(`${exam}: ${k}=${pct.toFixed(1)}%`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('every exam uses at least four different correct letters', () => {
    const bad: string[] = [];
    for (const exam of EXAMS) {
      const used = new Set(itemsForExam(exam).map((i) => i.answerKey));
      if (used.size < 4) bad.push(`${exam}: only ${[...used].join(',')}`);
    }
    expect(bad).toEqual([]);
  });

  it('trafik topics are not all-A after rotation', () => {
    const allA = topicsForExam('trafik').filter((t) => {
      const items = itemsForTopic(t.id);
      return items.length > 0 && items.every((i) => i.answerKey === 'A');
    });
    expect(allA.map((t) => t.id)).toEqual([]);
  });
});
