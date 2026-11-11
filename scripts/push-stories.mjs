// Plays the Push area's stories in a real browser, with each renderer, against a Storybook that is
// already served. A story passes when Storybook says it finished without an error.
//
//   node scripts/push-stories.mjs [title-or-id-prefix ...] [--url http://localhost:6006] [--renderer both|react|svelte] [--workers 4] [--theme push-3] [--mode dark] [--reduced-motion]
import { chromium } from 'playwright';
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({ allowPositionals: true, options: { url: { type: 'string' }, renderer: { type: 'string' }, workers: { type: 'string' }, theme: { type: 'string' }, mode: { type: 'string' }, 'reduced-motion': { type: 'boolean' }, timeout: { type: 'string' }, list: { type: 'boolean' } } });
const base = values.url ?? process.env.PUSH_PREVIEW_URL ?? 'http://localhost:6006';
const renderers = (values.renderer ?? 'both') === 'both' ? ['react', 'svelte'] : [values.renderer];
const workers = Number(values.workers ?? 4);
const timeout = Number(values.timeout ?? 45000);
const theme = values.theme ?? 'push-3';
const mode = values.mode ?? 'dark';

const index = await (await fetch(new URL('/index.json', base))).json();
const all = Object.values(index.entries).filter((e) => e.type === 'story' && e.title.startsWith('Push/'));
const selected = all.filter((e) => !positionals.length || positionals.some((p) => e.id.startsWith(p) || e.title.startsWith(p))).sort((a, b) => a.id.localeCompare(b.id));
if (!selected.length) throw new Error('No Push stories selected');
if (values.list) { console.log(selected.map((e) => `${e.id}\t${e.title} / ${e.name}`).join('\n')); process.exit(0); }

function observe() {
  const state = (window.__RUN__ = { events: [] });
  const types = ['storyFinished', 'storyThrewException', 'storyErrored', 'playFunctionThrewException', 'storyMissing', 'configError', 'unhandledErrorsWhilePlaying'];
  const attach = (channel) => { if (channel?.on && !channel.__seen) { channel.__seen = true; for (const type of types) channel.on(type, (arg) => state.events.push({ type, status: arg?.status, message: String(arg?.message ?? arg?.description ?? arg?.[0]?.message ?? '').slice(0, 1500) })); } };
  let channel = window.__STORYBOOK_ADDONS_CHANNEL__;
  attach(channel);
  Object.defineProperty(window, '__STORYBOOK_ADDONS_CHANNEL__', { configurable: true, get: () => channel, set: (next) => { channel = next; attach(next); } });
}

const browser = await chromium.launch();
async function play(story, renderer) {
  const context = await browser.newContext({ viewport: { width: 1400, height: 1250 }, colorScheme: mode === 'light' ? 'light' : 'dark', reducedMotion: values['reduced-motion'] ? 'reduce' : 'no-preference' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(observe);
  const url = `${base}/iframe.html?id=${story.id}&viewMode=story&globals=${encodeURIComponent(`theme:${theme};mode:${mode};renderer:${renderer}`)}`;
  let problem = '';
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
    await page.waitForFunction(() => window.__RUN__?.events.some((e) => e.type === 'storyFinished' || e.type === 'storyErrored' || e.type === 'storyMissing' || e.type === 'configError'), null, { timeout, polling: 50 });
    const events = await page.evaluate(() => window.__RUN__.events);
    const bad = events.find((e) => e.type !== 'storyFinished' || e.status !== 'success');
    if (bad) problem = `${bad.type}${bad.status ? ` (${bad.status})` : ''}: ${events.map((e) => e.message).filter(Boolean).join(' | ')}`;
  } catch (error) { problem = `runner: ${error.message.split('\n')[0]}`; }
  if (!problem && errors.length) problem = `page error: ${errors[0]}`;
  await context.close();
  return problem;
}

const jobs = selected.flatMap((story) => renderers.map((renderer) => ({ story, renderer })));
const failures = [];
let cursor = 0, done = 0;
await Promise.all(Array.from({ length: Math.min(workers, jobs.length) }, async () => {
  while (cursor < jobs.length) {
    const { story, renderer } = jobs[cursor++];
    let problem = await play(story, renderer);
    if (problem) problem = await play(story, renderer); // once more, in a fresh page
    done++;
    if (problem) { failures.push(`${renderer} ${story.id}: ${problem}`); console.log(`FAIL ${renderer.padEnd(6)} ${story.id}\n     ${problem.replace(/\s+/g, ' ').slice(0, 600)}`); }
  }
}));
await browser.close();
console.log(`\n${done - failures.length}/${done} passed (${selected.length} stories, ${renderers.join(' and ')}, ${theme} ${mode}).`);
if (failures.length) process.exitCode = 1;
