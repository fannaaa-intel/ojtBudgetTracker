// Writes a QR code as a plain PBM (1 = black). Scale it up with ImageMagick.
// Usage: node marketing/video/make-qr.js "<link>" <out.pbm>
// Uses `toqr`, already in node_modules (no download).
const { toQR } = require('toqr');
const fs = require('fs');

const [link, out] = process.argv.slice(2);
if (!link || !out) {
  console.error('usage: node make-qr.js "<link>" <out.pbm>');
  process.exit(1);
}
const modules = toQR(link, 0 /* EC level M */);
const size = Math.round(Math.sqrt(modules.length));
if (size * size !== modules.length) throw new Error('unexpected QR matrix length ' + modules.length);
const quiet = 4;
const n = size + quiet * 2;
const rows = [];
for (let y = 0; y < n; y++) {
  const row = [];
  for (let x = 0; x < n; x++) {
    const mx = x - quiet;
    const my = y - quiet;
    const on = mx >= 0 && my >= 0 && mx < size && my < size && modules[my * size + mx] ? 1 : 0;
    row.push(on);
  }
  rows.push(row.join(' '));
}
fs.writeFileSync(out, `P1\n${n} ${n}\n${rows.join('\n')}\n`);
console.log(`QR ${size}x${size} modules (+${quiet} quiet zone) -> ${out}`);
