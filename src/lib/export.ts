/**
 * CSV and printable-report builders. Pure: no React, no DB. Money stays integer centavos until
 * the very last step, where it becomes text ("1234.50" in CSV, "₱1,234.50" in the PDF).
 * The PDF is plain black-and-white HTML with system fonts only (offline, no remote assets).
 */
import { formatDateLabel, type ISODate } from './dates';
import { formatPeso } from './money';

/** 123450 → "1234.50", -500 → "-5.00" (spreadsheet-friendly, no symbol or commas). */
export function centavosPlain(c: number): string {
  const sign = c < 0 ? '-' : '';
  const a = Math.abs(Math.round(c));
  return `${sign}${Math.floor(a / 100)}.${String(a % 100).padStart(2, '0')}`;
}

export function csvCell(v: string | number | boolean | null | undefined): string {
  const s = v == null ? '' : String(v);
  return /[",\r\n]/.test(s) || /^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: readonly (readonly (string | number | boolean | null | undefined)[])[]): string {
  // BOM so Excel opens UTF-8 (₱, ñ) correctly; CRLF line endings per RFC 4180.
  return '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

export type CsvTx = { date: ISODate; kind: string; category: string; amount: number; wallet: string | null; tags: string | null; note: string | null; oneTime: boolean };

export function transactionsCsv(rows: readonly CsvTx[]): string {
  return toCsv([
    ['Date', 'Type', 'Category', 'Amount (PHP)', 'Wallet', 'Tags', 'One-time', 'Note'],
    ...rows.map((t) => [t.date, t.kind, t.category, centavosPlain(t.amount), t.wallet, t.tags, t.oneTime ? 'yes' : '', t.note]),
  ]);
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export type OjtReportData = {
  name: string;
  school: string | null;
  agency: string;
  region: string;
  startDate: ISODate;
  today: ISODate;
  hoursDone: number;
  requiredHours: number | null;
  endDate: ISODate | null;
  daysWorked: number;
  totalSpent: number;
  oneTime: number;
  costPerDay: number | null;
  costPerHour: number | null;
  projectedTotal: number | null;
  byCategory: { name: string; amount: number; pct: number }[];
  byMonth: { label: string; amount: number }[];
};

const hours = (h: number) => (Number.isInteger(h) ? String(h) : h.toFixed(1));

/** A one-page "Total OJT cost" report, black on white, printable to PDF. */
export function ojtReportHtml(d: OjtReportData): string {
  const e = escapeHtml;
  const money = (c: number | null) => (c == null ? '—' : e(formatPeso(c)));
  const row = (label: string, value: string, strong = false) =>
    `<tr><td>${e(label)}</td><td class="num${strong ? ' strong' : ''}">${value}</td></tr>`;
  const bar = (pct: number) => `<div class="bar"><div style="width:${Math.max(0, Math.min(100, pct))}%"></div></div>`;

  return `<!doctype html><html><head><meta charset="utf-8"><title>Total OJT cost</title><style>
  *{box-sizing:border-box}body{font-family:-apple-system,Roboto,"Helvetica Neue",Arial,sans-serif;color:#0A0A0A;margin:32px;font-size:12px}
  h1{font-size:22px;margin:0 0 4px}h2{font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#5E5E5E;margin:24px 0 8px}
  .muted{color:#5E5E5E}.big{font-size:30px;font-weight:700;margin:8px 0}
  table{width:100%;border-collapse:collapse}td{padding:6px 0;border-bottom:1px solid #E3E3E3;vertical-align:middle}
  td.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}.strong{font-weight:700}
  .bar{height:6px;background:#EDEDED;border-radius:3px;overflow:hidden;width:140px;display:inline-block}.bar div{height:6px;background:#0A0A0A}
  .foot{margin-top:28px;font-size:10px;color:#9A9A9A}
  </style></head><body>
  <h1>Total OJT cost</h1>
  <div class="muted">${e(d.name)}${d.school ? ` · ${e(d.school)}` : ''} · ${e(d.agency)} (${e(d.region)})</div>
  <div class="muted">${e(formatDateLabel(d.startDate))} – ${e(formatDateLabel(d.today))}</div>
  <div class="big">${money(d.totalSpent)}</div>
  <div class="muted">spent since the OJT started${d.oneTime > 0 ? `, including ${money(d.oneTime)} one-time requirements` : ''}</div>

  <h2>OJT</h2><table>
  ${row('Hours done', `${hours(d.hoursDone)} h${d.requiredHours ? ` of ${d.requiredHours} h` : ''}`)}
  ${row('Days worked', String(d.daysWorked))}
  ${row('Projected end date', d.endDate ? e(formatDateLabel(d.endDate)) : '—')}
  ${row('Cost per OJT day', money(d.costPerDay))}
  ${row('Cost per OJT hour', money(d.costPerHour))}
  ${row('Projected total to finish', money(d.projectedTotal), true)}
  </table>

  <h2>By category</h2><table>
  ${d.byCategory.map((c) => `<tr><td>${e(c.name)}</td><td>${bar(c.pct)} <span class="muted">${c.pct}%</span></td><td class="num">${money(c.amount)}</td></tr>`).join('') || '<tr><td class="muted">No spending yet</td></tr>'}
  </table>

  <h2>By month</h2><table>
  ${d.byMonth.map((m) => row(m.label, money(m.amount))).join('') || '<tr><td class="muted">No spending yet</td></tr>'}
  </table>

  <div class="foot">Made with OJT Budget on ${e(formatDateLabel(d.today))}. Averages leave out one-time items. Amounts are what was actually paid.</div>
  </body></html>`;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** '2026-11' → 'November 2026' */
export function monthLabel(period: string): string {
  const [y, m] = period.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}
