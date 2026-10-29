// Real Storybook browser plays, not a unit suite. Uses an already-running server only.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({ allowPositionals: true, options: {
  help: { type: 'boolean', short: 'h' },
  list: { type: 'boolean' },
  id: { type: 'string', multiple: true },
  prefix: { type: 'string', multiple: true },
  renderer: { type: 'string' },
  workers: { type: 'string' },
  timeout: { type: 'string' },
  retries: { type: 'string' },
  url: { type: 'string' },
  output: { type: 'string' },
} });
if (values.help) {
  console.log(`Usage: node scripts/music-stories.mjs [story-id-or-prefix ...] [options]
  --id ID[,ID]        Exact story IDs (repeatable); MUSIC_STORY_IDS / MUSIC_STORY_ID
  --prefix PREFIX    ID or Music/ title prefix (repeatable); MUSIC_STORY_PREFIX
  --renderer MODE    both (default), react, or svelte; MUSIC_RENDERER
  --workers N        Independent contexts, 1–4 (default 3); MUSIC_STORY_WORKERS
  --timeout MS       Per-navigation/play deadline (default 45000); MUSIC_STORY_TIMEOUT
  --retries N        Fresh-context retries (default 1); MUSIC_STORY_RETRIES
  --url URL          Existing Storybook (default http://127.0.0.1:6023); MUSIC_PREVIEW_URL
  --output DIR       JSON and failure screenshots (default .shots/music); MUSIC_ARTIFACTS
  --list             List selected story IDs without launching a browser
All runs use theme:mixflow;mode:dark. React-only stories never run a Svelte play.
No play is added to FourDecks; no-play stories are reported as render-only.`);
  process.exit(0);
}

const split = (items) => items.flatMap((item) => item.split(',')).map((item) => item.trim()).filter(Boolean);
const ids = split([...(values.id ?? []), process.env.MUSIC_STORY_IDS ?? process.env.MUSIC_STORY_ID ?? '']);
const prefixes = split([...(values.prefix ?? []), ...positionals, process.env.MUSIC_STORY_PREFIX ?? '']);
const rendererMode = values.renderer ?? process.env.MUSIC_RENDERER ?? 'both';
const number = (value, fallback, min, max) => {
  const result = Number(value ?? fallback);
  if (!Number.isInteger(result) || result < min || result > max) throw new Error(`Expected an integer in ${min}–${max}, got ${value}`);
  return result;
};
const workers = number(values.workers ?? process.env.MUSIC_STORY_WORKERS, 3, 1, 4);
const timeout = number(values.timeout ?? process.env.MUSIC_STORY_TIMEOUT, 45000, 1000, 600000);
const retries = number(values.retries ?? process.env.MUSIC_STORY_RETRIES, 1, 0, 5);
if (!['both', 'react', 'svelte'].includes(rendererMode)) throw new Error(`Unknown renderer: ${rendererMode}`);
const base = values.url ?? process.env.MUSIC_PREVIEW_URL ?? 'http://127.0.0.1:6023';
const output = resolve(values.output ?? process.env.MUSIC_ARTIFACTS ?? '.shots/music');
const startedAt = new Date().toISOString();
const runId = startedAt.replace(/[:.]/g, '-');
const indexResponse = await fetch(new URL('/index.json', base), { signal: AbortSignal.timeout(timeout) });
if (!indexResponse.ok) throw new Error(`Story index: HTTP ${indexResponse.status}`);
const index = await indexResponse.json();
const music = Object.values(index.entries).filter((entry) => entry.type === 'story' && entry.title.startsWith('Music/'));
for (const id of ids) if (!music.some((entry) => entry.id === id)) throw new Error(`No Music story with ID ${id}`);
for (const prefix of prefixes) if (!music.some((entry) => entry.id.startsWith(prefix) || entry.title.startsWith(prefix))) throw new Error(`No Music stories matching ${prefix}`);
const selected = music.filter((entry) => !ids.length && !prefixes.length || ids.includes(entry.id) || prefixes.some((prefix) => entry.id.startsWith(prefix) || entry.title.startsWith(prefix)))
  .sort((a, b) => a.id.localeCompare(b.id));
