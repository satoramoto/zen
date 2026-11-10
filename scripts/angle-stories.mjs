// Explicit registered preview only; this runner never starts a server.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base = process.env.ANGLE_PREVIEW_URL;
assert.ok(base, 'Set ANGLE_PREVIEW_URL to the registered Storybook URL');
const output = process.env.ANGLE_ARTIFACTS ?? '.shots/angles';
await mkdir(output, { recursive: true });
const index = await (await fetch(new URL('index.json', base))).json();
const stories = Object.values(index.entries).filter((entry) => entry.type === 'story' && /^math-trig-(signedturn|radiusstrips)--/.test(entry.id));
assert.ok(stories.length >= 2, 'Expected signed-turn stories');
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const story of stories) for (const width of [390, 1440]) for (const theme of ['textbook-console', 'textbook-blueprint']) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.addInitScript(() => {
      window.__angleEvents = [];
      let channel;
      Object.defineProperty(window, '__STORYBOOK_ADDONS_CHANNEL__', { configurable: true, get: () => channel, set: (value) => {
        channel = value;
        for (const name of ['storyFinished', 'storyThrewException', 'playFunctionThrewException']) value.on(name, (event) => window.__angleEvents.push({ name, status: event?.status, message: event?.message }));
      } });
    });
    await page.goto(new URL(`iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme};mode:dark`, base).href);
    await page.waitForFunction(() => window.__angleEvents.some((event) => event.name === 'storyFinished'), {}, { timeout: 45000 });
    const events = await page.evaluate(() => window.__angleEvents);
    assert.ok(events.every((event) => event.name === 'storyFinished' && event.status === 'success'), JSON.stringify(events));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow ${width}`);
    if (story.id.endsWith('--cross-the-boundary')) {
      const input = page.getByRole('spinbutton');
      await input.fill('359');
      const svg = page.locator('.zen-signed-turn svg');
      const point = async (degrees) => svg.evaluate((node, angle) => {
        const r = angle * Math.PI / 180;
        const p = new DOMPoint(160 + 320 / 2.8 * Math.cos(r), 160 - 320 / 2.8 * Math.sin(r)).matrixTransform(node.getScreenCTM());
        return { x: p.x, y: p.y };
      }, degrees);
      const from = await point(359);
      const to = await point(10);
      await page.mouse.move(from.x, from.y); await page.mouse.down();
      await page.mouse.move(to.x, to.y, { steps: 12 }); await page.mouse.up();
      const total = Number(await page.locator('[data-total]').getAttribute('data-total'));
      assert.ok(Math.abs(total - 370) < 0.1, `pointer total ${total}`);
    }
    assert.deepEqual(errors, []);
    await page.screenshot({ path: `${output}/${story.id}-${width}-${theme}.png`, fullPage: true });
    results.push({ story: story.id, width, theme, events, errors });
    console.log('PASS', story.id, width, theme);
    await page.close();
  }
} finally {
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
  await browser.close();
}
