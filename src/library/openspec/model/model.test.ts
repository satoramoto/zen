import { describe, expect, it } from 'vitest';
import { SAMPLE_FILES } from '../fixtures/sample';
import { parseChange, parseTasks, taskProgress } from './change';
import { parseInline, parseMarkdown, plain, section, sections } from './markdown';
import { readRepo, summarize, touched } from './repo';
import { applyDelta, parseDelta, parseSpec, scenarioCount } from './spec';

describe('markdown', () => {
  it('parses headings, paragraphs, lists with task boxes, code and quotes, and drops comments', () => {
    const blocks = parseMarkdown(`# Title\n\nA paragraph with \`code\`, **bold** and a [link](https://x.y).\n<!-- a comment -->\n- [x] 1.1 done\n- [ ] 1.2 not yet\n  wrapped on\n1. first\n2. second\n\n\`\`\`ts\nconst a = 1;\n\`\`\`\n> quoted\n`);
    expect(blocks.map((b) => b.kind)).toEqual(['heading', 'paragraph', 'list', 'list', 'code', 'quote']);
    const list = blocks[2];
    if (list.kind !== 'list') throw new Error();
    expect(list.items.map((i) => [i.checked, plain(i.children)])).toEqual([
      [true, '1.1 done'],
      [false, '1.2 not yet wrapped on'],
    ]);
    const ordered = blocks[3];
    expect(ordered.kind === 'list' && ordered.ordered).toBe(true);
    expect(blocks[4]).toEqual({ kind: 'code', text: 'const a = 1;', language: 'ts' });
    expect(parseInline('a `b` **c *d*** [e](f)').map((n) => n.kind)).toEqual(['text', 'code', 'text', 'strong', 'text', 'link']);
  });
  it('cuts sections by heading level', () => {
    const blocks = parseMarkdown('# T\n## A\npa\n### A1\npa1\n## B\npb\n');
    expect(section(blocks, 2, (t) => t === 'A').length).toBe(3);
    expect(sections(blocks, 2).map((s) => s.heading)).toEqual(['A', 'B']);
    expect(sections(blocks, 3).map((s) => s.heading)).toEqual(['A1']);
  });
});

describe('spec', () => {
  const spec = parseSpec('user-auth', SAMPLE_FILES['specs/user-auth/spec.md']);
  it('reads the title, purpose, requirements and their scenarios', () => {
    expect(spec.title).toBe('user-auth Specification');
    expect(plain(spec.purpose[0].kind === 'paragraph' ? spec.purpose[0].children : [])).toMatch(/^Who a person is/);
    expect(spec.requirements.map((r) => r.name)).toEqual(['Sign-in with email and password', 'Sessions expire']);
    expect(spec.requirements[0].scenarios.map((s) => s.name)).toEqual(['Correct credentials', 'Wrong password']);
    expect(spec.requirements[0].scenarios[1].steps).toEqual([
      { keyword: 'WHEN', text: 'a person submits a registered email with the wrong password' },
      { keyword: 'THEN', text: 'the form shows "Email or password is incorrect"' },
      { keyword: 'AND', text: 'no session starts' },
    ]);
    expect(scenarioCount(spec)).toBe(3);
    // The statement stops where the scenarios start.
    expect(spec.requirements[0].text).toHaveLength(1);
  });
  it('reads a delta’s added, modified and removed requirements, and applies it', () => {
    const delta = parseDelta('theme', SAMPLE_FILES['changes/follow-system-theme/specs/theme/spec.md']);
    expect(delta.modified.map((r) => r.name)).toEqual(['Theme choice']);
    expect(delta.modified[0].scenarios).toHaveLength(2);
    expect(delta.removed.map((r) => r.name)).toEqual(['Theme preview']);
    expect(delta.added).toEqual([]);
    const theme = parseSpec('theme', SAMPLE_FILES['specs/theme/spec.md']);
    const after = applyDelta(theme, delta);
    expect(after.requirements).toHaveLength(1);
    expect(after.requirements[0].scenarios.map((s) => s.name)).toEqual(['Choosing dark', 'Choosing system']);
    const fresh = parseDelta('system-theme', SAMPLE_FILES['changes/follow-system-theme/specs/system-theme/spec.md']);
    expect(fresh.purpose).toBeDefined();
    expect(applyDelta(undefined, fresh).requirements.map((r) => r.name)).toEqual(['Follow the OS']);
  });
  it('reads a RENAMED section', () => {
    const delta = parseDelta('x', '# Spec Delta\n\n## RENAMED Requirements\n\n- FROM: `### Requirement: Old name`\n- TO: `### Requirement: New name`\n');
    expect(delta.renamed).toEqual([{ from: 'Old name', to: 'New name' }]);
  });
});