if (!selected.length) throw new Error('No Music stories selected');
if (values.list) {
  console.log(selected.map(({ id, title, name }) => `${id}\t${title} / ${name}`).join('\n'));
  process.exit(0);
}
await mkdir(output, { recursive: true });

// Install before Storybook creates its channel: polling after navigation misses fast failures.
// In Storybook 10 even a render exception can be followed by storyFinished:success.
function installObserver() {
  const state = window.__MUSIC_STORY_RUN__ = { events: [], rejections: [], lastEventAt: Date.now(), attached: false };
  const clip = (text) => String(text).slice(0, 30000);
  const serialize = (value, depth = 0, seen = new WeakSet()) => {
    if (value == null || typeof value === 'boolean' || typeof value === 'number') return value;
    if (typeof value === 'string') return clip(value);
    if (typeof value !== 'object') return clip(value);
    if (seen.has(value)) return '[circular]';
    seen.add(value);
    if (value instanceof Error) return { name: value.name, message: clip(value.message), stack: clip(value.stack) };
    if (depth > 6) return clip(value);
    if (Array.isArray(value)) return value.slice(0, 40).map((item) => serialize(item, depth + 1, seen));
    return Object.fromEntries(Object.entries(value).slice(0, 40).map(([key, item]) => [key, serialize(item, depth + 1, seen)]));
  };
  window.addEventListener('unhandledrejection', (event) => state.rejections.push(serialize(event.reason)));
  const types = ['storyRenderPhaseChanged', 'storyFinished', 'storyRendered', 'storyThrewException',
    'storyErrored', 'playFunctionThrewException', 'unhandledErrorsWhilePlaying', 'storyMissing',
    'configError', 'storyHotUpdated', 'storyIndexInvalidated'];
  const attached = new WeakSet();
  const attach = (channel) => {
    if (!channel?.on || attached.has(channel)) return;
    attached.add(channel);
    state.attached = true;
    for (const type of types) channel.on(type, (...args) => {
      // A11y report bodies can contain the complete DOM. Keep status/failures, not passing bodies.
      if (type === 'storyFinished') args = args.map(({ reporters, ...rest }) => ({ ...rest,
        reporters: reporters?.map(({ type, status, ...report }) => ({ type, status,
          ...(status === 'failed' ? { details: serialize(report) } : {}),
        })),
      }));
      state.lastEventAt = Date.now();
      state.events.push({ type, at: state.lastEventAt, args: serialize(args) });
    });
  };
  let channel = window.__STORYBOOK_ADDONS_CHANNEL__;
  attach(channel);
  Object.defineProperty(window, '__STORYBOOK_ADDONS_CHANNEL__', {
    configurable: true, get: () => channel, set: (next) => { channel = next; attach(next); },
  });
}

function snapshot(storyId) {
  const state = window.__MUSIC_STORY_RUN__;
  const render = window.__STORYBOOK_PREVIEW__?.storyRenders?.find((item) => item.id === storyId);
  const story = render?.story;
  let globals;
  try { globals = render?.storyContext().globals; } catch { /* Failed preparation has no context. */ }
  return {
    attached: state?.attached ?? false,
    events: state?.events ?? [],
    rejections: state?.rejections ?? [],
    phase: render?.phase ?? null,
    renderId: render?.renderId ?? null,
    metadata: story ? {
      hasPlay: typeof story.playFunction === 'function',
      supportsSvelte: Boolean(story.parameters?.svelte),
      svelteKind: story.parameters?.svelte?.view ? 'treeStory' : story.parameters?.svelte?.component ? 'fixture' : null,
      autoplay: render.renderOptions.autoplay,
      globals: globals ? { theme: globals.theme, mode: globals.mode, renderer: globals.renderer } : null,
    } : null,
    errorDisplay: document.body.classList.contains('sb-show-errordisplay')
      ? document.querySelector('.sb-errordisplay')?.textContent?.slice(0, 6000) ?? 'Storybook error display visible' : null,
    viteError: document.querySelector('vite-error-overlay')?.shadowRoot?.textContent?.slice(0, 6000) ?? null,
  };
}

