import type { ExamType, SolveQuestionRequest } from '@/src/lib/api/types';

describe('api types smoke', () => {
  it('allows solve request shape', () => {
    const req: SolveQuestionRequest = {
      imagePath: 'users/u/uploads/1.jpg',
      subjectHint: 'math',
      examType: 'ygs' satisfies ExamType,
    };
    expect(req.examType).toBe('ygs');
  });
});
