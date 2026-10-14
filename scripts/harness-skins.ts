// Writes src/harness/claude-code/kit/skins.ts: every theme pack's skin for the Claude Code kit,
// as plain data a plugin carries (the kit can't import zen's packs: the engine loads a plugin's
// own files only). Run it after changing a palette, a pack or the mapping in
// src/harness/claude-code/skins.ts; src/harness/claude-code/skins.test.ts fails until you do.
//
//   npx tsx scripts/harness-skins.ts
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { skinsSource } from '../src/harness/claude-code/skins';

const target = fileURLToPath(new URL('../src/harness/claude-code/kit/skins.ts', import.meta.url));
writeFileSync(target, skinsSource());
console.log(`wrote ${target}`);