const exceptionTypes = new Set(['storyThrewException', 'storyErrored', 'playFunctionThrewException',
  'unhandledErrorsWhilePlaying', 'storyMissing', 'configError']);
const delay = (ms) => new Promise((done) => setTimeout(done, ms));
const browser = await chromium.launch({ headless: true });
async function attempt(story, renderer, attemptNumber, probe = false) {
  const start = Date.now();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1,
    colorScheme: 'dark', reducedMotion: 'reduce' });
  const page = await context.newPage();
  const pageErrors = [], consoleErrors = [], networkErrors = [], hmr = [];
  const record = (value) => ({ at: Date.now(), ...value });
  page.on('pageerror', (error) => pageErrors.push(record({ message: error.message, stack: error.stack })));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(record({ text: message.text().slice(0, 30000), location: message.location() }));
  });
  page.on('response', (response) => {
    if (response.status() >= 400) networkErrors.push(record({ status: response.status(), url: response.url(), resourceType: response.request().resourceType() }));
  });
  page.on('requestfailed', (request) => {
    // Navigation/HMR may cancel requests; retain those diagnostically, not as a separate failure.
    networkErrors.push(record({ url: request.url(), resourceType: request.resourceType(), error: request.failure()?.errorText }));
  });
  page.on('websocket', (socket) => socket.on('framereceived', ({ payload }) => {
    try {
      const message = JSON.parse(String(payload));
      if (['update', 'full-reload', 'error', 'prune'].includes(message.type)) hmr.push(record({ type: message.type,
        paths: message.updates?.map((item) => item.path), error: message.err?.message }));
    } catch { /* Storybook's channel transport isn't a Vite message. */ }
  }));
  await page.addInitScript(installObserver);
  const url = new URL('/iframe.html', base);
  url.searchParams.set('id', story.id);
  url.searchParams.set('viewMode', 'story');
  url.searchParams.set('globals', `theme:mixflow;mode:dark;renderer:${renderer}`);
  if (probe) url.searchParams.set('embed', 'true'); // Metadata discovery only; never run a React play for a Svelte-only rerun.
  let waitError = null;
  let observed = null;
  try {
    await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout });
    await page.waitForFunction((storyId) => {
      const state = window.__MUSIC_STORY_RUN__;
      const render = window.__STORYBOOK_PREVIEW__?.storyRenders?.find((item) => item.id === storyId);
      if (render?.phase === 'finished' && state?.events.some((event) => event.type === 'storyFinished' && event.args[0]?.storyId === storyId)) return true;
      const failed = state?.events.some((event) => ['storyThrewException', 'storyErrored', 'storyMissing', 'configError'].includes(event.type));
      return failed && (!render || render.phase === 'errored') && Date.now() - state.lastEventAt > 300;
    }, story.id, { timeout, polling: 50 });
    // Catch microtask/lifecycle errors just after play/afterEach, not just a rendered root.
    await page.waitForTimeout(300);
  } catch (error) { waitError = error.message; }
  try { observed = await page.evaluate(snapshot, story.id); }
  catch (error) { waitError = `${waitError ?? ''}\nSnapshot: ${error.message}`.trim(); }
  const failures = [];
  if (waitError) failures.push({ source: 'runner', message: waitError });
  if (!observed?.attached) failures.push({ source: 'runner', message: 'Storybook channel observer was not attached' });
  for (const event of observed?.events ?? []) {
    if (exceptionTypes.has(event.type)) failures.push({ source: event.type, details: event.args });
    if (event.type === 'storyRenderPhaseChanged' && event.args[0]?.newPhase === 'errored') failures.push({ source: 'renderPhase', message: 'errored' });
    if (event.type === 'storyFinished' && event.args[0]?.status !== 'success') failures.push({ source: 'storyFinished', details: event.args });
  }
  for (const error of pageErrors) failures.push({ source: 'pageerror', ...error });
  for (const error of observed?.rejections ?? []) failures.push({ source: 'unhandledrejection', details: error });
  for (const error of consoleErrors) failures.push({ source: 'console.error', ...error });
  for (const error of networkErrors.filter((item) => item.error !== 'net::ERR_ABORTED')) failures.push({ source: 'network', ...error });
  if (observed?.errorDisplay) failures.push({ source: 'errorDisplay', message: observed.errorDisplay });
  if (observed?.viteError) failures.push({ source: 'viteOverlay', message: observed.viteError });
  if (observed?.phase !== 'finished') failures.push({ source: 'runner', message: `Final phase is ${observed?.phase ?? 'unknown'}, not finished` });
  const metadata = observed?.metadata;
  if (metadata?.globals?.theme !== 'mixflow' || metadata?.globals?.mode !== 'dark' || metadata?.globals?.renderer !== renderer) failures.push({ source: 'globals', details: metadata?.globals });
  if (!probe && metadata?.hasPlay && !observed?.events.some((event) => event.type === 'storyRenderPhaseChanged' && event.args[0]?.newPhase === 'played')) failures.push({ source: 'runner', message: 'Story has a play but no played phase was observed' });
  if (!probe && metadata?.hasPlay && !metadata.autoplay) failures.push({ source: 'runner', message: 'Autoplay was disabled' });
  if (!probe && story.id === 'music-four-deck-mixer--four-decks' && metadata?.hasPlay) failures.push({ source: 'baseline', message: 'FourDecks must remain a no-play screenshot baseline' });
  const affectedByHmr = hmr.length > 0 || observed?.events.some((event) => event.type === 'storyHotUpdated' || event.type === 'storyIndexInvalidated');
  const status = failures.length ? 'fail' : affectedByHmr ? 'interrupted' : 'pass';
  const result = { attempt: attemptNumber, probe, renderer, url: url.href, status, affectedByHmr: Boolean(affectedByHmr),
    durationMs: Date.now() - start, failures, pageErrors, consoleErrors, networkErrors, hmr, ...observed };
  try {
    if (status !== 'pass' && !probe) {
      result.screenshot = `${runId}-${story.id}-${renderer}-${attemptNumber}.png`;
      await page.screenshot({ path: resolve(output, result.screenshot), timeout: 5000 });
    }
  } catch (error) { result.screenshotError = error.message; }
  finally { await context.close(); }
  return result;
}

