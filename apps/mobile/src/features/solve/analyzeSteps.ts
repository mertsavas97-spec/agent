/** Client-visible solve pipeline stages (camera & gallery share this path). */
export type AnalyzeStepId = 'upload' | 'moderate' | 'solve';

export type AnalyzeStep = {
  id: AnalyzeStepId;
  label: string;
  /** 0–1 progress when this step is active / completed */
  progress: number;
};

export const ANALYZE_STEPS: AnalyzeStep[] = [
  { id: 'upload', label: 'Görsel yükleniyor', progress: 0.25 },
  { id: 'moderate', label: 'Güvenlik kontrolü', progress: 0.55 },
  { id: 'solve', label: 'Adım adım çözülüyor', progress: 0.9 },
];

export function progressForStep(stepId: AnalyzeStepId): number {
  return ANALYZE_STEPS.find((s) => s.id === stepId)?.progress ?? 0.1;
}

export function labelForStep(stepId: AnalyzeStepId): string {
  return ANALYZE_STEPS.find((s) => s.id === stepId)?.label ?? 'Sorun analiz ediliyor...';
}
