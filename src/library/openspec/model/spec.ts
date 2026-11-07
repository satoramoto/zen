// A capability's spec, and a change's delta against it, read from OpenSpec's Markdown.
import { parseMarkdown, plain, section, sections, type Block } from './markdown';

export type StepKeyword = 'GIVEN' | 'WHEN' | 'THEN' | 'AND';

export interface Step {
  keyword: StepKeyword;
  text: string;
}

export interface Scenario {
  name: string;
  steps: Step[];
}

export interface Requirement {
  name: string;
  /** The requirement's statement, the blocks before its first scenario. */
  text: Block[];
  scenarios: Scenario[];
}

export interface Spec {
  /** The capability path, e.g. `user-auth` or `identity/user-auth`. */
  capability: string;
  /** The title line, usually "<capability> Specification". */
  title: string;
  purpose: Block[];
  requirements: Requirement[];
}

export interface Delta {
  capability: string;
  /** Set for a new capability. */
  purpose?: Block[];
  added: Requirement[];
  modified: Requirement[];
  /** Removed requirements carry only a name and, sometimes, a reason. */
  removed: Requirement[];
  renamed: { from: string; to: string }[];
}

const STEP = /^\*\*(GIVEN|WHEN|THEN|AND)\*\*\s*(.*)$/;

/** The scenarios under a requirement's blocks, each a `#### Scenario:` heading and its step list. */
function scenariosOf(blocks: Block[]): Scenario[] {
  return sections(blocks, 4)
    .filter((s) => /^Scenario:/i.test(s.heading))
    .map((s) => ({
      name: s.heading.replace(/^Scenario:\s*/i, '').trim(),
      steps: s.body
        .filter((b): b is Extract<Block, { kind: 'list' }> => b.kind === 'list')
        .flatMap((l) => l.items)
        .flatMap((item) => {
          const raw = item.children;
          const strong = raw[0];
          if (strong?.kind === 'strong') {
            const keyword = plain(strong.children).trim().toUpperCase();
            if (keyword === 'GIVEN' || keyword === 'WHEN' || keyword === 'THEN' || keyword === 'AND') {
              return [{ keyword, text: plain(raw.slice(1)).trim() }];
            }
          }
          const m = plain(raw).match(STEP);
          return m ? [{ keyword: m[1] as StepKeyword, text: m[2].trim() }] : [];
        }),
    }));
}

/** The requirements in a run of blocks: each `### Requirement:` heading, its statement and its scenarios. */
function requirementsOf(blocks: Block[]): Requirement[] {
  return sections(blocks, 3)
    .filter((s) => /^Requirement:/i.test(s.heading))
    .map((s) => {
      const firstScenario = s.body.findIndex((b) => b.kind === 'heading' && b.level === 4);
      return {
        name: s.heading.replace(/^Requirement:\s*/i, '').trim(),
        text: firstScenario < 0 ? s.body : s.body.slice(0, firstScenario),
        scenarios: scenariosOf(s.body),
      };
    });
}

/** A main spec: `openspec/specs/<capability>/spec.md`. */
export function parseSpec(capability: string, source: string): Spec {
  const blocks = parseMarkdown(source);
  const title = blocks.find((b): b is Extract<Block, { kind: 'heading' }> => b.kind === 'heading' && b.level === 1)?.text ?? capability;
  return {
    capability,
    title,
    purpose: section(blocks, 2, (t) => /^purpose$/i.test(t)),
    requirements: requirementsOf(section(blocks, 2, (t) => /^requirements$/i.test(t))),
  };
}

/** A change's delta for one capability: `changes/<name>/specs/<capability>/spec.md`. */
export function parseDelta(capability: string, source: string): Delta {
  const blocks = parseMarkdown(source);
  const purpose = section(blocks, 2, (t) => /^purpose$/i.test(t));
  const renamed = section(blocks, 2, (t) => /^renamed requirements$/i.test(t))
    .filter((b): b is Extract<Block, { kind: 'list' }> => b.kind === 'list')
    .flatMap((l) => l.items.map((i) => plain(i.children)))
    .reduce<{ from: string; to: string }[]>((acc, line) => {
      const from = line.match(/^FROM:\s*`?(.*?)`?\s*$/i);
      const to = line.match(/^TO:\s*`?(.*?)`?\s*$/i);
      if (from) acc.push({ from: from[1].replace(/^### Requirement:\s*/i, ''), to: '' });
      else if (to && acc.length) acc[acc.length - 1].to = to[1].replace(/^### Requirement:\s*/i, '');
      return acc;
    }, []);
  return {
    capability,
    purpose: purpose.length ? purpose : undefined,
    added: requirementsOf(section(blocks, 2, (t) => /^added requirements$/i.test(t))),
    modified: requirementsOf(section(blocks, 2, (t) => /^modified requirements$/i.test(t))),
    removed: requirementsOf(section(blocks, 2, (t) => /^removed requirements$/i.test(t))),
    renamed,
  };
}

/** How many scenarios a spec holds. */
export const scenarioCount = (spec: Pick<Spec, 'requirements'>): number => spec.requirements.reduce((n, r) => n + r.scenarios.length, 0);

/**
 * The spec a delta would leave behind: added requirements appended, modified ones replaced by
 * name, removed ones dropped, renamed ones renamed. What `openspec archive` does, in outline.
 */
export function applyDelta(spec: Spec | undefined, delta: Delta): Spec {
  const base: Spec = spec ?? { capability: delta.capability, title: `${delta.capability} Specification`, purpose: delta.purpose ?? [], requirements: [] };
  let requirements = base.requirements.map((r) => ({ ...r }));
  for (const { from, to } of delta.renamed) requirements = requirements.map((r) => (r.name === from ? { ...r, name: to } : r));
  for (const m of delta.modified) requirements = requirements.map((r) => (r.name === m.name ? m : r));
  const removed = new Set(delta.removed.map((r) => r.name));
  requirements = requirements.filter((r) => !removed.has(r.name));
  requirements.push(...delta.added.filter((a) => !requirements.some((r) => r.name === a.name)));
  return { ...base, purpose: base.purpose.length ? base.purpose : (delta.purpose ?? []), requirements };
}