function errorSummary(result) {
  const failure = result.failures?.find((item) => exceptionTypes.has(item.source)) ?? result.failures?.[0];
  if (!failure) return 'HMR interrupted this attempt';
  const message = failure.message ?? failure.text ?? JSON.stringify(failure.details);
  return `${failure.source}: ${message}`.replace(/\\n|\s+/g, ' ').slice(0, 650);
}
async function runRenderer(story, renderer) {
  const attempts = [];
  for (let n = 0; n <= retries; n++) {
    if (n) await delay(1000); // Back off before a clean context; observed HMR still disqualifies it.
    attempts.push(await attempt(story, renderer, n + 1));
    if (attempts.at(-1).status === 'pass') break;
  }
  const last = attempts.at(-1);
  const status = last.status === 'pass'
    ? attempts.length === 1 ? 'pass' : attempts.slice(0, -1).every((item) => item.affectedByHmr) ? 'pass-after-hmr' : 'flaky'
    : 'fail';
  const result = { renderer, status, coverage: last.metadata ? last.metadata.hasPlay ? 'play' : 'render-only' : 'unknown', attempts };
  console.log(`${status.toUpperCase()} ${renderer.padEnd(6)} ${story.id} [${result.coverage}, ${attempts.reduce((sum, item) => sum + item.durationMs, 0)}ms]${status === 'pass' ? '' : ` ${errorSummary(last.status === 'pass' ? attempts[0] : last)}`}`);
  return result;
}

