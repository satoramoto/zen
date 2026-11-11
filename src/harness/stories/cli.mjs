#!/usr/bin/env node
// zen-stories: plays a project's Storybook stories with as little machine as each needs.
//
//   zen-stories [prefix ...]             the virtual DOM, and the browser for `browser` stories
//   zen-stories --no-browser [prefix ...]  the virtual DOM only; `browser` stories are skipped
//   zen-stories --browser-all [prefix ...] every story in the browser, against the served Storybook or a built one
//
//   --workers N      stories played at once (2)
//   --gpu            the browser uses this machine's GPU, for WebGL stories
//   --viewport WxH   the browser's page size (1600x1000), for stories drawn for one screen
//   --retries N      a story that fails is played N more times; one that then passes is flaky (0)
//   --shard I/N      play only the Ith of N even shares of the stories, for N runs side by side
//   --timeout MS     per story (90000)
//   --url URL        the served Storybook, for `browser` and `stage` stories (default: the port of
//                    the project's `storybook` script, when something answers there)
//   --static DIR     the built Storybook `--browser-all` serves when none is served (storybook-static)
//   --config-dir DIR the Storybook config (.storybook)
//   --list           print the stories and where each would be played, and play nothing
//
// A prefix matches a story id or title ("core-primitives", "Core/Primitives"). STORY_FILTER, as the
// scripts this replaces read it, keeps the stories whose id contains its text.
// Tags: `browser` (needs a real browser), `stage` (drawn by the Omarchy stage in Qt).
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

// Storybook's indexer warns that a Node API it uses is deprecated: nothing a reader can act on.
process.noDeprecation = true;
const { matching, plan, shard, storyIndex } = await import('./select.mjs');

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    workers: { type: 'string', default: '2' },
    timeout: { type: 'string', default: '90000' },
    url: { type: 'string' },
    static: { type: 'string', default: 'storybook-static' },
    'config-dir': { type: 'string', default: '.storybook' },
    'no-browser': { type: 'boolean' },
    'browser-all': { type: 'boolean' },
    list: { type: 'boolean' },
    gpu: { type: 'boolean' },
    viewport: { type: 'string', default: '1600x1000' },
    retries: { type: 'string', default: '0' },
    shard: { type: 'string' },
  },
});
if (values['no-browser'] && values['browser-all']) { console.error('--no-browser and --browser-all are two different runs: pick one'); process.exit(2); }

const root = process.cwd();
const configDir = path.resolve(root, values['config-dir']);
if (!fs.existsSync(configDir)) { console.error(`no Storybook here: ${configDir} does not exist`); process.exit(2); }
const mode = values['browser-all'] ? 'browser-all' : values['no-browser'] ? 'no-browser' : 'local';
const workers = Math.max(1, Number(values.workers) || 2);
const timeout = Number(values.timeout) || 90000;
const size = /^(\d+)x(\d+)$/.exec(values.viewport);
if (!size) { console.error(`--viewport is a width and height in pixels, as 1180x820, not ${values.viewport}`); process.exit(2); }
const viewport = { width: Number(size[1]), height: Number(size[2]) };
const retries = Math.max(0, Number(values.retries) || 0);

const answers = async (url, what) => {
  try { const res = await fetch(url, { signal: AbortSignal.timeout(3000) }); return res.ok && (res.headers.get('content-type') ?? '').includes(what); } catch { return false; }
};
// A stage that can run sessions: a dev server answers its route even where Quickshell is missing.
const stageRuns = async (url) => {
  try { const res = await fetch(url, { signal: AbortSignal.timeout(3000) }); return res.ok && (await res.json()).available === true; } catch { return false; }
};

/** The served Storybook: `--url`, STORYBOOK_URL, or whatever answers on the `storybook` script's port. */
async function served() {
  const named = (values.url ?? process.env.STORYBOOK_URL)?.replace(/\/$/, '');
  if (named) return (await answers(`${named}/index.json`, 'json')) ? named : null;
  let script = '';
  try { script = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).scripts?.storybook ?? ''; } catch { /* no package.json */ }
  const port = /(?:--port|-p)[= ]+(\d+)/.exec(script)?.[1];
  if (!port) return null;
  const url = `http://127.0.0.1:${port}`;
  return (await answers(`${url}/index.json`, 'json')) ? url : null;
}

