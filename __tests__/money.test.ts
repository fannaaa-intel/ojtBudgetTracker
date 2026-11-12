import { formatPeso, splitEvenly, toCentavos } from '../src/lib/money';

describe('money', () => {
  it('formats centavos as pesos', () => {
    expect(formatPeso(123450)).toBe('₱1,234.50');
    expect(formatPeso(1125)).toBe('₱11.25');
    expect(formatPeso(-5)).toBe('-₱0.05');
    expect(formatPeso(150000, { hideZeroCents: true })).toBe('₱1,500');
  });
  it('parses user input to centavos', () => {
    expect(toCentavos('₱1,234.5')).toBe(123450);
    expect(toCentavos('80')).toBe(8000);
    expect(toCentavos('12.345')).toBeNull();
    expect(toCentavos('abc')).toBeNull();
  });
  it('splits evenly without losing centavos', () => {
    const shares = splitEvenly(1000, 3);
    expect(shares).toEqual([334, 333, 333]);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(1000);
  });
});
