// Fails when a framework-free or Svelte entry of the built package reaches React: `lib/svelte.js`
// and `lib/themes.js` (when built), and every chunk they import, must not import `react`,
// `react-dom` or `react/jsx-runtime`. Run after `npm run build:lib` (`npm run check:lib`).
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const LIB = resolve('lib');
const ENTRIES = ['svelte.js', 'themes.js'];
/** A static or dynamic import of a module specifier. */
const IMPORT = /(?:\bfrom\s*|\bimport\s*\(?\s*)["']([^"']+)["']/g;
const REACT = /^react(?:-dom)?(?:\/.*)?$/;

const failures: string[] = [];
let checked = 0;
for (const entry of ENTRIES) {
  const start = join(LIB, entry);
  if (!existsSync(start)) continue;
  checked++;
  const seen = new Set<string>();
  const queue: { file: string; via: string[] }[] = [{ file: start, via: [entry] }];
  while (queue.length) {
    const { file, via } = queue.shift()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const src = readFileSync(file, 'utf8');
    for (const [, spec] of src.matchAll(IMPORT)) {
      if (REACT.test(spec)) failures.push(`${via.join(' → ')} imports "${spec}"`);
      else if (spec.startsWith('.')) {
        const next = resolve(dirname(file), spec);
        queue.push({ file: next, via: [...via, relative(LIB, next)] });
      }
    }
  }
}

if (checked === 0) {
  console.error('check-lib-entries: no entry found under lib/ (run `npm run build:lib` first)');
  process.exit(1);
}
if (failures.length) {
  console.error(`React reached from a non-React entry:\n${[...new Set(failures)].map((f) => `  ${f}`).join('\n')}`);
  process.exit(1);
}
console.log(`check-lib-entries: ${checked} entr${checked === 1 ? 'y' : 'ies'} free of React`);
