// The library's rule checks over a `FileSource` (pure: no node, so a story's play can run them on
// files it holds). `checks.ts` is the public entry, which also reads a folder from disk.
import { SCOPE_VARS, toCssVars } from '../../contract';
import { packs } from '../themes/packs';
import { compare, countByFolder, scanLibrary, type Counts, type FileSource, type Finding } from '../../tiers';
import { scanBindings } from '../view/bindings';

/** One thing a file does outside the token contract. */
export interface ContractFinding {
  /** Relative to the source's root. */
  file: string;
  /** 1-based. */
  line: number;
  rule: 'reads' | 'colour' | 'radius' | 'light-dark';
  message: string;
}

/** Every variable the contract gives a component: what `toCssVars()` writes and the scope's own. */
export const CONTRACT_VARS: ReadonlySet<string> = new Set([...Object.keys(toCssVars(packs[0].facets, 'dark')), ...SCOPE_VARS]);

/** Every file under `rel`, at any depth, matching `ext`; stories and tests aside. A missing folder has none. */
export function filesUnder(source: FileSource, rel: string, ext: RegExp = /\.(tsx?|css)$/): string[] {
  return source.files(rel).filter((f) => ext.test(f) && !/\.(stories|test)\.tsx?$/.test(f)).map((f) => `${rel}/${f}`);
}

const lineOf = (src: string, at: number) => src.slice(0, at).split('\n').length;
/** Comments become spaces, so offsets (and lines) are kept. */
const uncomment = (src: string) => src.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, (c) => c.replace(/[^\n]/g, ' '));

/**
 * The contract check: a component's styles and markup read only the contract's variables
 * (`CONTRACT_VARS`) or ones declared somewhere in the files checked, and hold no literal colour
 * (`#hex`, `rgb()`, `hsl()`), no literal radius and no `light-dark()`. `folders` are checked whole and
 * `files` as listed, both relative to the source's root.
 */
export function checkContract(source: FileSource, options: { folders?: readonly string[]; files?: readonly string[] } = {}): ContractFinding[] {
  const files = [...(options.files ?? []), ...(options.folders ?? []).flatMap((f) => filesUnder(source, f))];
  const read = (rel: string) => source.read(rel);
  const declared = new Set<string>();
  for (const file of files) for (const m of read(file).matchAll(/(--[a-z0-9-]+)\s*:/g)) declared.add(m[1]);
  const out: ContractFinding[] = [];
  for (const file of files) {
    const raw = read(file);
    for (const m of raw.matchAll(/var\((--[a-z0-9-]+)/g)) {
      if (!CONTRACT_VARS.has(m[1]) && !declared.has(m[1])) out.push({ file, line: lineOf(raw, m.index ?? 0), rule: 'reads', message: `${file} reads ${m[1]}` });
    }
    const src = uncomment(raw);
    const first = (pattern: RegExp) => src.match(pattern)?.index;
    const colour = first(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/);
    if (colour !== undefined) out.push({ file, line: lineOf(src, colour), rule: 'colour', message: `${file} has a colour literal` });
    // `0` (no rounding) and `inherit` aren't radii a theme chooses.
    const radius = first(/border-radius:(?!\s*(var\(|0(px)?\s*[;}]|inherit\s*[;}]))/);
    if (radius !== undefined) out.push({ file, line: lineOf(src, radius), rule: 'radius', message: `${file} has a literal radius` });
    // The build rewrites light-dark() into variables only a literal color-scheme sets; the
    // library's scheme comes from var(--scheme), so it renders transparent.
    const lightDark = first(/\blight-dark\(/);
    if (lightDark !== undefined) out.push({ file, line: lineOf(src, lightDark), rule: 'light-dark', message: `${file} uses light-dark()` });
  }
  return out;
}

/**
 * The tier rules (docs/tiers.md) over `folders` of the source, each count held to `baseline` (a
 * missing entry is 0). A folder of zen's own is read by its name; an app's folder is read as zen
 * reads an area (`readAs: 'area'`: counted per `<folder>/<tier>/<Name>`, held to the controls'
 * rules). Returns every finding and a failure for each count above its baseline.
 */
export function checkTiers(source: FileSource, options: { folders?: readonly string[]; readAs?: 'own' | 'area'; baseline?: Counts } = {}): { findings: Finding[]; failures: string[] } {
  const { folders, readAs = 'own', baseline = {} } = options;
  if (readAs === 'own') {
    const findings = scanLibrary(source, folders);
    return { findings, failures: compare(countByFolder(findings), baseline) };
  }
  // An app's folder is scanned under the name of an area zen holds to the controls' rules, and
  // its names are given back.
  const AREA = 'report';
  const out: { findings: Finding[]; failures: string[] } = { findings: [], failures: [] };
  for (const folder of folders ?? []) {
    const toArea = (path: string) => (path === folder || path.startsWith(`${folder}/`) ? AREA + path.slice(folder.length) : path);
    const back = (text: string) => text.replace(new RegExp(`(^|\\s)${AREA}(?=/|\\s|:|$)`, 'gm'), `$1${folder}`);
    const findings = scanLibrary(source, [folder], { [folder]: AREA });
    const areaBaseline = Object.fromEntries(Object.entries(baseline).map(([k, v]) => [toArea(k), v]));
    out.failures.push(...compare(countByFolder(findings), areaBaseline).map(back));
    out.findings.push(...findings.map((f) => ({ ...f, file: back(f.file) })));
  }
  return out;
}

/**
 * The bindings-only rule (docs/svelte-bindings.md): a part's `.tsx` and `.svelte` under `folders`
 * write no element markup but `<Tree …/>`. Returns a failure for each file with more than its
 * `baseline` count (a missing entry is 0).
 */
export function checkBindingsOnly(source: FileSource, options: { folders?: readonly string[]; baseline?: Record<string, number> } = {}): string[] {
  const { folders, baseline = {} } = options;
  return Object.entries(scanBindings(source, folders))
    .filter(([file, n]) => n > (baseline[file] ?? 0))
    .map(([file, n]) => `${file}: ${n} element tags besides <Tree> (baseline ${baseline[file] ?? 0}) — move the markup into the model's tree`);
}
