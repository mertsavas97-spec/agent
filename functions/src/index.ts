import * as functions from 'firebase-functions';

/** Health check — Phase 1 scaffold only. */
export const ping = functions.https.onRequest((_req, res) => {
  res.status(200).json({ ok: true, app: 'cozbil', exams: ['lgs', 'ygs', 'kpss'] });
});
