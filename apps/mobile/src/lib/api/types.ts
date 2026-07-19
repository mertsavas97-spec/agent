/** Shared client DTOs — mirror `specs/002-cozbil-mvp/contracts/` */

export type ExamType = 'lgs' | 'ygs' | 'kpss';
/** Exam branch / ders — see docs/architecture/EXAM_SUBJECT_TREE_2020_2026.md */
export type Subject =
  | 'math'
  | 'turkish'
  | 'science'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'history'
  | 'geography'
  | 'philosophy'
  | 'literature'
  | 'religion'
  | 'english'
  | 'geometry'
  | 'civics'
  | 'current'
  | 'unknown';

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

/** Highlighted final answer for result UI (choice letter optional). */
export type SolutionAnswer = {
  label?: string;
  text: string;
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

export type SubjectClassificationMeta = {
  subject: Subject;
  confidence: 'high' | 'medium' | 'low';
  needsConfirm: boolean;
  topicKey?: string;
  score?: number;
  alternatives?: { subject: string; score: number }[];
};

export type ExamHintMeta = {
  suggested: ExamType | null;
  confidence: 'high' | 'medium' | 'low';
  reason?: string | null;
  questionNumber?: number | null;
  mismatchesProfile: boolean;
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
  /** Preferred display answer — result screen hero */
  answer?: SolutionAnswer;
  /** Dogfood / proxy: when needsConfirm, UI asks user before showing result */
  classification?: SubjectClassificationMeta;
  /** Profile exam vs OCR booklet mismatch */
  examHint?: ExamHintMeta;
};

export type SolveQuestionRejected = {
  attemptId: string;
  status: 'rejected_moderation' | 'rejected_not_question' | 'unsupported_type';
  userMessage: string;
  quota: QuotaInfo;
};

export type SolveQuestionResponse = SolveQuestionSuccess | SolveQuestionRejected;

export type ExplainAgainRequest = {
  solutionId: string;
};

export type ExplainAgainResponse = {
  followUpId: string;
  explanation: string;
};

export type ProgressTopic = {
  topicId: string;
  nameTr: string;
  attemptCount: number;
  followUpCount: number;
};

export type ProgressSubjectMix = {
  subject: Subject;
  label: string;
  count: number;
  pct: number;
};

export type ProgressSummary = {
  streakCount: number;
  weakestTopic: (ProgressTopic & { followUpCount: number }) | null;
  topics: ProgressTopic[];
  weekly: { date: string; solvedCount: number }[];
  /** Active exam scope when known */
  examType?: ExamType;
  totalSolved?: number;
  subjectMix?: ProgressSubjectMix[];
  /** Why the focus card picked this topic */
  focusHint?: string | null;
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
  /** Present on dogfood local history + server when persisted */
  examType?: ExamType;
  solutionId?: string | null;
};

export type ListAttemptsResponse = {
  items: AttemptListItem[];
  nextCursor: string | null;
};

export type UserProfile = {
  displayName?: string;
  examType: ExamType;
  ageBand?: 'under13' | '13to17' | '18plus';
  parentalConsentAt?: string | null;
  consentAcceptedAt?: string | null;
  deleteRequestedAt?: string | null;
  onboardingCompletedAt?: string | null;
  streakCount: number;
  dailySolveCount: number;
  subscriptionStatus: 'free' | 'active' | 'grace' | 'expired';
};
