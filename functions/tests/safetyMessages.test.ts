import { LOGGING_POLICY, SAFETY_MESSAGES } from '../src/safety/messages';

describe('safety messages', () => {
  it('uses neutral moderation language', () => {
    expect(SAFETY_MESSAGES.moderationReject.toLowerCase()).not.toMatch(
      /yasak|suç|kötü|utanç/,
    );
    expect(SAFETY_MESSAGES.moderationReject).toContain('soru');
  });

  it('forbids logging image bytes', () => {
    expect(LOGGING_POLICY.allowImageBytesInLogs).toBe(false);
  });
});
