// A change: a proposal, optional design, tasks and spec deltas, read from its folder's files.
import { parseMarkdown, plain, sections, type Block } from './markdown';
import { parseDelta, type Delta } from './spec';

export interface Task {
  /** "1.2" when the line is numbered. */
  id?: string;
  text: string;
  done: boolean;
}

export interface TaskGroup {
  name: string;
  tasks: Task[];
}

export interface Change {
  name: string;
  /** The proposal's title line. */
  title: string;
  proposal: Block[];
  design?: Block[];
  tasks: TaskGroup[];
  deltas: Delta[];
  /** Set when the change sits under `changes/archive/`: the folder's date prefix, if any. */
  archived?: { date?: string };
  /** `skip_specs: true` in the change's `.openspec.yaml`. */
  skipSpecs?: boolean;
}

/** The task groups of `tasks.md`: `## N. Group` headings over `- [ ] N.M text` lists. */
export function parseTasks(source: string): TaskGroup[] {
  const blocks = parseMarkdown(source);
  const groups = sections(blocks, 2).map((s) => ({
    name: s.heading,
    tasks: tasksIn(s.body),
  }));
  // Tasks before any group heading, or a file with no groups at all.
  const loose = tasksIn(blocks.slice(0, blocks.findIndex((b) => b.kind === 'heading' && b.level === 2) < 0 ? blocks.length : blocks.findIndex((b) => b.kind === 'heading' && b.level === 2)));
  return [...(loose.length ? [{ name: 'Tasks', tasks: loose }] : []), ...groups];
}

function tasksIn(blocks: Block[]): Task[] {
  return blocks
    .filter((b): b is Extract<Block, { kind: 'list' }> => b.kind === 'list')
    .flatMap((l) => l.items)
    .filter((i) => i.checked !== undefined)
    .map((i) => {
      const text = plain(i.children).trim();
      const m = text.match(/^(\d+(?:\.\d+)*)\s+(.*)$/);
      return { id: m?.[1], text: m ? m[2] : text, done: i.checked === true };
    });
}

/** How many tasks are done, of how many. */
export function taskProgress(change: Pick<Change, 'tasks'>): { done: number; total: number } {
  const all = change.tasks.flatMap((g) => g.tasks);
  return { done: all.filter((t) => t.done).length, total: all.length };
}

/**
 * A change from its files, keyed by path relative to the change folder: `proposal.md`,
 * `design.md`, `tasks.md`, `specs/<capability>/spec.md`, `.openspec.yaml`.
 */
export function parseChange(name: string, files: Record<string, string>, archived?: Change['archived']): Change {
  const proposal = parseMarkdown(files['proposal.md'] ?? '');
  const title = proposal.find((b): b is Extract<Block, { kind: 'heading' }> => b.kind === 'heading' && b.level === 1)?.text ?? name;
  const deltas: Delta[] = Object.entries(files)
    .filter(([path]) => /^specs\/.+\/spec\.md$/.test(path))
    .map(([path, source]) => parseDelta(path.replace(/^specs\//, '').replace(/\/spec\.md$/, ''), source))
    .sort((a, b) => a.capability.localeCompare(b.capability));
  const yaml = files['.openspec.yaml'] ?? '';
  return {
    name,
    title: title === 'Proposal' ? name : title,
    proposal,
    design: files['design.md'] !== undefined ? parseMarkdown(files['design.md']) : undefined,
    tasks: files['tasks.md'] !== undefined ? parseTasks(files['tasks.md']) : [],
    deltas,
    archived,
    skipSpecs: /^\s*skip_specs:\s*true/m.test(yaml) || undefined,
  };
}
