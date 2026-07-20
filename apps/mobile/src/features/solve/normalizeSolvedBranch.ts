import type { ExamType, SolveQuestionSuccess, Subject } from '@/src/lib/api/types';

/**
 * Align subject/topic with solver content so Konu anlatımı / meta match the
 * real branch (e.g. şaft answer must not stay under Trafik Kuralları).
 */
export function normalizeSolvedBranch(
  result: SolveQuestionSuccess,
  examType: ExamType,
): SolveQuestionSuccess {
  if (examType !== 'trafik') return result;

  const blob = [
    result.answer?.text ?? '',
    result.answer?.label ?? '',
    ...result.steps.map((s) => `${s.title ?? ''} ${s.body ?? ''}`),
  ]
    .join('\n')
    .toLocaleLowerCase('tr-TR');

  let subject: Subject = result.subject;
  let topicId = result.topicId;

  if (/şaft|diferansiyel|güç aktarma|aktarma organ/.test(blob)) {
    subject = 'vehicle';
    topicId = 'trafik-vehicle-motor';
  } else if (/\babs\b|hava yastığı|emniyet kemeri/.test(blob)) {
    subject = 'vehicle';
    topicId = topicId?.startsWith('trafik-vehicle-')
      ? topicId
      : 'trafik-vehicle-guvenlik';
  } else if (/ilk yardım|hava yolu|kazazede|\babc\b/.test(blob)) {
    subject = 'firstaid';
    topicId = topicId?.startsWith('trafik-firstaid-')
      ? topicId
      : 'trafik-firstaid-abc';
  } else if (
    /kırmızı|sarı|ışıklı|şerit|kavşak|azami hız|hazırlanmalı/.test(blob)
  ) {
    subject = 'traffic';
    if (!topicId?.startsWith('trafik-traffic-')) {
      topicId = /hız|50 km/.test(blob)
        ? 'trafik-traffic-hiz-mesafe'
        : 'trafik-traffic-kurallar';
    }
  }

  if (subject === result.subject && topicId === result.topicId) return result;

  return {
    ...result,
    subject,
    topicId,
    classification: result.classification
      ? {
          ...result.classification,
          subject,
          needsConfirm: false,
          confidence: 'high',
        }
      : {
          subject,
          confidence: 'high',
          needsConfirm: false,
        },
  };
}
