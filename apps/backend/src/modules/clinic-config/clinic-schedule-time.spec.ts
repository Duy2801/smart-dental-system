import { overlapsLunchBreak } from './clinic-schedule-time';

describe('overlapsLunchBreak', () => {
  const lunchBreak = {
    isEnabled: true,
    start: '12:00',
    end: '13:30',
  };

  it('allows appointments ending when lunch starts', () => {
    expect(overlapsLunchBreak(11 * 60, 12 * 60, lunchBreak)).toBe(false);
  });

  it('allows appointments starting when lunch ends', () => {
    expect(overlapsLunchBreak(13 * 60 + 30, 14 * 60, lunchBreak)).toBe(false);
  });

  it('blocks appointments crossing into lunch', () => {
    expect(overlapsLunchBreak(11 * 60 + 45, 12 * 60 + 15, lunchBreak)).toBe(
      true,
    );
  });

  it('does not block times when lunch is disabled', () => {
    expect(
      overlapsLunchBreak(12 * 60, 12 * 60 + 30, {
        ...lunchBreak,
        isEnabled: false,
      }),
    ).toBe(false);
  });
});
