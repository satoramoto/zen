// Every Openspec story's play against a served Storybook build, then screenshots of the sample
// and Zen roots at wide and narrow widths: node scripts/openspec-stories.mjs [base-url] [shots-dir].
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base = process.env.OPENSPEC_PREVIEW_URL ?? process.argv[2] ?? 'http://127.0.0.1:6034';
const shots = process.argv[3] ?? '.shots/openspec';
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ headless: true });
let failed = 0;
try {
  const index = await (await fetch(`${base}/index.json`)).json();
  const stories = Object.values(index.entries).filter((e) => e.type === 'story' && e.title.startsWith('Openspec/'));
  assert.ok(stories.length > 0, 'no Openspec stories in the build');
  console.log(stories.length, 'Openspec stories');
  for (const story of stories) {
    const p = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    p.on('console', (m) => m.type() === 'error' && !/favicon/.test(m.text()) && errors.push('console: ' + m.text()));
    await p.addInitScript(() => {
      let channel;
      window.__plays = [];
      Object.defineProperty(window, '__STORYBOOK_ADDONS_CHANNEL__', {
        configurable: true,
        get: () => channel,
        set: (c) => {
          channel = c;
          for (const name of ['storyFinished', 'storyThrewException', 'playFunctionThrewException'])
            c.on(name, (e) => window.__plays.push({ name, status: e?.status, message: e?.message }));
        },
      });
    });
    await p.goto(`${base}/iframe.html?id=${story.id}&viewMode=story&globals=theme:linear;mode:dark`);
    try {
      await p.waitForFunction(() => window.__plays.some((e) => e.name === 'storyFinished'), {}, { timeout: 45000 });
    } catch {
      errors.push('no storyFinished within 45s');
    }
    const events = await p.evaluate(() => window.__plays);
    const ok = events.length > 0 && events.every((e) => e.name === 'storyFinished' && e.status === 'success') && errors.length === 0;
    console.log(ok ? 'PASS' : 'FAIL', story.id, ok ? '' : JSON.stringify({ events, errors }));
    if (!ok) failed++;
    await p.close();
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  for (const [id, name] of [
    ['openspec-components-repo--sample', 'sample'],
    ['openspec-components-repo--zen', 'zen'],
    ['openspec-components-change--active', 'change'],
  ]) {
    for (const mode of ['dark', 'light']) {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=theme:linear;mode:${mode}`);
      await page.locator('.os-doc').first().waitFor();
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${shots}/${name}-${mode}.png`, fullPage: true });
    }
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=theme:linear;mode:light`);
    await page.locator('.os-doc').first().waitFor();
    await page.waitForTimeout(600);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    console.log(name, 'narrow overflow px', overflow);
    if (overflow > 0) failed++;
    await page.screenshot({ path: `${shots}/${name}-narrow.png`, fullPage: true });
  }
} finally {
  await browser.close();
}
if (failed) {
  console.log(failed, 'failed');
  process.exit(1);
}
