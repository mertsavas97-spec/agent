/** Mirror of specs/002-cozbil-mvp/contracts — keep in sync with mobile src/lib/api/types.ts */

export type ExamType = 'lgs' | 'ygs' | 'kpss';
export type Subject = 'math' | 'turkish' | 'unknown';

export type AttemptStatus =
  | 'pending_moderation'
  | 'rejected_moderation'
  | 'rejected_not_question'
  | 'unsupported_type'
  | 'solving'
  | 'solved'
  | 'failed';

export type SolutionStep = {
  title?: string;
  body: string;
};

export type QuotaInfo = {
  remainingToday: number;
  unlimited: boolean;
};

export type SolveQuestionRequest = {
  imagePath: string;
  subjectHint?: Exclude<Subject, 'unknown'>;
  examType?: ExamType;
};

export type SolveQuestionSuccess = {
  attemptId: string;
  solutionId: string;
  status: 'solved';
  cached: boolean;
  topicId: string | null;
  subject: Subject;
  steps: SolutionStep[];
  transparencyNote: string;
  quota: QuotaInfo;
};

export type SolveQuestionRejected = {
  attemptId: string;
  status: 'rejected_moderation' | 'rejected_not_question' | 'unsupported_type';
  userMessage: string;
  quota: QuotaInfo;
};

export type SolveQuestionResponse = SolveQuestionSuccess | SolveQuestionRejected;

export type ExplainAgainRequest = { solutionId: string };
export type ExplainAgainResponse = { followUpId: string; explanation: string };

export type ProgressTopic = {
  topicId: string;
  nameTr: string;
  attemptCount: number;
  followUpCount: number;
};

export type ProgressSummary = {
  streakCount: number;
  weakestTopic: ProgressTopic | null;
  topics: ProgressTopic[];
  weekly: { date: string; solvedCount: number }[];
};

export type ListAttemptsRequest = {
  subject?: Subject;
  topicId?: string;
  limit?: number;
  cursor?: string | null;
};

export type AttemptListItem = {
  attemptId: string;
  createdAt: string;
  subject: Subject;
  topicId: string | null;
  status: AttemptStatus;
  thumbnailUrl: string | null;
};

export type ListAttemptsResponse = {
  items: AttemptListItem[];
  nextCursor: string | null;
};

export type UserDoc = {
  displayName?: string;
  examType: ExamType;
  ageBand?: 'under13' | '13to17' | '18plus';
  parentalConsentAt?: unknown | null;
  consentAcceptedAt?: unknown | null;
  onboardingCompletedAt?: unknown | null;
  streakCount: number;
  streakLastActiveDate: string | null;
  dailySolveCount: number;
  dailySolveDate: string | null;
  subscriptionStatus: 'free' | 'active' | 'grace' | 'expired';
  invalidImageScore: number;
  restrictedUntil?: unknown | null;
  /** Soft delete / KVKK erasure request flag (MVP) */
  deleteRequestedAt?: unknown | null;
  createdAt: unknown;
  updatedAt: unknown;
};
