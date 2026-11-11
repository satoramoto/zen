// Fails when a framework-free or Svelte entry of the built package reaches React: `lib/svelte.js`
// and `lib/themes.js` (when built), and every chunk they import, must not import `react`,
// `react-dom` or `react/jsx-runtime`. Run after `npm run build:lib` (`npm run check:lib`).
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const LIB = resolve('lib');
const ENTRIES = [
  { file: 'svelte.js', frameworks: /^react(?:-dom)?(?:\/.*)?$/ },
  ...['themes.js', 'compendium-model.js', 'math-trig-model.js', 'math-expression.js', 'push-model.js'].map((file) => ({
    file, frameworks: /^(?:react(?:-dom)?|svelte|storybook|@storybook\/[^/]+)(?:\/.*)?$/,
  })),
];
/** A static or dynamic import of a module specifier. */
const IMPORT = /(?:\bfrom\s*|\bimport\s*\(?\s*)["']([^"']+)["']/g;

const failures: string[] = [];
let checked = 0;
for (const { file: entry, frameworks } of ENTRIES) {
  const start = join(LIB, entry);
  if (!existsSync(start)) { failures.push(`Missing required entry ${entry}`); continue; }
  checked++;
  const seen = new Set<string>();
  const queue: { file: string; via: string[] }[] = [{ file: start, via: [entry] }];
  while (queue.length) {
    const { file, via } = queue.shift()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const src = readFileSync(file, 'utf8');
    for (const [, spec] of src.matchAll(IMPORT)) {
      if (frameworks.test(spec)) failures.push(`${via.join(' → ')} imports "${spec}"`);
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
  console.error(`Package boundary failures:\n${[...new Set(failures)].map((f) => `  ${f}`).join('\n')}`);
  process.exit(1);
}
console.log(`check-lib-entries: ${checked} entries respect their framework boundaries`);
