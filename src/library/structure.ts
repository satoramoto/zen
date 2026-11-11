/**
 * The folder shape of the library (docs/structure.md) as a checker, held by `structure.test.ts`.
 * Pure string work: it is given the files' paths (relative to `src/library`) and a way to read one.
 *
 * - The root holds {@link ROOT_FILES}, `foundation/` (shared machinery, not checked), the generic
 *   tiers {@link ROOT_TIERS} and the areas in {@link AREAS}. `foundation/` holds no stories.
 * - An area holds lower-case files, the tier folders {@link TIERS} and declared sub-areas.
 * - In `components/`, `layouts/` and `screens/` each part is a `<Name>/` folder. A file named for a
 *   part (a capitalised name: `Fader.tsx`, `Fader.model.ts`) is never loose in a tier folder or at
 *   an area's root; lower-case helpers may be.
 * - `model/` has no renderer: no `.tsx`, no `.svelte`, no React or Svelte import.
 * - A stories file sits in a part's folder and its title starts with the area's sidebar name and
 *   the tier (`Music/Live/Screens/…`); the generic tiers read `Core/…`.
 *
 * A new area, sub-area or root file is added here, on purpose.
 */

/** The generic tiers at the root, and their sidebar names. */
export const ROOT_TIERS: Record<string, string> = {
  primitives: 'Core/Primitives',
  components: 'Core/Components',
  layouts: 'Core/Layouts',
  screens: 'Core/Screens',
};

/** The tier folders an area may have, and the sidebar name of each that holds parts. */
export const TIERS: Record<string, string | null> = {
  model: null,
  components: 'Components',
  layouts: 'Layouts',
  screens: 'Screens',
};

/** Every area and sub-area, by folder, with its sidebar name. */
export const AREAS: Record<string, string> = {
  music: 'Music',
  'music/live': 'Music/Live',
  graph: 'Graph',
  shader: 'Shader',
  report: 'Report',
  math: 'Math',
  'math/calculator': 'Math/Calculator',
  'math/cymatics': 'Math/Cymatics',
  'math/explore': 'Math/Explore',
  'math/fourier': 'Math/Fourier',
  'math/lab': 'Math/Lab',
  'math/perspective': 'Math/Perspective',
  'math/physics': 'Math/Physics',
  'math/primes': 'Math/Primes',
  'math/signals': 'Math/Signals',
  'math/stereo': 'Math/Stereo',
  'math/trig': 'Math/Trig',
  compendium: 'Compendium',
  'compendium/book': 'Compendium/Book',
  'compendium/book/fourier': 'Compendium/Book/Fourier',
  'compendium/book/prime-waves': 'Compendium/Book/Prime Waves',
  openspec: 'Openspec',
  push: 'Push',
  site: 'Site',
  yahaha: 'Yahaha',
};

/** The shared machinery: themes, skins, the view tree, the Svelte helpers, story helpers. */
export const FOUNDATION = 'foundation';

/** The files at the root: the public entries, the repo-wide checks and what those read. */
export const ROOT_FILES = [
  'index.ts', 'themes.ts', 'svelte.ts', 'storybook.tsx', 'storybook-renderers.tsx', 'view.ts', 'view-react.ts', 'view-svelte.ts', 'checks.ts', 'source.css', 'library.css',
  'contract.ts', 'theme.tsx', 'theme.model.ts', 'resolve.ts', 'frame.ts', 'fixtures.ts', 'storybook.globals.ts',
  'library.test.tsx', 'parity.ts', 'parity.test.tsx',
  'tiers.ts', 'tiers.test.ts', 'tiers.baseline.json',
  'structure.ts', 'structure.test.ts',
];

const WHERE = 'see docs/structure.md';

