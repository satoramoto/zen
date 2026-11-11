// @vitest-environment node
// The story runner over its fixture Storybook (fixtures/stories-runner): what is played where in
// each of the three runs, what is reported, and what happens with no browser on the machine.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { serveBuilt } from './browser.mjs';
import { matching, plan } from './select.mjs';

const cli = fileURLToPath(new URL('./cli.mjs', import.meta.url));
const fixture = fileURLToPath(new URL('../../../fixtures/stories-runner', import.meta.url));
const storybook = fileURLToPath(new URL('../../../node_modules/storybook/dist/bin/dispatcher.js', import.meta.url));

type Run = { code: number | null; output: string; lines: string[] };
function run(command: string, args: string[], env: Record<string, string> = {}) {
  return new Promise<Run>((done) => {
    const child = spawn(process.execPath, [command, ...args], { cwd: fixture, env: { ...process.env, STORYBOOK_URL: '', ...env } });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { output += chunk; });
    child.on('close', (code) => done({ code, output, lines: output.split('\n') }));
  });
}
const stories = (args: string[], env?: Record<string, string>) => run(cli, args, env);
const last = (r: Run) => r.lines.filter(Boolean).at(-1) ?? '';

let scratch = '';
let built = '';
let noBrowsers = '';
let served: Awaited<ReturnType<typeof serveBuilt>>;
// Whether this machine has Playwright's headless shell: the browser pass is only played where it does.
let shell = false;

beforeAll(async () => {
  scratch = mkdtempSync(join(tmpdir(), 'zen-stories-'));
  built = join(scratch, 'built');
  noBrowsers = join(scratch, 'no-browsers');
  const build = await run(storybook, ['build', '-c', '.storybook', '-o', built, '--quiet']);
  if (!existsSync(join(built, 'index.json'))) throw new Error(`the fixture Storybook did not build:\n${build.output}`);
  served = await serveBuilt(built);
  const { chromium } = await import('playwright');
  shell = await chromium.launch({ headless: true }).then((browser) => browser.close().then(() => true), () => false);
}, 120000);

afterAll(async () => { await served?.close(); rmSync(scratch, { recursive: true, force: true }); });

describe('which stories are played where', () => {
  const story = (id: string, tags: string[] = []) => ({ id, title: id, name: id, tags: ['dev', 'test', ...tags], importPath: './x', exportName: 'X' });
  const all = [story('a'), story('b', ['browser']), story('c', ['stage']), story('d', ['stage', 'browser'])];
  const ids = (list: { id: string }[]) => list.map((s) => s.id);

  it('plays browser stories in the browser and the rest on the virtual DOM in a local run', () => {
    const p = plan(all, { mode: 'local', stage: true });
    expect(ids(p.virtual)).toEqual(['a', 'c']);
    expect(ids(p.browser)).toEqual(['b', 'd']);
    expect(p.skipped).toEqual([]);
  });

  it('plays a story tagged stage and browser in the browser', () => {
    expect(ids(plan(all, { mode: 'local', stage: true }).browser)).toContain('d');
  });

  it('skips stage stories with the reason when no stage server answers', () => {
    const p = plan(all, { mode: 'local', stage: false });
    expect(p.skipped.map((s) => [s.story.id, s.why])).toEqual([['c', 'no stage server answers'], ['d', 'no stage server answers']]);
  });

  it('skips browser stories in a run without a browser', () => {
    const p = plan(all, { mode: 'no-browser', stage: true });
    expect(ids(p.virtual)).toEqual(['a', 'c']);
    expect(p.skipped.map((s) => [s.story.id, s.why])).toEqual([['b', 'needs a browser'], ['d', 'needs a browser']]);
  });

  it('plays everything in the browser in the run for main', () => {
    const p = plan(all, { mode: 'browser-all', stage: false });
    expect(ids(p.browser)).toEqual(['a', 'b']);
    expect(p.virtual).toEqual([]);
  });

  it('leaves out a story that is not a test, in every run', () => {
    const notATest = { ...story('e'), tags: ['dev'] };
    for (const mode of ['local', 'no-browser', 'browser-all'] as const) {
      const p = plan([notATest], { mode, stage: true });
      expect(p.skipped.map((s) => [s.story.id, s.why])).toEqual([['e', 'not a test (tagged !test)']]);
    }
  });

  it('matches a prefix of a story id or of a title', () => {
    const list = [{ ...story('core-text--one'), title: 'Core/Text' }, { ...story('music-seek--one'), title: 'Music/Seek' }];
    expect(ids(matching(list, ['core-']))).toEqual(['core-text--one']);
    expect(ids(matching(list, ['Music/']))).toEqual(['music-seek--one']);
    expect(matching(list, [])).toHaveLength(2);
  });
});

