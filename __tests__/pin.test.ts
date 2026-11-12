import { hashInput, lockoutLeft, parsePinHash, serializePinHash, shouldRelock, toHex, validatePin } from '../src/lib/pin';

describe('PIN rules', () => {
  it('4 to 6 digits only', () => {
    expect(validatePin('1234')).toBeNull();
    expect(validatePin('123456')).toBeNull();
    expect(validatePin('123')).not.toBeNull();
    expect(validatePin('1234567')).not.toBeNull();
    expect(validatePin('12a4')).not.toBeNull();
  });
  it('stored hash round-trips and rejects junk', () => {
    const s = serializePinHash(4, 'ab12', 'ff00');
    expect(s).toBe('v1$4$ab12$ff00');
    expect(parsePinHash(s)).toEqual({ length: 4, salt: 'ab12', hash: 'ff00' });
    expect(parsePinHash('1234')).toBeNull();
    expect(parsePinHash(null)).toBeNull();
    expect(parsePinHash('v1$9$a$b')).toBeNull();
  });
  it('salt goes into the hash input', () => {
    expect(hashInput('ab12', '1234')).toBe('ab12:1234');
    expect(toHex(new Uint8Array([0, 15, 255]))).toBe('000fff');
  });
});

describe('lockout and relock', () => {
  it('5 wrong tries → wait 30 s', () => {
    expect(lockoutLeft(4, 1000, 2000)).toBe(0);
    expect(lockoutLeft(5, 1000, 2000)).toBe(29_000);
    expect(lockoutLeft(5, 1000, 31_000)).toBe(0);
  });
  it('relock after a minute in the background', () => {
    expect(shouldRelock(null, 100_000)).toBe(false);
    expect(shouldRelock(0, 59_999)).toBe(false);
    expect(shouldRelock(0, 60_000)).toBe(true);
  });
});
