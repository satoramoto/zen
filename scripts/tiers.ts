// The tier counts (docs/tiers.md) per folder, against src/library/tiers.baseline.json.
// `npm run tiers` prints the table and exits 1 if any count is above its baseline;
// `npm run tiers -- --write` records the current counts as the baseline.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { ADOPTION_TOPS, RULE_IDS, TOP_FOLDERS, adoption, compare, countByFolder, scanLibrary, type Counts } from '../src/library/tiers';

const root = fileURLToPath(new URL('../src/library', import.meta.url));
const baselinePath = join(root, 'tiers.baseline.json');
const write = process.argv.includes('--write');

const counts = countByFolder(scanLibrary(root));
const baseline: Counts | undefined = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : undefined;

const cell = (c: Counts[string] | undefined, rule: (typeof RULE_IDS)[number]) => (c?.[rule] === undefined ? '-' : String(c[rule]));

const rows: string[][] = [];
const marks: string[] = [];
const row = (name: string, c: Counts[string], base?: Counts[string]) => {
  const cells = RULE_IDS.map((r) => {
    const v = cell(c, r);
    const b = base?.[r] ?? 0;
    return base && c[r] !== undefined && c[r] !== b ? `${v} (${b})` : v;
  });
  let mark = '';
  if (base) {
    const above = RULE_IDS.some((r) => c[r] !== undefined && (c[r] ?? 0) > (base[r] ?? 0));
    const below = RULE_IDS.some((r) => c[r] !== undefined && (c[r] ?? 0) < (base[r] ?? 0));
    mark = above ? 'ABOVE baseline' : below ? 'below baseline' : '';
  }
  rows.push([name, ...cells]);
  marks.push(mark);
};
const sum = (folders: string[], from: Counts) => {
  const total: Counts[string] = {};
  for (const f of folders) for (const r of RULE_IDS) if (from[f]?.[r] !== undefined) total[r] = (total[r] ?? 0) + (from[f][r] ?? 0);
  return total;
};

const folders = Object.keys(counts).sort();
for (const f of folders) row(f, counts[f], baseline ? (baseline[f] ?? {}) : undefined);
const totalRows: number[] = [];
for (const t of TOP_FOLDERS) {
  const inTop = folders.filter((f) => f === t || f.startsWith(`${t}/`));
  if (!inTop.length) continue;
  totalRows.push(rows.length);
  row(`= ${t}`, sum(inTop, counts), baseline ? sum(inTop, baseline) : undefined);
}
totalRows.push(rows.length);
row('= total', sum(folders, counts), baseline ? sum(Object.keys(baseline), baseline) : undefined);

const header = ['folder', ...RULE_IDS];
const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
const fmt = (r: string[]) => r.map((v, i) => (i === 0 ? v.padEnd(widths[i]) : v.padStart(widths[i]))).join('  ');
console.log(fmt(header));
rows.forEach((r, i) => {
  if (i === totalRows[0]) console.log('-'.repeat(fmt(header).length));
  console.log(`${fmt(r)}${marks[i] ? `  ${marks[i]}` : ''}`);
});
if (baseline) console.log('\n(n) after a count is its baseline where they differ.');

// Adoption: how many components render the primitives (a folder counts once).
const used = adoption(root);
const per = (list: string[], t: string) => list.filter((f) => f.startsWith(`${t}/`)).length;
const split = (list: string[]) => ADOPTION_TOPS.map((t) => `${t} ${per(list, t)}/${per(used.components, t)}`).join(', ');
console.log(
  `\nadoption: Text in ${used.text.length}/${used.components.length} components (${split(used.text)}); ` +
    `Surface in ${used.surface.length}/${used.components.length} (${split(used.surface)})`,
);

if (write) {
  const sorted: Counts = {};
  for (const f of folders) {
    sorted[f] = {};
    for (const r of [...RULE_IDS].sort()) if (counts[f][r] !== undefined) sorted[f][r] = counts[f][r];
  }
  writeFileSync(baselinePath, `${JSON.stringify(sorted, null, 2)}\n`);
  console.log(`\nWrote ${baselinePath}`);
  process.exit(0);
}

const failures = baseline ? compare(counts, baseline) : compare(counts, {});
if (!baseline) console.log('\nNo tiers.baseline.json yet: every count above 0 fails. Record one with --write.');
if (failures.length) {
  console.log(`\n${failures.join('\n\n')}`);
  process.exit(1);
}
