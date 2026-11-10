// Stamp only a successfully compiled, unchanged source snapshot.
import { execFileSync } from 'node:child_process';
import { writeFile, rm } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { manualSources } from './manual-sources.mjs';
await rm('storybook-static/manual-build.json', { force: true });
const sources = await manualSources('.');
execFileSync('npm', ['exec', '--', 'storybook', 'build', '--disable-telemetry'], { stdio: 'inherit' });
assert.deepEqual(await manualSources('.'), sources, 'Source inputs changed during Storybook build; rebuild before capture');
await writeFile('storybook-static/manual-build.json', JSON.stringify(sources, null, 2) + '\n');
