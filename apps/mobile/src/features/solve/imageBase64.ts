/** Convert a local image URI to raw base64 (no data: prefix). */
export async function uriToBase64(uri: string): Promise<string | null> {
  try {
    const response = await fetch(uri);
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 80) return null;

    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  } catch (err) {
    console.warn('uriToBase64 failed', err);
    return null;
  }
}
