import { centavosPlain, csvCell, escapeHtml, monthLabel, ojtReportHtml, toCsv, transactionsCsv } from '../src/lib/export';

describe('CSV', () => {
  it('money as plain decimals', () => {
    expect(centavosPlain(123450)).toBe('1234.50');
    expect(centavosPlain(5)).toBe('0.05');
    expect(centavosPlain(-500)).toBe('-5.00');
  });
  it('escapes commas, quotes and new lines', () => {
    expect(csvCell('Jollibee, SM')).toBe('"Jollibee, SM"');
    expect(csvCell('6" sub')).toBe('"6"" sub"');
    expect(csvCell('a\nb')).toBe('"a\nb"');
    expect(csvCell(null)).toBe('');
    expect(csvCell('plain')).toBe('plain');
  });
  it('builds rows with a BOM and CRLF', () => {
    expect(toCsv([['a', 1], ['b', 2]])).toBe('﻿a,1\r\nb,2\r\n');
  });
  it('transactions CSV has a header and one line per row', () => {
    const csv = transactionsCsv([{ date: '2026-11-12', kind: 'expense', category: 'Pagkain · Meals', amount: 8000, wallet: 'Cash', tags: 'baon', note: 'Lunch, rice', oneTime: false }]);
    const lines = csv.replace('﻿', '').trim().split('\r\n');
    expect(lines[0]).toBe('Date,Type,Category,Amount (PHP),Wallet,Tags,One-time,Note');
    expect(lines[1]).toBe('2026-11-12,expense,Pagkain · Meals,80.00,Cash,baon,,"Lunch, rice"');
  });
});

describe('PDF report HTML', () => {
  const base = {
    name: 'Juan <Dela Cruz>',
    school: 'PUP',
    agency: 'NFRDI',
    region: 'Metro Manila',
    startDate: '2026-11-09',
    today: '2026-11-12',
    hoursDone: 15,
    requiredHours: 300,
    endDate: '2027-02-09',
    daysWorked: 3,
    totalSpent: 1250_00,
    oneTime: 500_00,
    costPerDay: 250_00,
    costPerHour: 50_00,
    projectedTotal: 15000_00,
    byCategory: [{ name: 'Pagkain', amount: 750_00, pct: 60 }],
    byMonth: [{ label: 'November 2026', amount: 1250_00 }],
  };
  it('contains the key numbers and escapes text', () => {
    const html = ojtReportHtml(base);
    expect(html).toContain('₱1,250.00');
    expect(html).toContain('₱15,000.00');
    expect(html).toContain('15 h of 300 h');
    expect(html).toContain('Juan &lt;Dela Cruz&gt;');
    expect(html).not.toContain('<Dela');
  });
  it('is offline: no remote URLs', () => {
    expect(ojtReportHtml(base)).not.toMatch(/https?:\/\//);
  });
  it('helpers', () => {
    expect(escapeHtml(`"a"&'b'`)).toBe('&quot;a&quot;&amp;&#39;b&#39;');
    expect(monthLabel('2026-11')).toBe('November 2026');
  });
});
