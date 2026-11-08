import { describe, expect, it } from 'vitest';
import { ZEN_FILES } from '../stories/zen';
import { readRepo } from './repo';

// The dogfood: this project's own openspec folder, read the way the stories read it.
describe('zen’s own openspec root', () => {
  const repo = readRepo(ZEN_FILES);
  it('has the viewer’s spec with its requirements and scenarios', () => {
    expect(repo.schema).toBe('zen-flow');
    const spec = repo.specs.find((s) => s.capability === 'openspec-viewer');
    expect(spec).toBeDefined();
    expect(spec!.requirements.length).toBeGreaterThanOrEqual(5);
    for (const r of spec!.requirements) {
      expect(r.scenarios.length, r.name).toBeGreaterThan(0);
      for (const sc of r.scenarios) expect(sc.steps.map((s) => s.keyword), sc.name).toContain('THEN');
    }
  });
  it('has the change that made it in the archive, every task done', () => {
    const made = repo.archive.find((c) => c.name === 'openspec-stories');
    expect(made).toBeDefined();
    expect(made!.archived?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const tasks = made!.tasks.flatMap((g) => g.tasks);
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.every((t) => t.done)).toBe(true);
    expect(made!.deltas.map((d) => d.capability)).toEqual(['openspec-viewer']);
  });
});
