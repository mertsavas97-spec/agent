import { SUBJECT_LABEL, topicsForExam } from '@/src/data';
import {
  lessonPartsForTopic,
  type LessonParts,
} from '@/src/data/topicLessonBank';
import type { Topic } from '@/src/data/topics';
import type { ExamType, Subject } from '@/src/lib/api/types';

export type TopicLesson = {
  topicId: string;
  headline: string;
  /** One-line what this topic is about */
  summary: string;
  /** 3–4 short teaching bullets — öğretmen sesi, telifsiz. */
  bullets: string[];
  /** Exam-specific trap / attention cue */
  examCue: string;
  /** Short self-check prompt */
  checkPrompt: string;
  tip: string;
};

type ExamBrand = {
  short: string;
  voice: string;
  audience: string;
};

function examBrand(exam: ExamType): ExamBrand {
  switch (exam) {
    case 'lgs':
      return {
        short: 'LGS',
        voice: 'ortaokul / 8. sınıf dilinde',
        audience: 'LGS adayı',
      };
    case 'ygs':
      return {
        short: 'YGS/YKS',
        voice: 'lise (TYT–AYT) seviyesinde',
        audience: 'YKS adayı',
      };
    case 'kpss':
      return {
        short: 'KPSS',
        voice: 'GY–GK aday dilinde',
        audience: 'KPSS adayı',
      };
    case 'trafik':
      return {
        short: 'Ehliyet',
        voice: 'ehliyet / MTS adayı dilinde',
        audience: 'ehliyet adayı',
      };
    default: {
      const _e: never = exam;
      return _e;
    }
  }
}

function subjectName(subject: Subject): string {
  if (subject === 'unknown') return 'Konu';
  return SUBJECT_LABEL[subject] ?? subject;
}

function assembleLesson(topic: Topic, parts: LessonParts): TopicLesson {
  const brand = examBrand(topic.examType);
  const sub = subjectName(topic.subject);
  return {
    topicId: topic.id,
    headline: `${brand.short} · ${sub} · ${topic.nameTr}`,
    summary: parts.summary,
    bullets: parts.bullets.slice(0, 4),
    examCue: parts.examCue,
    checkPrompt: parts.checkPrompt,
    tip: parts.tip,
  };
}

/** Catalog lesson — always branded with exam + branch + topic; bank-enriched. */
export function buildCatalogLesson(topic: Topic): TopicLesson {
  return assembleLesson(topic, lessonPartsForTopic(topic));
}

function buildLessonIndex(): Map<string, TopicLesson> {
  const map = new Map<string, TopicLesson>();
  const exams: ExamType[] = ['lgs', 'ygs', 'kpss', 'trafik'];
  for (const exam of exams) {
    for (const topic of topicsForExam(exam)) {
      map.set(topic.id, buildCatalogLesson(topic));
    }
  }
  return map;
}

const BY_ID = buildLessonIndex();

/** Subject-aware teacher primer when topic-specific copy is missing. */
export function buildFallbackLesson(input: {
  topicId: string;
  nameTr: string;
  subject: Subject;
  examType: ExamType;
}): TopicLesson {
  return buildCatalogLesson({
    id: input.topicId,
    examType: input.examType,
    subject: input.subject,
    nameTr: input.nameTr,
  });
}

export function lessonForTopic(
  topicId: string | null | undefined,
  fallback?: {
    nameTr: string;
    subject: Subject;
    examType: ExamType;
  },
): TopicLesson | null {
  if (!topicId) return null;
  const known = BY_ID.get(topicId);
  if (known) return known;
  if (fallback) {
    return buildFallbackLesson({ topicId, ...fallback });
  }
  return null;
}

export function allTopicLessons(): TopicLesson[] {
  return [...BY_ID.values()];
}

/** CTA label on solution screen → full topic lesson. */
export function fullLessonCtaLabel(input: {
  examType?: ExamType | null;
  topicName?: string | null;
}): string {
  const exam =
    input.examType === 'lgs'
      ? 'LGS'
      : input.examType === 'ygs'
        ? 'YGS'
        : input.examType === 'kpss'
          ? 'KPSS'
          : input.examType === 'trafik'
            ? 'Ehliyet'
            : null;
  if (exam && input.topicName) {
    return `${exam} · ${input.topicName} — tam anlatıma git →`;
  }
  if (input.topicName) {
    return `${input.topicName} — tam anlatıma git →`;
  }
  return 'Tam konu anlatımına git →';
}

/** Bullets safe for the compact solution tab (first 3). */
export function solutionLessonBullets(lesson: TopicLesson): string[] {
  return lesson.bullets.slice(0, 3);
}