/** A file named for a part: `Fader.tsx`, `Fader.model.ts`, `Fader.css`. Docs (`README.md`) are not. */
export const isPartFile = (name: string) => /^[A-Z][A-Za-z0-9]*\.(?:[\w-]+\.)*(?:tsx?|svelte|css)$/.test(name);
const isPartFolder = (name: string) => /^[A-Z][A-Za-z0-9]*$/.test(name);
const isStories = (name: string) => /\.stories\.(?:svelte\.)?tsx?$/.test(name);
const isTest = (name: string) => /\.test\.tsx?$/.test(name);
const RENDERER_IMPORT = /(?:from|import)\s*\(?\s*['"](?:react|react-dom|svelte)(?:\/[^'"]*)?['"]/;

/** The deepest declared area a file is in, or null. */
export function areaOf(file: string): string | null {
  const parts = file.split('/');
  for (let n = parts.length - 1; n > 0; n--) {
    const dir = parts.slice(0, n).join('/');
    if (dir in AREAS) return dir;
  }
  return null;
}

/** The start a stories file's title must have, or null where titles are free (`foundation/`). */
export function titlePrefix(file: string): string | null {
  const [top] = file.split('/');
  if (top in ROOT_TIERS) return ROOT_TIERS[top];
  const area = areaOf(file);
  if (!area) return null;
  const tier = TIERS[file.slice(area.length + 1).split('/')[0]];
  return tier ? `${AREAS[area]}/${tier}` : null;
}

/** A stories file's sidebar title: its first `title: '…/…'`. */
export const titleIn = (src: string) => /\btitle:\s*(['"`])([^'"`\n]*\/[^'"`\n]*)\1/.exec(src)?.[2] ?? null;

/** Everything in `files` that breaks the shape, one line each. `read` is asked only for stories and model files. */
export function checkStructure(files: string[], read: (file: string) => string): string[] {
  const problems = new Set<string>();
  for (const file of files) {
    const parts = file.split('/');
    const name = parts.at(-1)!;
    if (parts.length === 1) {
      if (!ROOT_FILES.includes(name)) problems.add(`${file}: not a root file — put it in an area or foundation/, or add it to ROOT_FILES in structure.ts (${WHERE})`);
      continue;
    }
    if (parts[0] === FOUNDATION) {
      if (isStories(name)) problems.add(`${file}: foundation/ is machinery and has no stories — a whole view of the core is a screen, screens/<Name>/ (${WHERE})`);
      continue;
    }

    let tierAt: number; // index in `parts` of the tier folder, or -1 at an area's root
    let home: string;
    if (parts[0] in ROOT_TIERS) {
      tierAt = 0;
      home = parts[0];
    } else {
      const area = areaOf(file);
      if (!area) {
        problems.add(`${parts[0]}/: not a declared area — add it to AREAS in structure.ts, or move its files into one (${WHERE})`);
        continue;
      }
      const depth = area.split('/').length;
      home = area;
      if (parts.length === depth + 1) tierAt = -1;
      else if (parts[depth] in TIERS) tierAt = depth;
      else {
        problems.add(`${parts.slice(0, depth + 1).join('/')}/: neither a tier (model, components, layouts, screens) nor a declared sub-area of ${area} (${WHERE})`);
        continue;
      }
    }

    if (tierAt === -1) {
      if (isStories(name)) problems.add(`${file}: stories sit in their part's folder, ${home}/<tier>/<Name>/`);
      else if (isPartFile(name)) problems.add(`${file}: a part's files go in ${home}/<tier>/${name.split('.')[0]}/`);
      continue;
    }

    const tier = parts[tierAt];
    const tierDir = parts.slice(0, tierAt + 1).join('/');
    if (tier === 'model') {
      if (/\.(?:tsx|svelte)$/.test(name)) problems.add(`${file}: model/ has no renderer files — move it to a part's folder`);
      else if (/\.ts$/.test(name) && !isTest(name) && RENDERER_IMPORT.test(read(file))) problems.add(`${file}: model/ imports neither React nor Svelte`);
      continue;
    }
    if (parts.length === tierAt + 2) {
      if (isStories(name)) problems.add(`${file}: stories sit in their part's folder, ${tierDir}/<Name>/`);
      else if (isPartFile(name)) problems.add(`${file}: a part's files go in ${tierDir}/${name.split('.')[0]}/`);
      continue;
    }
    const folder = parts[tierAt + 1];
    if (!isPartFolder(folder)) {
      problems.add(`${tierDir}/${folder}/: a folder in ${tierDir}/ is a part named like its component (${WHERE})`);
      continue;
    }
    if (isStories(name)) {
      const want = titlePrefix(file)!;
      const title = titleIn(read(file));
      if (title === null || !(title === want || title.startsWith(`${want}/`))) {
        problems.add(`${file}: title ${title === null ? 'is missing' : `'${title}'`} — it starts with '${want}/'`);
      }
    }
  }
  return [...problems].sort();
}
