import assert from 'node:assert/strict';

import {
  allowedImageUrl,
  allowedRedirectUrl,
  readBodyLimited,
} from './remoteImagePolicy.mjs';

assert.equal(
  allowedImageUrl('https://firebasestorage.googleapis.com/v0/b/demo/o/a.jpg').hostname,
  'firebasestorage.googleapis.com',
);
assert.equal(
  allowedImageUrl('https://storage.googleapis.com/demo/a.jpg').hostname,
  'storage.googleapis.com',
);
assert.equal(
  allowedImageUrl('http://127.0.0.1:8790/a.png', { allowLoopback: true }).hostname,
  '127.0.0.1',
);

assert.throws(() => allowedImageUrl('http://example.com/a.jpg'), /protocol/);
assert.throws(() => allowedImageUrl('https://example.com/a.jpg'), /host/);
assert.throws(() => allowedImageUrl('http://127.0.0.1:8790/a.png'), /protocol/);
assert.throws(() => allowedImageUrl('file:///etc/passwd'), /protocol/);
assert.throws(
  () =>
    allowedRedirectUrl(
      'https://firebasestorage.googleapis.com/v0/b/demo/o/a.jpg',
      'http://127.0.0.1:8080/private',
    ),
  /protocol/,
);
assert.equal(
  allowedRedirectUrl(
    'https://firebasestorage.googleapis.com/v0/b/demo/o/a.jpg',
    'https://storage.googleapis.com/demo/a.jpg',
  ).hostname,
  'storage.googleapis.com',
);

const small = new Response(Buffer.from('1234'), {
  headers: { 'content-length': '4', 'content-type': 'image/png' },
});
assert.equal((await readBodyLimited(small, 8)).toString(), '1234');

const declaredTooLarge = new Response(Buffer.from('1234'), {
  headers: { 'content-length': '20', 'content-type': 'image/png' },
});
await assert.rejects(() => readBodyLimited(declaredTooLarge, 8), /image_too_large/);

const streamedTooLarge = new Response(Buffer.from('123456789'), {
  headers: { 'content-type': 'image/png' },
});
await assert.rejects(() => readBodyLimited(streamedTooLarge, 8), /image_too_large/);

console.log('remoteImagePolicy.test.mjs OK');
