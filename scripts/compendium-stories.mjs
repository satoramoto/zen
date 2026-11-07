// The compendium's Entry plays and screenshots against a served Storybook build: node scripts/compendium-stories.mjs [base-url] [shots-dir].
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base = process.env.COMPENDIUM_PREVIEW_URL ?? process.argv[2] ?? 'http://127.0.0.1:6033';
const shots = process.argv[3] ?? '.shots/compendium';
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const id of ['design-os-compendium-entry--entry', 'design-os-compendium-entry--missing-figure']) {
    const p = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    p.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));
    await p.addInitScript(() => {
      let channel;
      window.__plays = [];
      Object.defineProperty(window, '__STORYBOOK_ADDONS_CHANNEL__', {
        configurable: true,
        get: () => channel,
        set: (c) => {
          channel = c;
          for (const name of ['storyFinished', 'storyThrewException', 'playFunctionThrewException'])
            c.on(name, (e) => window.__plays.push({ name, status: e?.status, message: e?.message, }));
        },
      });
    });
    await p.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=theme:linear;mode:dark`);
    await p.waitForFunction(() => window.__plays.some((e) => e.name === 'storyFinished'), {}, { timeout: 45000 });
    const events = await p.evaluate(() => window.__plays);
    console.log(JSON.stringify(events));
    assert.ok(events.every((e) => e.name === 'storyFinished' && e.status === 'success'), JSON.stringify(events));
    assert.deepEqual(errors, []);
    console.log('PASS play', id);
    await p.close();
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  for (const [theme, mode] of [['linear', 'dark'], ['linear', 'light']]) {
    await page.goto(`${base}/iframe.html?id=design-os-compendium-entry--entry&viewMode=story&globals=theme:${theme};mode:${mode}`);
    await page.locator('.cmp-document').waitFor();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${shots}/entry-${mode}.png`, fullPage: true });
  }
  // The peek opens on click.
  await page.getByRole('button', { name: 'overtones' }).click();
  await page.getByRole('dialog', { name: 'Overtone' }).waitFor();
  await page.screenshot({ path: `${shots}/peek.png` });
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`${base}/iframe.html?id=design-os-compendium-entry--entry&viewMode=story&globals=theme:linear;mode:light`);
  await page.locator('.cmp-document').waitFor();
  await page.waitForTimeout(500);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log('narrow overflow px', overflow);
  await page.screenshot({ path: `${shots}/entry-narrow.png`, fullPage: true });
} finally {
  await browser.close();
}
