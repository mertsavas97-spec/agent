import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const port = 20_000 + (process.pid % 10_000);
const child = spawn(process.execPath, ['server.mjs'], {
  cwd: new URL('.', import.meta.url),
  env: {
    ...process.env,
    SOLVE_PROXY_PORT: String(port),
    COZBIL_PROXY_DOGFOOD: '1',
    COZBIL_PROXY_TOKEN: 'binary-e2e-token',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

async function waitForHealth() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      if (res.ok) return;
    } catch {
      // start-up wait
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('proxy start timeout');
}

try {
  await waitForHealth();
  const image = fs.readFileSync(
    new URL(
      '../../docs/qa/phone-solve-fixtures/images/lgs-math-kesir-dogfood-001.png',
      import.meta.url,
    ),
  );
  const unauthorized = await fetch(`http://127.0.0.1:${port}/solve-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'image/png' },
    body: image,
  });
  assert.equal(unauthorized.status, 401);

  const res = await fetch(`http://127.0.0.1:${port}/solve-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'image/png',
      'X-Cozbil-Exam-Type': 'lgs',
      'X-Cozbil-Request-Id': 'binary-e2e',
      'X-Cozbil-Proxy-Token': 'binary-e2e-token',
    },
    body: image,
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'solved');
  assert.deepEqual(data.answer, { label: 'B', text: '3' });
  console.log('serverBinary.test.mjs OK');
} finally {
  child.kill('SIGTERM');
}