describe('change', () => {
  it('reads task groups, numbering and progress', () => {
    const groups = parseTasks(SAMPLE_FILES['changes/follow-system-theme/tasks.md']);
    expect(groups.map((g) => [g.name, g.tasks.length])).toEqual([
      ['1. Store', 2],
      ['2. Settings', 2],
      ['3. Verification', 1],
    ]);
    expect(groups[0].tasks[0]).toEqual({ id: '1.1', text: 'Add system to the theme choice', done: true });
    expect(taskProgress({ tasks: groups })).toEqual({ done: 2, total: 5 });
    expect(parseTasks('# Tasks\n\n- [x] a\n- [ ] b\n')).toEqual([{ name: 'Tasks', tasks: [{ id: undefined, text: 'a', done: true }, { id: undefined, text: 'b', done: false }] }]);
  });
  it('reads a change folder: proposal title, design, deltas, skip_specs', () => {
    const change = parseChange('follow-system-theme', {
      'proposal.md': SAMPLE_FILES['changes/follow-system-theme/proposal.md'],
      'design.md': SAMPLE_FILES['changes/follow-system-theme/design.md'],
      'tasks.md': SAMPLE_FILES['changes/follow-system-theme/tasks.md'],
      'specs/theme/spec.md': SAMPLE_FILES['changes/follow-system-theme/specs/theme/spec.md'],
      'specs/system-theme/spec.md': SAMPLE_FILES['changes/follow-system-theme/specs/system-theme/spec.md'],
    });
    expect(change.title).toBe('Follow the system theme');
    expect(change.design).toBeDefined();
    expect(change.deltas.map((d) => d.capability)).toEqual(['system-theme', 'theme']);
    expect(change.skipSpecs).toBeUndefined();
    const tooling = parseChange('ci-cache', { 'proposal.md': SAMPLE_FILES['changes/ci-cache/proposal.md'], '.openspec.yaml': 'skip_specs: true\n' });
    expect(tooling.skipSpecs).toBe(true);
    expect(tooling.deltas).toEqual([]);
  });
});

describe('repo', () => {
  const repo = readRepo(SAMPLE_FILES);
  it('reads the config, specs, active changes and the archive', () => {
    expect(repo.schema).toBe('spec-driven');
    expect(repo.specs.map((s) => s.capability)).toEqual(['theme', 'user-auth']);
    expect(repo.changes.map((c) => c.name)).toEqual(['ci-cache', 'follow-system-theme']);
    expect(repo.archive.map((c) => [c.name, c.archived?.date])).toEqual([['session-expiry', '2026-10-30']]);
  });
  it('summarises and says which capabilities a change touches', () => {
    expect(summarize(repo)).toEqual({ specs: 2, requirements: 3, scenarios: 4, changes: 2, archived: 1, tasks: { done: 4, total: 7 } });
    expect(touched(repo, repo.changes[1])).toEqual([
      { capability: 'system-theme', exists: false },
      { capability: 'theme', exists: true },
    ]);
  });
  it('reads an empty root', () => {
    expect(readRepo({ 'config.yaml': 'schema: spec-driven\n' })).toEqual({ schema: 'spec-driven', store: undefined, specs: [], changes: [], archive: [] });
  });
});
