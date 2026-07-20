import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  AttemptListItem,
  ExamType,
  SolutionAnswer,
  SolutionStep,
  Subject,
} from '@/src/lib/api/types';

const STORAGE_KEY = 'cozbil.localHistory.v1';
const MAX_ITEMS = 80;

export type LocalHistoryEntry = AttemptListItem & {
  examType: ExamType;
  solutionId: string;
  imageUri?: string | null;
  steps: SolutionStep[];
  answer?: SolutionAnswer | null;
  transparencyNote?: string;
};

async function readAll(): Promise<LocalHistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(items: LocalHistoryEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
}

export async function listLocalHistory(limit = 50): Promise<LocalHistoryEntry[]> {
  const all = await readAll();
  return all.slice(0, limit);
}

export async function getLocalHistoryEntry(
  attemptId: string,
): Promise<LocalHistoryEntry | null> {
  const all = await readAll();
  return all.find((i) => i.attemptId === attemptId) ?? null;
}

export type RecordLocalAttemptInput = {
  attemptId: string;
  solutionId: string;
  examType: ExamType;
  subject: Subject;
  topicId: string | null;
  imageUri?: string | null;
  steps: SolutionStep[];
  answer?: SolutionAnswer | null;
  transparencyNote?: string;
  status?: AttemptListItem['status'];
};

/** Persist a dogfood/proxy/local solve so Geçmiş is not empty when Cloud Functions are blocked. */
export async function recordLocalAttempt(
  input: RecordLocalAttemptInput,
): Promise<LocalHistoryEntry> {
  const entry: LocalHistoryEntry = {
    attemptId: input.attemptId,
    solutionId: input.solutionId,
    createdAt: new Date().toISOString(),
    subject: input.subject,
    topicId: input.topicId,
    status: input.status ?? 'solved',
    thumbnailUrl: null,
    examType: input.examType,
    imageUri: input.imageUri ?? null,
    steps: input.steps,
    answer: input.answer ?? null,
    transparencyNote: input.transparencyNote,
  };
  const prev = await readAll();
  const next = [entry, ...prev.filter((i) => i.attemptId !== entry.attemptId)];
  await writeAll(next);
  return entry;
}

export function toAttemptListItem(entry: LocalHistoryEntry): AttemptListItem {
  return {
    attemptId: entry.attemptId,
    createdAt: entry.createdAt,
    subject: entry.subject,
    topicId: entry.topicId,
    status: entry.status,
    thumbnailUrl: entry.thumbnailUrl,
    examType: entry.examType,
    solutionId: entry.solutionId,
  };
}
