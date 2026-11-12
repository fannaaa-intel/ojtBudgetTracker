import { beepLow, compareRoutes, isBeepMode, splitByBeep, walletBalanceOf } from '../src/lib/wallet';

describe('wallet balance', () => {
  it('opening + in − out', () => {
    expect(walletBalanceOf({ opening: 100_00, incomeIn: 0, transfersIn: 200_00, expensesOut: 45_00, transfersOut: 0 })).toBe(255_00);
  });
});

describe('beep card', () => {
  it('Beep legs are trains and the Carousel', () => {
    expect(isBeepMode('mrt3')).toBe(true);
    expect(isBeepMode('bus_edsa_carousel')).toBe(true);
    expect(isBeepMode('jeep_traditional')).toBe(false);
  });
  it('splits a route into Beep and cash fares', () => {
    expect(splitByBeep([{ mode: 'jeep_traditional', payable: 1125 }, { mode: 'mrt3', payable: 1500 }])).toEqual({ beep: 1500, cash: 1125 });
  });
  it('low when it cannot cover two more round trips', () => {
    expect(beepLow(59_00, 30_00)).toBe(true);
    expect(beepLow(60_00, 30_00)).toBe(false);
    expect(beepLow(0, 0)).toBe(true);
  });
});

describe('compareRoutes', () => {
  const r = compareRoutes([
    { id: 1, name: 'Jeep + MRT', cost: 60_00, minutes: 70 },
    { id: 2, name: 'Bus', cost: 50_00, minutes: 95 },
    { id: 3, name: 'Grab', cost: 350_00, minutes: 40 },
    { id: 4, name: 'Walk + jeep', cost: 50_00, minutes: null },
  ]);
  it('sorts cheapest first and marks cheapest + fastest', () => {
    expect(r.map((x) => x.id)).toEqual([2, 4, 1, 3]);
    expect(r.find((x) => x.cheapest)?.id).toBe(2);
    expect(r.find((x) => x.fastest)?.id).toBe(3);
  });
  it('shows the difference vs cheapest and fastest', () => {
    const jeep = r.find((x) => x.id === 1)!;
    expect(jeep.extraCost).toBe(10_00);
    expect(jeep.extraMinutes).toBe(30);
    expect(r.find((x) => x.id === 4)!.extraMinutes).toBeNull();
  });
});
