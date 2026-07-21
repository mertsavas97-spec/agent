import type { ExamType } from '../types/contracts';

import { gcpAccessToken } from './gcpAuth';

const DEFAULT_PROJECT = 'cozbil-dev-f9583';
const DEFAULT_LOCATION = 'us-central1';
const DEFAULT_MODEL = 'gemini-2.5-flash';

export function vertexProjectId(): string {
  return (
    process.env.GCLOUD_PROJECT ||
    process.env.GCP_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    DEFAULT_PROJECT
  );
}

export function vertexLocation(): string {
  return process.env.VERTEX_LOCATION || DEFAULT_LOCATION;
}

export function vertexModel(): string {
  return process.env.VERTEX_MODEL || DEFAULT_MODEL;
}

/** True only when explicitly opted into Vertex (GCP Startup / billing). */
export function useVertexAi(): boolean {
  return process.env.COZBIL_USE_VERTEX === '1';
}

type Part =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

/**
 * Call Gemini via Vertex AI (billed to linked GCP / Startup credits).
 */
export async function vertexGenerateContent(parts: Part[]): Promise<string> {
  const project = vertexProjectId();
  const location = vertexLocation();
  const model = vertexModel();
  const url =
    `https://${location}-aiplatform.googleapis.com/v1/projects/${project}` +
    `/locations/${location}/publishers/google/models/${model}:generateContent`;

  const token = await gcpAccessToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Vertex timeout (20s)');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vertex ${res.status}: ${body.slice(0, 400)}`);
  }

  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (!text) throw new Error('Vertex empty response');
  return text;
}

export async function vertexSolveMath(input: {
  examType: ExamType;
  systemPrompt: string;
  imageBase64: string;
  mimeType: string;
}): Promise<string> {
  return vertexGenerateContent([
    { text: input.systemPrompt },
    {
      inlineData: {
        mimeType: input.mimeType || 'image/jpeg',
        data: input.imageBase64,
      },
    },
  ]);
}
