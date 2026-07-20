/** Vision TEXT_DETECTION via API key (server-side only). */
export async function ocrImageBase64(imageBase64, mimeType = 'image/jpeg') {
  const key = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!key) throw new Error('GOOGLE_CLOUD_VISION_API_KEY missing');

  const cleaned = imageBase64.replace(/^data:[^;]+;base64,/, '');
  const url = `https://vision.googleapis.com/v1/images:annotate?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        {
          image: { content: cleaned },
          features: [
            { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },
            { type: 'TEXT_DETECTION', maxResults: 1 },
          ],
          imageContext: { languageHints: ['tr', 'en'] },
        },
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Vision HTTP ${res.status}`);
  }
  const full =
    data?.responses?.[0]?.fullTextAnnotation?.text ||
    data?.responses?.[0]?.textAnnotations?.[0]?.description ||
    '';
  return String(full).trim();
}
