import fs from 'node:fs';
import path from 'node:path';

const EXPECTED =
  'google.com, pub-4628962707131944, DIRECT, f08c47fec0942fa0';

describe('hosting app-ads.txt (AdMob)', () => {
  const file = path.resolve(__dirname, '../../../hosting/public/app-ads.txt');

  it('exists at hosting root with exact AdMob authorization line', () => {
    expect(fs.existsSync(file)).toBe(true);
    const raw = fs.readFileSync(file);
    // No UTF-8 BOM
    expect(raw[0]).not.toBe(0xef);
    const text = raw.toString('utf8');
    const lines = text.split(/\r?\n/);
    expect(lines).toContain(EXPECTED);
  });

  it('firebase.json pins text/plain for /app-ads.txt', () => {
    const firebaseJson = path.resolve(__dirname, '../../../firebase.json');
    const cfg = JSON.parse(fs.readFileSync(firebaseJson, 'utf8')) as {
      hosting: { headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }> };
    };
    const entry = cfg.hosting.headers.find((h) => h.source === '/app-ads.txt');
    expect(entry).toBeTruthy();
    const ctype = entry!.headers.find((h) => h.key === 'Content-Type');
    expect(ctype?.value).toMatch(/^text\/plain/);
  });
});
