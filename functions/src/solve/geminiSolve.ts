import { GoogleGenerativeAI } from '@google/generative-ai';

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

export function createGeminiSolver(apiKey = process.env.GEMINI_API_KEY): VisionSolver {
  if (!apiKey) {
    return {
      async solve() {
        throw new Error('GEMINI_API_KEY missing');
      },
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
