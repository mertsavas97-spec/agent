import { GoogleAuth } from 'google-auth-library';

/** ADC access token for GCP APIs (Vertex, Vision) — bills linked billing / Startup. */
export async function gcpAccessToken(): Promise<string> {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error('GCP ADC: no access token');
  return token.token;
}
