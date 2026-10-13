// visual[flow]'s UI (`src/library/visuals/`) is moving to its own repo, where it can reach zen only
// through the package. Until it moves, this holds it to that: every import that leaves the
// visuals folder must name something a public entry exports, `@satoramoto/zen`
// (`src/library/index.ts`) or, from stories, tests and fixtures only, `@satoramoto/zen/storybook`
// (`src/library/storybook.tsx`). A symbol counts when the entry exports the same declaration,
// under any name (ActionButton's `ButtonFace` is the package's `ActionButtonFace`).
//
// The scan is textual: it follows `export … from` and `export *` chains to each declaration.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const LIB = resolve(__dirname);
const VISUALS = join(LIB, 'visuals');
const ENTRIES = { '@satoramoto/zen': join(LIB, 'index.ts'), '@satoramoto/zen/storybook': join(LIB, 'storybook.tsx') } as const;
type Entry = keyof typeof ENTRIES;

const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

function resolveModule(from: string, spec: string): string | null {
  const base = resolve(dirname(from), spec);
  for (const p of [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')])
    if (existsSync(p) && statSync(p).isFile()) return p;
  return null;
}

/** `a`, `type a`, `a as b` → [local, exported]. */
const specifiers = (list: string) =>
  list
    .split(',')
    .map((s) => s.trim().replace(/^type\s+/, ''))
    .filter(Boolean)
    .map((s) => {
      const [local, alias] = s.split(/\s+as\s+/);
      return [local.trim(), (alias ?? local).trim()] as const;
    });

const sources = new Map<string, string>();
const read = (file: string) => {
  if (!sources.has(file)) sources.set(file, stripComments(readFileSync(file, 'utf8')));
  return sources.get(file)!;
};

/** Where `name`, as `file` exports it, is declared: `file#local`, or null if `file` doesn't export it. */
function origin(file: string, name: string, seen = new Set<string>()): string | null {
  const key = `${file}#${name}`;
  if (seen.has(key)) return null;
  seen.add(key);
  const src = read(file);
  for (const m of src.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) {
    const hit = specifiers(m[1]).find(([, exported]) => exported === name);
    const target = hit && resolveModule(file, m[2]);
    if (hit && target) return origin(target, hit[0], seen);
  }
  for (const m of src.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}(?!\s*from)/g)) {
    const hit = specifiers(m[1]).find(([, exported]) => exported === name);
    if (!hit) continue;
    // A local name re-exported: follow it if it was imported.
    for (const i of src.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) {
      const imported = specifiers(i[1]).find(([, as]) => as === hit[0]);
      const target = imported && resolveModule(file, i[2]);
      if (imported && target) return origin(target, imported[0], seen);
    }
    return `${file}#${hit[0]}`;
  }
  const declared = new RegExp(
    `export\\s+(?:declare\\s+)?(?:default\\s+)?(?:async\\s+)?(?:abstract\\s+)?(?:function\\*?|const|let|var|class|interface|type|enum|namespace)\\s+${name}\\b`,
  );
  if (declared.test(src)) return key;
  for (const m of src.matchAll(/export\s*\*\s*from\s*['"]([^'"]+)['"]/g)) {
    const target = resolveModule(file, m[1]);
    const found = target && origin(target, name, seen);
    if (found) return found;
  }
  return null;
}

/** Every name an entry exports, keyed by where it is declared. */
function publicSurface(entry: string): Map<string, string> {
  const out = new Map<string, string>();
  const names = new Set<string>();
  const collect = (file: string, seen: Set<string>) => {
    if (seen.has(file)) return;
    seen.add(file);
    const src = read(file);
    for (const m of src.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) for (const [, exported] of specifiers(m[1])) names.add(exported);
    for (const m of src.matchAll(/export\s+(?:declare\s+)?(?:async\s+)?(?:abstract\s+)?(?:function\*?|const|let|var|class|interface|type|enum|namespace)\s+(\w+)/g))
      names.add(m[1]);
    for (const m of src.matchAll(/export\s*\*\s*from\s*['"]([^'"]+)['"]/g)) {
      const target = resolveModule(file, m[1]);
      if (target) collect(target, seen);
    }
  };
  collect(entry, new Set());
  for (const name of names) {
    const o = origin(entry, name);
    if (o && !out.has(o)) out.set(o, name);
  }
  return out;
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : /\.(tsx?|css)$/.test(e.name) ? [p] : [];
  });
}

