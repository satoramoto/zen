import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base = process.env.MATH_PREVIEW_URL ?? 'http://127.0.0.1:6027';
await mkdir('.shots/calculator', { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const story of ['edit-relationships', 'keep-last-valid-drawing', 'animate-and-compare']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => { let channel; window.__plays = []; Object.defineProperty(window, '__STORYBOOK_ADDONS_CHANNEL__', { configurable: true, get: () => channel, set: value => { channel = value; for (const name of ['storyFinished', 'storyThrewException', 'playFunctionThrewException']) value.on(name, event => window.__plays.push({ name, status: event?.status, message: event?.message })); } }); });
    await page.goto(`${base}/iframe.html?id=math-wave-calculator--${story}&viewMode=story&globals=theme:linear;mode:dark`);
    await page.waitForFunction(() => window.__plays.some(event => event.name === 'storyFinished'), {}, { timeout: 45000 });
    const events = await page.evaluate(() => window.__plays);
    assert.ok(events.every(event => event.name === 'storyFinished' && event.status === 'success'), JSON.stringify(events));
    assert.deepEqual(errors, []); console.log('PASS interaction', story); await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await page.goto(`${base}/iframe.html?id=math-wave-calculator--playground&viewMode=story&globals=theme:linear;mode:dark`);
  const a = page.getByRole('slider', { name: 'Parameter a' }); await a.waitFor();
  assert.equal(await page.locator('.zen-calculator__curve').evaluateAll(paths => new Set(paths.map(path => getComputedStyle(path).stroke)).size), 3, 'Each equation must have its own curve color');
  const before = await page.getByLabel('f at probe').textContent();
  const box = await a.boundingBox(); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, { steps: 10 }); await page.mouse.up();
  assert.equal(await a.getAttribute('aria-valuenow'), '2');
  assert.notEqual(await page.getByLabel('f at probe').textContent(), before);
  await page.getByRole('button', { name: 'Pin result', exact: true }).click();
  await a.focus(); await page.keyboard.press('ArrowLeft');
  await page.screenshot({ path: '.shots/calculator/desktop.png', fullPage: true });
  console.log('PASS pointer scrubbing + desktop');
  await page.getByRole('textbox', { name: 'f(x) expression' }).fill('sqrt(-1)');
  assert.equal(await page.getByLabel('f at probe').textContent(), 'undefined');
  assert.equal(await page.getByLabel('h at probe').textContent(), 'undefined');
  await page.getByRole('textbox', { name: 'f(x) expression' }).fill('1/(x-0.017)');
  await page.screenshot({ path: '.shots/calculator/pole.png', fullPage: true });
  await page.getByRole('button', { name: 'Standing wave', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: '.shots/calculator/narrow.png', fullPage: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.getByRole('textbox', { name: 'f(x) expression' }).fill('sin(');
  await page.getByRole('alert').waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.goto(`${base}/iframe.html?id=math-wave-calculator--function-composition&viewMode=story&globals=theme:linear;mode:light`);
  await page.getByRole('slider', { name: 'Parameter a' }).waitFor();
  await page.screenshot({ path: '.shots/calculator/light.png', fullPage: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  console.log('PASS undefined domains + pole + narrow layout + error');
} finally { await browser.close(); }