const results = [];
let cursor = 0;
console.log(`Music stories: ${selected.length}/${music.length}; renderer=${rendererMode}; workers=${workers}; ${base}`);
try {
  await Promise.all(Array.from({ length: Math.min(workers, selected.length) }, async () => {
    while (cursor < selected.length) {
      const story = selected[cursor++];
      const result = { id: story.id, title: story.title, name: story.name, importPath: story.importPath, renderers: [] };
      results.push(result);
      try {
        let metadata;
        if (rendererMode !== 'svelte') {
          const react = await runRenderer(story, 'react');
          result.renderers.push(react);
          metadata = react.attempts.at(-1).metadata;
        } else {
          result.discovery = await attempt(story, 'react', 1, true);
          metadata = result.discovery.metadata;
        }
        result.rendererSupport = metadata ? metadata.supportsSvelte ? 'react+svelte' : 'react-only' : 'unknown';
        result.svelteKind = metadata?.svelteKind ?? null;
        if (rendererMode !== 'react') {
          if (metadata?.supportsSvelte) result.renderers.push(await runRenderer(story, 'svelte'));
          else if (metadata) {
            result.svelteSkipped = 'React-only custom/live harness: no parameters.svelte';
            console.log(`REACT-ONLY ${story.id} — Svelte not claimed`);
          } else {
            result.discoveryError = 'Could not determine renderer support; Svelte coverage is unknown';
          }
        }
      } catch (error) {
        // Preserve a report and keep other stories running even if Playwright itself fails.
        result.rendererSupport = 'unknown';
        result.runnerError = { message: error.message, stack: error.stack };
        console.log(`FAIL runner ${story.id} ${error.message.replace(/\s+/g, ' ').slice(0, 650)}`);
      }
    }
  }));
} finally { await browser.close(); }
results.sort((a, b) => a.id.localeCompare(b.id));
const runs = results.flatMap((story) => story.renderers.map((run) => ({ id: story.id, ...run })));
const passed = (run) => ['pass', 'pass-after-hmr'].includes(run.status);
const summary = {
  indexedMusicStories: music.length, selectedStories: selected.length, rendererRuns: runs.length,
  passed: runs.filter(passed).length,
  failed: runs.filter((run) => run.status === 'fail').length,
  flaky: runs.filter((run) => run.status === 'flaky').length,
  recoveredAfterHmr: runs.filter((run) => run.status === 'pass-after-hmr').length,
  playRuns: runs.filter((run) => run.coverage === 'play').length,
  passedPlayRuns: runs.filter((run) => run.coverage === 'play' && passed(run)).length,
  renderOnlyRuns: runs.filter((run) => run.coverage === 'render-only').length,
  passedRenderOnlyRuns: runs.filter((run) => run.coverage === 'render-only' && passed(run)).length,
  unknownCoverageRuns: runs.filter((run) => run.coverage === 'unknown').length,
  reactOnlyStories: results.filter((story) => story.rendererSupport === 'react-only').map((story) => story.id),
  unknownRendererSupport: results.filter((story) => story.rendererSupport === 'unknown').map((story) => story.id),
};
const report = { startedAt, finishedAt: new Date().toISOString(), base, globals: { theme: 'mixflow', mode: 'dark' },
  viewport: { width: 1440, height: 900 }, options: { rendererMode, workers, timeout, retries, ids, prefixes }, summary, results };
const json = `${JSON.stringify(report, null, 2)}\n`;
const reportPath = resolve(output, `stories-${runId}.json`);
await writeFile(reportPath, json);
await writeFile(resolve(output, 'stories-latest.json'), json);
console.log(`\n${summary.passed}/${summary.rendererRuns} passed; ${summary.failed} failed; ${summary.flaky} flaky; ${summary.recoveredAfterHmr} recovered after HMR. Plays: ${summary.playRuns}; render-only: ${summary.renderOnlyRuns}; React-only stories: ${summary.reactOnlyStories.length}.`);
console.log(`JSON: ${reportPath}`);
if (summary.failed || summary.flaky || summary.unknownRendererSupport.length) process.exitCode = 1;
