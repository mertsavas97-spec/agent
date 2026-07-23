import type { ExamType, Subject } from '@/src/lib/api/types';

export type ItemBankChoiceKey = 'A' | 'B' | 'C' | 'D' | 'E';

export type ItemBankItem = {
  id: string;
  examType: ExamType;
  subject: Subject;
  topicId: string;
  difficulty: 'easy' | 'mid' | 'hard';
  format: 'multiple_choice';
  stem: string;
  choices: Record<ItemBankChoiceKey, string>;
  answerKey: ItemBankChoiceKey;
  explanationSteps: { title: string; body: string }[];
  transparencyNote: string;
};
