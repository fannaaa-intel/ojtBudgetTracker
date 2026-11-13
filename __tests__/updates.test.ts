import { CHECK_EVERY_MS, inUpdateWindow, manilaHour, shouldAutoCheck } from '../src/lib/updates';

// Times written in UTC; Manila = UTC+8.
const manila = (hh: number, mm = 0) => new Date(Date.UTC(2026, 10, 13, hh - 8, mm));

describe('app update window (8 PM – 12 AM Manila)', () => {
  it('reads the Manila hour whatever the phone timezone', () => {
    expect(manilaHour(manila(20))).toBe(20);
    expect(manilaHour(manila(0))).toBe(0);
    expect(manilaHour(manila(7, 59))).toBe(7);
  });

  it('is open 20:00–23:59 only', () => {
    expect(inUpdateWindow(manila(19, 59))).toBe(false);
    expect(inUpdateWindow(manila(20))).toBe(true);
    expect(inUpdateWindow(manila(23, 59))).toBe(true);
    expect(inUpdateWindow(manila(24))).toBe(false); // midnight
    expect(inUpdateWindow(manila(9))).toBe(false); // OJT hours
  });

  it('checks at most every 30 minutes inside the window', () => {
    const t = manila(21);
    expect(shouldAutoCheck(t, null)).toBe(true);
    expect(shouldAutoCheck(t, t.getTime() - 5 * 60 * 1000)).toBe(false);
    expect(shouldAutoCheck(t, t.getTime() - CHECK_EVERY_MS)).toBe(true);
    expect(shouldAutoCheck(manila(10), null)).toBe(false);
  });
});
