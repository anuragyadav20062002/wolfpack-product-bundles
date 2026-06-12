import { CSS_SIZE_LIMIT_BYTES } from './targets.js';

export function fmtBytes(bytes) {
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function printSummary(results) {
  const widths = { file: 58, before: 10, after: 10, saved: 10, pct: 8 };
  const hr = '-'.repeat(widths.file + widths.before + widths.after + widths.saved + widths.pct + 8);
  let totalBefore = 0;
  let totalAfter = 0;

  console.log('');
  console.log(hr);
  console.log(
    `  ${'File'.padEnd(widths.file)}  ${'Before'.padStart(widths.before)}  ${'After'.padStart(widths.after)}  ${'Saved'.padStart(widths.saved)}  ${'Reduction'.padStart(widths.pct)}`,
  );
  console.log(hr);

  for (const result of results) {
    if (result.skipped) {
      console.log(`  ${'[SKIPPED]'.padEnd(widths.file)}  ${result.file}`);
      continue;
    }

    const saved = result.beforeBytes - result.afterBytes;
    const pct = result.beforeBytes > 0 ? ((saved / result.beforeBytes) * 100).toFixed(1) : '0.0';
    const overLimit = result.file.endsWith('.css') && result.afterBytes > CSS_SIZE_LIMIT_BYTES ? ' !!!' : '';
    console.log(
      `  ${result.file.padEnd(widths.file)}  ${fmtBytes(result.beforeBytes).padStart(widths.before)}  ${(fmtBytes(result.afterBytes) + overLimit).padStart(widths.after)}  ${fmtBytes(saved).padStart(widths.saved)}  ${(pct + '%').padStart(widths.pct)}`,
    );

    totalBefore += result.beforeBytes;
    totalAfter += result.afterBytes;
  }

  const totalSaved = totalBefore - totalAfter;
  const totalPct = totalBefore > 0 ? ((totalSaved / totalBefore) * 100).toFixed(1) : '0.0';
  console.log(hr);
  console.log(
    `  ${'TOTAL'.padEnd(widths.file)}  ${fmtBytes(totalBefore).padStart(widths.before)}  ${fmtBytes(totalAfter).padStart(widths.after)}  ${fmtBytes(totalSaved).padStart(widths.saved)}  ${(totalPct + '%').padStart(widths.pct)}`,
  );
  console.log(hr);
  console.log('');
}
