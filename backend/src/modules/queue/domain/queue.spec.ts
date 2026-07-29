import {
  canTransitionEntry,
  canTransitionSession,
  deriveQueueHealth,
  deriveWaitRange,
  isRecallAllowed,
} from './queue';

const policy = {
  recallGraceMinutes: 5,
  busyThresholdMinutes: 10,
  delayedThresholdMinutes: 25,
  fallbackConsultationMinutes: 20,
};

describe('queue domain rules', () => {
  it('enforces the exact session and entry transition graphs', () => {
    expect(canTransitionSession('notStarted', 'open')).toBe(true);
    expect(canTransitionSession('closed', 'open')).toBe(false);
    expect(canTransitionEntry('called', 'inConsultation')).toBe(true);
    expect(canTransitionEntry('waiting', 'completed')).toBe(false);
  });
  it('derives configured health bands and honest ranges', () => {
    expect(deriveQueueHealth(10, policy)).toBe('healthy');
    expect(deriveQueueHealth(11, policy)).toBe('busy');
    expect(deriveQueueHealth(26, policy)).toBe('delayed');
    expect(deriveWaitRange(2, 20, 10)).toEqual({
      minimumMinutes: 40,
      maximumMinutes: 60,
    });
  });
  it('enforces the inclusive no-response grace boundary', () => {
    const missed = new Date('2026-07-29T08:00:00Z');
    expect(isRecallAllowed(missed, new Date('2026-07-29T08:05:00Z'), 5)).toBe(
      true,
    );
    expect(
      isRecallAllowed(missed, new Date('2026-07-29T08:05:00.001Z'), 5),
    ).toBe(false);
  });
  it('never emits negative, NaN, or infinite wait ranges', () => {
    expect(deriveWaitRange(-1, Number.NaN, Number.NEGATIVE_INFINITY)).toEqual({
      minimumMinutes: 0,
      maximumMinutes: 0,
    });
    expect(
      deriveWaitRange(Number.POSITIVE_INFINITY, 5000, Number.POSITIVE_INFINITY),
    ).toEqual({ minimumMinutes: 0, maximumMinutes: 0 });
    expect(deriveWaitRange(10_000, 480, 480)).toEqual({
      minimumMinutes: 1440,
      maximumMinutes: 1440,
    });
    expect(deriveQueueHealth(Number.NaN, policy)).toBe('delayed');
  });
});
