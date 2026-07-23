import { GoogleGenerativeAI } from '@google/generative-ai';

import { useVertexAi, vertexSolveMath } from '../ai/vertexClient';
import type { ExamType, Subject } from '../types/contracts';
import { parseModelSolution, type ParsedModelSolution } from './parseSolution';
import { systemPromptForSolve } from './prompts';

export type VisionSolver = {
  /** stub | live — stub çıktıları production cache'e yazılmaz */
  source: 'stub' | 'live';
  solve(input: {
    imageBase64: string;
    mimeType: string;
    examType: ExamType;
    subjectHint?: Subject | null;
  }): Promise<ParsedModelSolution>;
};

async function solveWithRetry(
  generate: (prompt: string) => Promise<string>,
  examType: ExamType,
  subjectHint?: Subject | null,
): Promise<ParsedModelSolution> {
  const base = systemPromptForSolve(examType, subjectHint);
  try {
    return parseModelSolution(await generate(base));
  } catch {
    const retryPrompt = [
      base,
      'ÖNCEKİ YANIT GEÇERSİZ JSON İÇERİYORDU.',
      'Şimdi YALNIZCA tek bir geçerli JSON nesnesi döndür; açıklama veya markdown ekleme.',
    ].join('\n');
    return parseModelSolution(await generate(retryPrompt));
  }
}

/**
 * Live: Vertex AI preferred; else AI Studio API key; otherwise demo stub.
 */
export function createGeminiSolver(apiKey = process.env.GEMINI_API_KEY): VisionSolver {
  const forceDemo = process.env.COZBIL_DEMO_AI === '1';
  if (forceDemo) return createStubSolver();

  if (useVertexAi()) {
    return {
      source: 'live',
      async solve({ imageBase64, mimeType, examType, subjectHint }) {
        return solveWithRetry(
          (systemPrompt) =>
            vertexSolveMath({
              examType,
              systemPrompt,
              imageBase64,
              mimeType: mimeType || 'image/jpeg',
            }),
          examType,
          subjectHint,
        );
      },
    };
  }

  if (!apiKey?.trim()) return createStubSolver();

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  return {
    source: 'live',
    async solve({ imageBase64, mimeType, examType, subjectHint }) {
      return solveWithRetry(
        async (systemPrompt) => {
          const result = await model.generateContent([
            { text: systemPrompt },
            {
              inlineData: {
                data: imageBase64,
                mimeType: mimeType || 'image/jpeg',
              },
            },
          ]);
          return result.response.text();
        },
        examType,
        subjectHint,
      );
    },
  };
}

/** Deterministic stub for tests / offline dogfood — exam-aware (never LGS math under Ehliyet). */
export function createStubSolver(
  fixture: ParsedModelSolution = {
    isQuestion: true,
    unsupported: false,
    unsupportedReason: null,
    subject: 'math',
    topicId: 'lgs-math-kesirler',
    steps: [
      {
        title: '1. Ne istendi?',
        body: 'Kesir işleminde önce verilenleri ve istenen parçayı ayır.',
      },
      {
        title: '2. Payda eşitle / işlem yap',
        body: 'Toplama-çıkarmada paydaları eşitle; çarpma-bölmede kuralları uygula.',
      },
      {
        title: 'Cevap',
        body: 'Sonuç: örnek demo (canlı AI bağlanınca görsele göre üretilir).',
      },
    ],
    answer: { text: 'örnek demo' },
  },
): VisionSolver {
  return {
    source: 'stub',
    async solve({ examType, subjectHint }) {
      if (examType === 'trafik') {
        const branch =
          subjectHint === 'vehicle' || subjectHint === 'firstaid' || subjectHint === 'traffic'
            ? subjectHint
            : 'traffic';
        const topicId =
          branch === 'vehicle'
            ? 'trafik-vehicle-motor'
            : branch === 'firstaid'
              ? 'trafik-firstaid-temel'
              : 'trafik-traffic-kurallar';
        return {
          isQuestion: true,
          unsupported: true,
          unsupportedReason: 'Demo stub — Ehliyet için canlı AI / Vision proxy gerekir',
          subject: branch,
          topicId,
          steps: [],
        };
      }
      if (examType === 'ygs' || examType === 'kpss') {
        // Do not ship LGS math steps under other packages
        return {
          isQuestion: true,
          unsupported: true,
          unsupportedReason: 'Demo stub — bu sınav paketi için canlı AI gerekir',
          subject: subjectHint && subjectHint !== 'unknown' ? subjectHint : 'turkish',
          topicId: null,
          steps: [],
        };
      }
      // LGS: honor subjectHint when non-math
      if (
        subjectHint &&
        subjectHint !== 'unknown' &&
        subjectHint !== 'math' &&
        subjectHint !== 'geometry'
      ) {
        return {
          isQuestion: true,
          unsupported: true,
          unsupportedReason: 'Demo stub — bu ders için canlı AI gerekir',
          subject: subjectHint,
          topicId: null,
          steps: [],
        };
      }
      return fixture;
    },
  };
}
