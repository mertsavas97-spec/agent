import { LOGGING_POLICY, SAFETY_MESSAGES } from '@/src/lib/safetyMessages';
import { buildUploadPath } from '@/src/features/solve/paths';

describe('safety + upload path', () => {
  it('keeps moderation copy neutral', () => {
    expect(SAFETY_MESSAGES.transparency).toContain('AI');
    expect(LOGGING_POLICY.allowImageBytesInLogs).toBe(false);
  });

  it('builds user-scoped upload path', () => {
    expect(buildUploadPath('uid123', 'abc')).toBe('users/uid123/uploads/abc.jpg');
  });
});
