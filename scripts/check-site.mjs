// Bounded static-build browser verification. Owns and closes its ephemeral test server.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import assert from 'node:assert/strict';
import { parseArgs } from 'node:util';
import { execFileSync } from 'node:child_process';

const { values } = parseArgs({ options: {
  dir: { type: 'string', default: 'fixtures/site/dist' },
  base: { type: 'string', default: '/project/' },
  output: { type: 'string', default: '.shots/site' },
  stories: { type: 'string' },
  'manual-evidence': { type: 'string' },
} });
const root = resolve(values.dir);
const base = values.base;
const output = resolve(values.output);
await mkdir(output, { recursive: true });
const server = createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const story = values.stories && path.startsWith('/stories/');
    const folder = story ? resolve(values.stories) : root;
    const prefix = story ? '/stories/' : base;
    if (!path.startsWith(prefix)) throw new Error('wrong base');
    let file = resolve(folder, path.slice(prefix.length));
    if (file !== folder && !file.startsWith(folder + sep)) throw new Error('outside root');
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
    response.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
    response.end(await readFile(file));
  } catch { response.statusCode = 404; response.end('Not found'); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + base);
    await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
    const links = await page.getByRole('navigation', { name: 'Documentation', exact: true }).getByRole('link').evaluateAll(nodes => nodes.map(node => node.href));
    for (const link of links) {
      await page.goto(link);
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.locator('a[aria-current="page"]').count(), 1);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Overflow at ${width}: ${link}`);
      const resources = await page.locator('a[href],img[src],script[src],link[href]').evaluateAll(nodes => nodes.map(node => node.href || node.src));
      for (const resource of resources.filter(url => url.startsWith(origin))) {
        assert(new URL(resource).pathname.startsWith(base), `Lost project base: ${resource}`);
        assert.equal((await page.request.get(resource)).status(), 200, resource);
      }
    }
    await page.goto(origin + base + 'architecture/');
    await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
    const chart = page.getByRole('figure', { name: 'From input to frame' });
    await chart.locator('[data-part="cord"]').first().waitFor({ state: 'attached' });
    assert.equal(await chart.locator('[data-part="cord"]').count(), 2);
    await chart.getByRole('button', { name: 'Fit diagram' }).click();
    const zoom = () => chart.locator('.lib-graph').evaluate(node => Number(node.style.getPropertyValue('--lib-graph-zoom')));
    const initial = await zoom();
    await chart.getByRole('button', { name: 'Zoom in', exact: true }).focus();
    await page.keyboard.press('Enter');
    assert(await zoom() > initial);
    await chart.getByRole('button', { name: 'Fit diagram' }).click();
    await chart.screenshot({ path: `${output}/flowchart-${width}.png` });
    const search = page.getByRole('region', { name: 'Documentation search' });
    await search.getByRole('searchbox').fill('ownership');
    await search.getByRole('link', { name: /architecture/i }).first().waitFor();
    await page.keyboard.press('Tab');
    assert(await search.getByRole('link').first().evaluate(node => node === document.activeElement));
    await page.screenshot({ path: `${output}/${width}.png`, fullPage: true });
    assert.deepEqual(errors, []);
    await page.close();
  }
  const noJS = await browser.newPage({ javaScriptEnabled: false });
  await noJS.goto(origin + base + 'architecture/');
  assert.match(await noJS.locator('main').innerText(), /ownership/i);
  assert.match(await noJS.locator('main').innerText(), /Input → State machine: action/);
  assert(await noJS.getByRole('navigation', { name: 'Documentation', exact: true }).isVisible());
  await noJS.close();
  if (values.stories) {
    const index = JSON.parse(await readFile(resolve(values.stories, 'index.json'), 'utf8'));
    const stories = Object.values(index.entries).filter(entry => entry.type === 'story' && ['Site/Documentation', 'Site/Flowchart'].includes(entry.title));
    assert.equal(stories.length, 7);
    for (const story of stories) {
      const page = await browser.newPage();
      await page.addInitScript(() => {
        window.__siteEvents = [];
        let channel;
        Object.defineProperty(window, '__STORYBOOK_ADDONS_CHANNEL__', { configurable: true,
          get: () => channel, set: value => {
            channel = value;
            for (const type of ['storyFinished', 'storyThrewException', 'storyErrored', 'playFunctionThrewException']) {
              channel.on(type, result => window.__siteEvents.push({ type, status: result?.status ?? 'error' }));
            }
          },
        });
      });
      await page.goto(`${origin}/stories/iframe.html?id=${story.id}&viewMode=story&globals=theme:textbook-console;mode:dark`);
      await page.waitForFunction(() => window.__siteEvents.some(event => event.type === 'storyFinished'), { timeout: 30000 });
      const events = await page.evaluate(() => window.__siteEvents);
      assert(events.some(event => event.type === 'storyFinished' && event.status === 'success'), JSON.stringify(events));
      assert(!events.some(event => event.type !== 'storyFinished'), JSON.stringify(events));
      console.log(`PASS ${story.id}`);
      await page.close();
    }
  }
  console.log('Static docs: project-base links, reference/asset requests, search keyboard access, no-JS reading and 1440/390px layout PASS');
  if (values['manual-evidence']) {
    execFileSync(process.execPath, ['scripts/check-manual-stories.mjs', '--stories', values.stories ?? 'storybook-static', '--evidence', values['manual-evidence'], '--preview', root], { stdio: 'inherit' });
  }
} finally {
  await browser.close();
  await new Promise(done => server.close(done));
}