const all = await storyIndex(configDir);
const filter = process.env.STORY_FILTER;
const share = values.shard ? /^(\d+)\/(\d+)$/.exec(values.shard) : null;
if (values.shard && (!share || Number(share[1]) < 1 || Number(share[1]) > Number(share[2]))) { console.error(`--shard is I/N with 1 <= I <= N, as 2/4, not ${values.shard}`); process.exit(2); }
const picked = matching(all, positionals).filter((s) => !filter || s.id.includes(filter));
const stories = share ? shard(picked, Number(share[1]), Number(share[2])) : picked;
if (!stories.length) { console.error(`no stories match ${[...positionals, ...(filter ? [`STORY_FILTER=${filter}`] : [])].join(', ') || '(all)'}`); process.exit(2); }

// The run for main plays against the served Storybook when one answers, else a built one: plays
// are written against the dev server, and a build runs React's production code.
const needsServed = mode === 'browser-all' || stories.some((s) => s.tags?.includes('stage') || (mode === 'local' && s.tags?.includes('browser')));
let base = needsServed || values.url ? await served() : null;
const stage = base ? await stageRuns(`${base}/__omarchy-stage/status`) : false;
const todo = plan(stories, { mode, stage });

const label = (s) => `${s.title} / ${s.name}`;
if (values.list) {
  for (const s of todo.virtual) console.log(`${s.id}\t${label(s)}\tvirtual DOM`);
  for (const s of todo.browser) console.log(`${s.id}\t${label(s)}\tbrowser`);
  for (const { story, why } of todo.skipped) console.log(`${story.id}\t${label(story)}\tskipped: ${why}`);
  process.exit(0);
}

const count = { virtual: 0, browser: 0, failed: 0, unplayed: 0, flaky: 0 };
const report = (where) => (r) => {
  if (r.ok) count[where]++; else count.failed++;
  if (r.flaky) count.flaky++;
  const flaky = r.flaky ? `  flaky: failed ${r.flaky === 1 ? 'once' : `${r.flaky} times`}, then passed` : '';
  console.log(`${r.ok ? 'pass' : 'FAIL'}  ${label(r.story)}  (${(r.ms / 1000).toFixed(1)} s)${where === 'browser' ? '  [browser]' : ''}${flaky}`);
  for (const p of r.problems) console.log(`        ${p.replace(/\\n/g, '\n').replace(/\n/g, '\n        ')}`);
};
const unplayed = (list, why, fix) => {
  for (const s of list) console.log(`not played  ${label(s)}`);
  console.log(`${list.length} ${list.length === 1 ? 'story was' : 'stories were'} not played: ${why}. ${fix}`);
  count.unplayed += list.length;
};

// One pass after the other, so no more than `workers` stories are ever being played.
if (todo.virtual.length) {
  const { playVirtual } = await import('./virtual.mjs');
  try { await playVirtual({ root, configDir, stories: todo.virtual, workers, timeout, stageUrl: stage ? base : null, retries, report: report('virtual') }); } catch (e) {
    console.error(e.message);
    process.exit(2);
  }
}
if (todo.browser.length) {
  const { playInBrowser, serveBuilt } = await import('./browser.mjs');
  let built = null;
  if (!base && mode === 'browser-all') {
    const dir = path.resolve(root, values.static);
    if (fs.existsSync(path.join(dir, 'index.json'))) { built = await serveBuilt(dir); base = built.url; }
    else unplayed(todo.browser, `no built Storybook in ${values.static}`, 'Build it first, or name a served one with --url.');
  } else if (!base) unplayed(todo.browser, 'no Storybook is being served for them', 'Start the project\'s Storybook, or name one with --url.');
  if (base) {
    const not = await playInBrowser({ base, stories: todo.browser, workers, timeout, gpu: values.gpu, viewport, retries, report: report('browser') });
    if (not) unplayed(todo.browser, not.why, `Run: ${not.fix}`);
  }
  await built?.close();
}

const reasons = new Map();
for (const { why } of todo.skipped) reasons.set(why, (reasons.get(why) ?? 0) + 1);
for (const [why, n] of reasons) console.log(`skipped ${n}: ${why}`);
console.log(`\n${count.virtual} passed on the virtual DOM, ${count.browser} in the browser, ${todo.skipped.length} skipped, ${count.failed} failed${count.unplayed ? `, ${count.unplayed} not played` : ''}${count.flaky ? `, ${count.flaky} flaky` : ''}`);
process.exit(count.failed || count.unplayed ? 1 : 0);