const outside = (target: string) => !target.startsWith(VISUALS + sep);
/** Stories, tests and fixtures may also use the Storybook entry; the app's own code may not. */
const storySide = (file: string) => /\.(stories|test|dom\.test)\.tsx?$/.test(file) || file.includes(`${sep}fixtures${sep}`);

interface Leak {
  file: string;
  spec: string;
  name: string;
}

/** Every import or re-export in visuals that leaves the folder and isn't public. */
function leaks(): { leaks: Leak[]; used: Map<Entry, Set<string>> } {
  const surfaces = Object.fromEntries(Object.entries(ENTRIES).map(([k, f]) => [k, publicSurface(f)])) as Record<Entry, Map<string, string>>;
  const found: Leak[] = [];
  const used = new Map<Entry, Set<string>>();
  for (const file of walk(VISUALS)) {
    const src = read(file);
    const rel = relative(LIB, file);
    const leaving = (spec: string) => {
      if (!spec.startsWith('.')) return null;
      const target = resolveModule(file, spec) ?? resolve(dirname(file), spec);
      return outside(target) ? target : null;
    };
    if (file.endsWith('.css')) {
      for (const m of src.matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]/g)) if (leaving(m[1])) found.push({ file: rel, spec: m[1], name: '(stylesheet)' });
      continue;
    }
    for (const m of src.matchAll(/(?:^|[;\n])\s*import\s+['"]([^'"]+)['"]/g)) if (leaving(m[1])) found.push({ file: rel, spec: m[1], name: '(side effect)' });
    for (const m of src.matchAll(/(?:vi\.mock\(|import\()\s*['"]([^'"]+)['"]/g)) if (leaving(m[1])) found.push({ file: rel, spec: m[1], name: '(mock or dynamic import)' });
    for (const m of src.matchAll(/\b(?:import|export)\s+(?:type\s+)?([^'";]*?)\s*from\s*['"]([^'"]+)['"]/g)) {
      const target = leaving(m[2]);
      if (!target) continue;
      const clause = m[1];
      const braces = clause.match(/\{([^}]*)\}/);
      const rest = clause.replace(/\{[^}]*\}/, '').replace(/,/g, '').trim();
      if (rest) found.push({ file: rel, spec: m[2], name: `(${rest})` });
      for (const [local] of braces ? specifiers(braces[1]) : []) {
        const o = origin(target, local);
        const allowed: Entry[] = storySide(file) ? ['@satoramoto/zen', '@satoramoto/zen/storybook'] : ['@satoramoto/zen'];
        const entry = o ? allowed.find((e) => surfaces[e].has(o)) : undefined;
        if (!entry) found.push({ file: rel, spec: m[2], name: local });
        else {
          if (!used.has(entry)) used.set(entry, new Set());
          used.get(entry)!.add(surfaces[entry].get(o!)!);
        }
      }
    }
  }
  return { leaks: found, used };
}

describe('the public surface visual[flow] imports zen through', () => {
  it('finds a declaration through export chains, renames included', () => {
    const core = join(LIB, 'components/core/index.ts');
    expect(origin(core, 'ActionButtonFace')).toBe(`${join(LIB, 'components/core/ActionButton/ActionButton.tsx')}#ButtonFace`);
    expect(origin(join(LIB, 'index.ts'), 'NotAThing')).toBeNull();
  });

  it('every import leaving src/library/visuals names something a public entry exports', () => {
    const { leaks: found, used } = leaks();
    const report = found.map((l) => `${l.file}: ${l.name} from '${l.spec}'`);
    expect(report).toEqual([]);
    // The scan saw the imports at all (a broken regex would pass vacuously).
    expect(used.get('@satoramoto/zen')?.size ?? 0).toBeGreaterThan(20);
    expect(used.get('@satoramoto/zen/storybook')?.size ?? 0).toBeGreaterThan(0);
  });
});
