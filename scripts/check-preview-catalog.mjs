// Browser evidence for the catalog removal. Uses the managed Storybook; the root
// document is served by a short-lived HTTP fixture on an OS-assigned free port.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.STORYBOOK_URL ?? 'http://127.0.0.1:6006';
const baseline = process.argv.includes('--baseline');
const output = '.shots/remove-field-guide';
await mkdir(output, { recursive: true });
const index = await (await fetch(`${base}/index.json`)).json();
const entries = Object.values(index.entries);
const retired = /^(Overview|Thinking with Type|Grid Systems|Interaction of Color|Refactoring UI|On Web Typography|Practical Typography)(\/|$)/;
const ids = entries.filter(entry => !retired.test(entry.title) && !entry.title.startsWith('Development/Preview catalog')).map(entry => entry.id).sort();
if (baseline) await writeFile(`${output}/catalog-before.json`, JSON.stringify(ids, null, 2));
else {
  assert.deepEqual(ids, JSON.parse(await readFile(`${output}/catalog-before.json`, 'utf8')));
  assert.equal(entries.filter(entry => retired.test(entry.title)).length, 0);
  const built = Object.values(JSON.parse(await readFile('storybook-static/index.json', 'utf8')).entries);
  assert.equal(built.filter(entry => retired.test(entry.title)).length, 0);
  assert.deepEqual(built.filter(entry => !entry.title.startsWith('Development/Preview catalog')).map(entry => entry.id).sort(), ids);
}
const browser = await chromium.launch({ headless: true });
const server = createServer(async (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(await readFile(baseline ? 'index.html' : 'dist/index.html'));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
try {
  const page = await browser.newPage();
  await page.addInitScript(() => {
    window.__previewErrors = [];
    let channel;
    Object.defineProperty(window, '__STORYBOOK_ADDONS_CHANNEL__', {
      configurable: true, get: () => channel,
      set: value => {
        channel = value;
        for (const event of ['playFunctionThrewException', 'storyThrewException', 'storyErrored']) {
          value.on(event, error => window.__previewErrors.push(String(error?.message ?? error)));
        }
      },
    });
  });
  for (const title of ['Core/Components/Button', 'Harness/Claude Code/Kit']) {
    const entry = entries.find(entry => entry.type === 'story' && entry.title.startsWith(title));
    assert.ok(entry, `Missing specimen: ${title}`);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${base}/iframe.html?id=${entry.id}&viewMode=story`);
      await page.waitForFunction(() => document.querySelector('#storybook-root')?.childElementCount > 0);
      await page.waitForFunction(() => window.__STORYBOOK_PREVIEW__?.currentRender?.phase === 'finished');
      await page.evaluate(() => document.fonts.ready);
      assert.deepEqual(await page.evaluate(() => window.__previewErrors), [], entry.id);
      await page.screenshot({ path: `${output}/${baseline ? 'before' : 'after'}-${title.startsWith('Harness') ? 'harness' : 'button'}-${width}.png`, fullPage: true });
    }
  }
  const results = [];
  for (const entry of entries.filter(entry => entry.type === 'story' && entry.title === 'Development/Preview catalog')) {
    await page.goto(`${base}/iframe.html?id=${entry.id}&viewMode=story&rootPreview=${encodeURIComponent(`http://127.0.0.1:${server.address().port}`)}`);
    await page.waitForFunction(() => window.__STORYBOOK_PREVIEW__?.currentRender?.phase === 'finished');
    const errors = await page.evaluate(() => {
      const render = window.__STORYBOOK_PREVIEW__.currentRender;
      return { played: render.story?.playFunction != null, errors: window.__previewErrors };
    });
    assert.ok(errors.played, `Missing play: ${entry.id}`);
    results.push({ id: entry.id, ...errors });
    if (!baseline) assert.deepEqual(errors.errors, [], entry.id);
  }
  assert.equal(results.length, 2);
  if (baseline) assert.ok(results.every(result => result.errors.length > 0), 'Both scenarios must fail before removal');
  else {
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.getByRole('heading', { name: 'Zen', exact: true }).waitFor();
    assert.equal(await page.getByText('The interactive field guide has been retired.').count(), 1);
    assert.equal(await page.locator('script, .field-guide, .book-nav').count(), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `${output}/root-390.png` });
  }
  await writeFile(`${output}/${baseline ? 'baseline' : 'verification'}.json`, JSON.stringify({ preservedIds: ids.length, results }, null, 2));
  console.log(`PASS ${baseline ? 'baseline (expected failing plays)' : 'removal'}: ${ids.length} maintained IDs; two scenario plays; desktop and phone specimens`);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
