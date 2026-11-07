// Every Compendium and Math/Fourier story's play against a served Storybook build, then screenshots
// of the books and the entry at wide and narrow widths: node scripts/compendium-stories.mjs [base-url] [shots-dir].
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base = process.env.COMPENDIUM_PREVIEW_URL ?? process.argv[2] ?? 'http://127.0.0.1:6033';
const shots = process.argv[3] ?? '.shots/compendium';
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ headless: true });
let failed = 0;
try {
  const index = await (await fetch(`${base}/index.json`)).json();
  const stories = Object.values(index.entries).filter((e) => e.type === 'story' && (e.title.startsWith('Compendium/') || e.title.startsWith('Math/Fourier/')));
  assert.ok(stories.length > 0, 'no Compendium stories in the build');
  console.log(stories.length, 'Compendium and Fourier stories');
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
    ['compendium-book--fourier', 'fourier'],
    ['compendium-book--harmonic-series', 'book'],
    ['compendium-layout-document--entry', 'entry'],
  ]) {
    for (const mode of ['dark', 'light']) {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=theme:linear;mode:${mode}`);
      await page.locator('.cmp-document').waitFor();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${shots}/${name}-${mode}.png`, fullPage: true });
    }
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=theme:linear;mode:light`);
    await page.locator('.cmp-document').waitFor();
    await page.waitForTimeout(500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    console.log(name, 'narrow overflow px', overflow);
    if (overflow > 0) failed++;
    await page.screenshot({ path: `${shots}/${name}-narrow.png`, fullPage: true });
  }
  // Each Fourier chapter, wide, dark.
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${base}/iframe.html?id=compendium-book--fourier&viewMode=story&globals=theme:linear;mode:dark`);
  await page.locator('.cmp-document').waitFor();
  for (let i = 1; i <= 7; i++) {
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${shots}/fourier-chapter-${i}.png`, fullPage: true });
    const next = page.getByRole('button', { name: /→$/ });
    if ((await next.count()) === 0) break;
    await next.click();
    await page.locator('.cmp-document').waitFor();
  }
  // The overtones chapter with its scrub, and the divergence chapter's exercises.
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${base}/iframe.html?id=compendium-book--linked-quantity&viewMode=story&globals=theme:linear;mode:dark`);
  await page.locator('.cmp-scrub').waitFor();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${shots}/overtones.png`, fullPage: true });
  await page.goto(`${base}/iframe.html?id=compendium-book--progress&viewMode=story&globals=theme:linear;mode:light`);
  await page.locator('.cmp-exercise').first().waitFor();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${shots}/progress.png`, fullPage: true });
} finally {
  await browser.close();
}
if (failed) {
  console.log(failed, 'failed');
  process.exit(1);
}
