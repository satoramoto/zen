// SOURCES.md, written from the registry in sources.ts: `npx tsx scripts/physics-sources.ts` writes
// it, and sources.test.ts fails while the file and the registry disagree.
import { allDescentSources, SOURCE_COMMIT, SOURCE_REPO, TIMELINE_SOURCE, type SourcedValue } from './sources';

const fmt = (v: SourcedValue) => {
  if (v.unit === '' || v.unit === 'code') return '';
  const n = Math.abs(v.value) >= 1000 || Number.isInteger(v.value) ? v.value.toLocaleString('en', { maximumFractionDigits: 3 }) : v.value.toPrecision(4);
  return `${n} ${v.unit}`;
};

export function sourcesMarkdown(): string {
  const all = allDescentSources();
  const cited = all.filter((v) => v.cite);
  const approximations = all.filter((v) => v.approximation);
  const row = (v: SourcedValue) => `| ${v.name} | ${fmt(v)} | ${v.what} | ${v.cite ? `\`${v.cite.file}\` line ${v.cite.line}: \`${v.cite.label.replace(/\|/g, '\\|')}\`` : '—'} |`;
  return `# Sources

Where every number in the Apollo 11 descent comes from. This file is written from
\`model/sources.ts\` by \`npx tsx scripts/physics-sources.ts\`; edit the registry, not this file.

The flight software is cited, never copied: line numbers refer to Luminary 099 (the Lunar Module's
program on Apollo 11) in the public transcription at ${SOURCE_REPO}, commit \`${SOURCE_COMMIT}\`.
The historical checks cite ${TIMELINE_SOURCE}.

## From the flight software

| Name | Value | What it is | Source |
|---|---|---|---|
${cited.map(row).join('\n')}

## Approximations

Values the flight software doesn't hold (many descent targets were pad-loaded before flight, so the
source names them but carries no value), and places where the model simplifies.

| Name | Value | Why it is an approximation |
|---|---|---|
${approximations.map((v) => `| ${v.name} | ${fmt(v)} | ${v.approximation} |`).join('\n')}

## What the model leaves out

- The Moon is a sphere and the motion planar: the out-of-plane steering, the Moon's rotation and its
  terrain are left out, and the landing site is on the sphere.
- The executive is a model of why the 1202 happened (more work than the cycle had time for), not an
  emulation of the AGC: jobs are shares of a two-second cycle, not instructions.
- There is no landing radar: the computed altitude is exact, so N68's ΔH is always 0.
`;
}
