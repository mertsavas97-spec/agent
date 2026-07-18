import { GoogleGenerativeAI } from '@google/generative-ai';

import { useVertexAi, vertexSolveMath } from '../ai/vertexClient';
import type { ExamType } from '../types/contracts';
import { parseModelSolution, type ParsedModelSolution } from './parseSolution';
import { mathSystemPrompt } from './prompts';

export type VisionSolver = {
  solve(input: {
    imageBase64: string;
    mimeType: string;
    examType: ExamType;
  }): Promise<ParsedModelSolution>;
};

/**
 * Live: Vertex AI (Startup/GCP billing) preferred; else AI Studio API key;
 * otherwise demo stub.
 */
export function createGeminiSolver(apiKey = process.env.GEMINI_API_KEY): VisionSolver {
  const forceDemo = process.env.COZBIL_DEMO_AI === '1';
  if (forceDemo) return createStubSolver();

  if (useVertexAi()) {
    return {
      async solve({ imageBase64, mimeType, examType }) {
        const text = await vertexSolveMath({
          examType,
          systemPrompt: mathSystemPrompt(examType),
          imageBase64,
          mimeType: mimeType || 'image/jpeg',
        });
        return parseModelSolution(text);
      },
    };
  }

  if (!apiKey?.trim()) return createStubSolver();

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  return {
    async solve({ imageBase64, mimeType, examType }) {
      const result = await model.generateContent([
        { text: mathSystemPrompt(examType) },
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType || 'image/jpeg',
          },
        },
      ]);
      const text = result.response.text();
      return parseModelSolution(text);
    },
  };
}

/** Deterministic stub for tests / offline dogfood. */
export function createStubSolver(
  fixture: ParsedModelSolution = {
    isQuestion: true,
    unsupported: false,
    unsupportedReason: null,
    subject: 'math',
    topicId: 'lgs-math-kesirler',
    steps: [
      { title: '1. Adım', body: 'Paydaları eşitle.' },
      { title: '2. Adım', body: 'Payları topla ve sadeleştir.' },
    ],
  },
): VisionSolver {
  return {
    async solve() {
      return fixture;
    },
  };
}
