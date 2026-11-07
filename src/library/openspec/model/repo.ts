// An OpenSpec root (`openspec/`) read from a map of its files: the config, the main specs, the
// active changes and the archive. Nothing here touches a filesystem; a story or an app hands it
// the files.
import { parseChange, taskProgress, type Change } from './change';
import { parseSpec, scenarioCount, type Spec } from './spec';

export interface Repo {
  /** `schema:` from config.yaml, e.g. `spec-driven`. */
  schema?: string;
  /** `store:` from config.yaml, when the root is a standalone store. */
  store?: string;
  specs: Spec[];
  /** Active changes, by name. */
  changes: Change[];
  /** Archived changes, newest first by folder date. */
  archive: Change[];
}

/** Files keyed by path relative to the OpenSpec root, forward slashes, e.g. `specs/user-auth/spec.md`. */
export type Files = Record<string, string>;

const yamlValue = (yaml: string, key: string) => yaml.match(new RegExp(`^\\s*${key}:\\s*(.+?)\\s*$`, 'm'))?.[1]?.replace(/^["']|["']$/g, '');

/** Group a change folder's files by change name: `changes/<name>/<rest>` → name → rest. */
function changeFolders(files: Files, prefix: string): Map<string, Files> {
  const folders = new Map<string, Files>();
  for (const [path, source] of Object.entries(files)) {
    if (!path.startsWith(prefix)) continue;
    const rest = path.slice(prefix.length);
    const slash = rest.indexOf('/');
    if (slash < 0) continue;
    const name = rest.slice(0, slash);
    const inner = rest.slice(slash + 1);
    if (name === 'archive' && prefix === 'changes/') continue;
    if (!folders.has(name)) folders.set(name, {});
    folders.get(name)![inner] = source;
  }
  return folders;
}

/** The archive folder's `YYYY-MM-DD-name` convention, when it is followed. */
const archiveName = (folder: string): { date?: string; name: string } => {
  const m = folder.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
  return m ? { date: m[1], name: m[2] } : { name: folder };
};

export function readRepo(files: Files): Repo {
  const config = files['config.yaml'] ?? '';
  const specs = Object.entries(files)
    .filter(([path]) => /^specs\/.+\/spec\.md$/.test(path))
    .map(([path, source]) => parseSpec(path.replace(/^specs\//, '').replace(/\/spec\.md$/, ''), source))
    .sort((a, b) => a.capability.localeCompare(b.capability));
  const changes = [...changeFolders(files, 'changes/')].map(([name, inner]) => parseChange(name, inner)).sort((a, b) => a.name.localeCompare(b.name));
  const archive = [...changeFolders(files, 'changes/archive/')]
    .map(([folder, inner]) => {
      const { date, name } = archiveName(folder);
      return parseChange(name, inner, { date });
    })
    .sort((a, b) => (b.archived?.date ?? '').localeCompare(a.archived?.date ?? '') || a.name.localeCompare(b.name));
  return { schema: yamlValue(config, 'schema'), store: yamlValue(config, 'store'), specs, changes, archive };
}

/** The repo in numbers, for a dashboard's header. */
export function summarize(repo: Repo) {
  const tasks = repo.changes.map(taskProgress).reduce((a, p) => ({ done: a.done + p.done, total: a.total + p.total }), { done: 0, total: 0 });
  return {
    specs: repo.specs.length,
    requirements: repo.specs.reduce((n, s) => n + s.requirements.length, 0),
    scenarios: repo.specs.reduce((n, s) => n + scenarioCount(s), 0),
    changes: repo.changes.length,
    archived: repo.archive.length,
    tasks,
  };
}

/** The capabilities a change touches, with whether each already has a main spec. */
export function touched(repo: Repo, change: Change): { capability: string; exists: boolean }[] {
  return change.deltas.map((d) => ({ capability: d.capability, exists: repo.specs.some((s) => s.capability === d.capability) }));
}
