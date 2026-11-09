// Writes src/library/math/physics/SOURCES.md from the descent's registry (model/sources.ts).
// Run after changing a cited or approximated value: npx tsx scripts/physics-sources.ts
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { sourcesMarkdown } from '../src/library/math/physics/model/sourcesDoc';

const target = fileURLToPath(new URL('../src/library/math/physics/SOURCES.md', import.meta.url));
writeFileSync(target, sourcesMarkdown());
console.log('wrote', target);
