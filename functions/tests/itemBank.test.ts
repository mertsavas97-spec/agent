import * as fs from 'fs';
import * as path from 'path';

import { ALL_TOPICS } from '../src/data/topics';

const ROOT = path.resolve(__dirname, '../../content/item-bank');

function walkJson(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) out.push(...walkJson(p));
    else if (name.endsWith('.json') && !name.includes('schema') && !p.includes('manifests')) {
      out.push(p);
    }
  }
  return out;
}

describe('item-bank seed', () => {
  const files = walkJson(ROOT);
  const topicIds = new Set(ALL_TOPICS.map((t) => t.id));

  it('has seed items on disk', () => {
    expect(files.length).toBeGreaterThanOrEqual(3);
  });

  it('each item is original/owned and topicId exists', () => {
    for (const file of files) {
      const item = JSON.parse(fs.readFileSync(file, 'utf8')) as {
        id: string;
        source: string;
        license: string;
        topicId: string;
        answerKey: string;
        choices: Record<string, string>;
        explanationSteps: unknown[];
        review: { similarityCheck: string };
      };
      expect(item.source).toBe('original');
      expect(item.license).toBe('owned');
      expect(item.review.similarityCheck).toBe('pass');
      expect(topicIds.has(item.topicId)).toBe(true);
      expect(item.choices[item.answerKey]).toBeTruthy();
      expect(item.explanationSteps.length).toBeGreaterThanOrEqual(2);
      expect(path.basename(file)).toBe(`${item.id}.json`);
    }
  });

  it('mvp-1.0 manifest ids resolve to files', () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'manifests/mvp-1.0.json'), 'utf8'),
    ) as { items: string[] };
    for (const id of manifest.items) {
      const found = files.some((f) => path.basename(f) === `${id}.json`);
      expect(found).toBe(true);
    }
  });
});