describe('zen-stories', () => {
  it('plays a project with no browser stories without starting a browser', async () => {
    // An empty browser folder: had the runner reached for a browser, it would have failed.
    const r = await stories(['--no-browser', 'fixture-plain'], { PLAYWRIGHT_BROWSERS_PATH: noBrowsers });
    expect(r.output).toMatch(/^pass {2}Fixture\/Plain \/ Passes {2}\(\d+\.\d s\)$/m);
    expect(r.output).toMatch(/^pass {2}Fixture\/Plain \/ Renders Only/m);
    expect(last(r)).toBe('2 passed on the virtual DOM, 0 in the browser, 0 skipped, 0 failed');
    expect(r.code).toBe(0);
  }, 60000);

  it('lists a play that throws on the virtual DOM as FAIL with what it threw, and exits 1', async () => {
    const r = await stories(['--no-browser', 'Fixture/Failing']);
    expect(r.output).toMatch(/^FAIL {2}Fixture\/Failing \/ Play Throws/m);
    expect(r.output).toContain('this play throws on purpose');
    expect(r.code).toBe(1);
  }, 60000);

  it('skips and counts browser and stage stories on a pull request, and passes when the rest pass', async () => {
    const r = await stories(['--no-browser', 'fixture-plain', 'fixture-measured', 'fixture-canvas', 'fixture-staged']);
    expect(r.output).not.toMatch(/Needs Layout|Draws|On The Stage/);
    expect(r.output).toContain('skipped 3: needs a browser');
    expect(r.output).toContain('skipped 1: no stage server answers');
    expect(last(r)).toBe('3 passed on the virtual DOM, 0 in the browser, 4 skipped, 0 failed');
    expect(r.code).toBe(0);
  }, 60000);

  it('plays at most two stories at a time by default', async () => {
    const dir = mkdtempSync(join(scratch, 'busy-'));
    const r = await stories(['--no-browser', 'fixture-plain', 'fixture-measured', 'fixture-real', 'fixture-failing'], { ZEN_FIXTURE_BUSY_DIR: dir });
    const seen = readFileSync(join(dir, 'seen'), 'utf8').trim().split('\n').map(Number);
    expect(seen).toHaveLength(4);
    expect(Math.max(...seen)).toBe(2);
    expect(r.output).toMatch(/4 passed on the virtual DOM/);
  }, 60000);

  it('reports the virtual-DOM stories and names the install command when the headless shell is missing', async () => {
    const r = await stories(['--url', served.url, 'fixture-measured'], { PLAYWRIGHT_BROWSERS_PATH: noBrowsers });
    expect(r.output).toMatch(/^pass {2}Fixture\/Measured \/ Renders/m);
    expect(r.output).toMatch(/^not played {2}Fixture\/Measured \/ Needs Layout$/m);
    expect(r.output).toContain('npx playwright install --only-shell chromium');
    expect(r.code).not.toBe(0);
  }, 60000);

  it('plays tagged stories and tagged files in the headless shell and the rest on the virtual DOM', async ({ skip }) => {
    if (!shell) skip();
    const r = await stories(['--url', served.url, 'fixture-plain', 'fixture-measured', 'fixture-canvas']);
    expect(r.output).toMatch(/^pass {2}Fixture\/Measured \/ Needs Layout {2}\(\d+\.\d s\) {2}\[browser\]$/m);
    expect(r.output).toMatch(/^pass {2}Fixture\/Canvas \/ Draws Red .*\[browser\]$/m);
    expect(r.output).toMatch(/^pass {2}Fixture\/Canvas \/ Draws Again .*\[browser\]$/m);
    expect(r.output).toMatch(/^pass {2}Fixture\/Measured \/ Renders {2}\(\d+\.\d s\)$/m);
    expect(last(r)).toBe('3 passed on the virtual DOM, 3 in the browser, 0 skipped, 0 failed');
    expect(r.code).toBe(0);
  }, 90000);

  it('plays every story in the headless shell against a built Storybook, and fails for one that only breaks there', async ({ skip }) => {
    if (!shell) skip();
    const r = await stories(['--browser-all', '--static', built, 'fixture-plain', 'fixture-measured', 'fixture-real']);
    expect(r.output).toMatch(/^pass {2}Fixture\/Plain \/ Passes .*\[browser\]$/m);
    expect(r.output).toMatch(/^pass {2}Fixture\/Measured \/ Renders .*\[browser\]$/m);
    expect(r.output).toMatch(/^FAIL {2}Fixture\/Real only \/ Breaks In A Browser .*\[browser\]$/m);
    expect(r.output).toContain('this play only breaks in a real browser');
    expect(last(r)).toBe('0 passed on the virtual DOM, 4 in the browser, 0 skipped, 1 failed');
    expect(r.code).toBe(1);
  }, 90000);
});
