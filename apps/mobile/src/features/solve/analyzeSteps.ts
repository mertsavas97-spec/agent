/** Client-visible solve pipeline stages (camera & gallery share this path). */
export type AnalyzeStepId = 'upload' | 'moderate' | 'solve';

export type AnalyzeStep = {
  id: AnalyzeStepId;
  label: string;
  /** 0–1 progress when this step is active / completed */
  progress: number;
};

export const ANALYZE_STEPS: AnalyzeStep[] = [
  { id: 'upload', label: 'Fotoğraf yolda', progress: 0.22 },
  { id: 'moderate', label: 'Güvenli mi bakıyorum', progress: 0.48 },
  { id: 'solve', label: 'Adım adım çözüyorum', progress: 0.86 },
];

export function progressForStep(stepId: AnalyzeStepId): number {
  return ANALYZE_STEPS.find((s) => s.id === stepId)?.progress ?? 0.1;
}

export function labelForStep(stepId: AnalyzeStepId): string {
  return ANALYZE_STEPS.find((s) => s.id === stepId)?.label ?? 'Sorun analiz ediliyor…';
}
