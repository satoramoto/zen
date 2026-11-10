// Bounded story verification against actual run evidence and the generated static manual.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { parseArgs } from 'node:util';
import assert from 'node:assert/strict';

const { values } = parseArgs({ options: {
  stories: { type: 'string', default: 'storybook-static' },
  evidence: { type: 'string', default: '.shots/manual-evidence' },
  preview: { type: 'string', default: 'fixtures/site/dist' },
  'expect-missing': { type: 'boolean', default: false },
} });
const root = resolve(values.stories);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let base = root, suffix = path.slice(1);
    for (const [prefix, directory] of [['/manual-evidence/', values.evidence], ['/manual-preview/', values.preview], ['/project/', values.preview]]) {
      if (path.startsWith(prefix)) { base = resolve(directory); suffix = path.slice(prefix.length); break; }
    }
    let file = resolve(base, suffix);
    if (file !== base && !file.startsWith(base + sep)) throw new Error('outside root');
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    file = await realpath(file);
    if (!file.startsWith(await realpath(base) + sep)) throw new Error('outside root');
    response.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
    response.setHeader('Cache-Control', 'no-store');
    response.end(await readFile(file));
  } catch { response.statusCode = 404; response.end('Not found'); }
});
let browser;
try {
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  browser = await chromium.launch();
  const origin = `http://127.0.0.1:${server.address().port}`;
  const index = JSON.parse(await readFile(resolve(root, 'index.json'), 'utf8'));
  const stories = Object.values(index.entries).filter(entry => entry.type === 'story' && ['Site/Manual', 'Site/WalkthroughValidation', 'Site/ScenarioCapture'].includes(entry.title));
  assert.equal(stories.length, 17);
  for (const story of stories) {
    const page = await browser.newPage();
    try {
      await page.addInitScript(() => {
        window.__manualEvents = [];
        let channel;
        Object.defineProperty(window, '__STORYBOOK_ADDONS_CHANNEL__', { configurable: true,
          get: () => channel, set: value => {
            channel = value;
            for (const type of ['storyFinished', 'storyThrewException', 'storyErrored', 'playFunctionThrewException']) {
              channel.on(type, result => window.__manualEvents.push({ type, status: result?.status, message: result?.message ?? result?.error?.message ?? '' }));
            }
          },
        });
      });
      await page.goto(`${origin}/iframe.html?id=${story.id}&viewMode=story`);
      await page.waitForFunction(() => window.__manualEvents.some(event => event.type === 'storyFinished'), { timeout: 30000 });
      const events = await page.evaluate(() => window.__manualEvents);
      if (values['expect-missing']) {
        assert(events.some(event => /Missing fresh evidence/.test(event.message)), JSON.stringify(events));
        assert(events.some(event => event.type !== 'storyFinished'), JSON.stringify(events));
        console.log(`EXPECTED MISSING EVIDENCE ${story.id}`);
      } else {
        assert(events.some(event => event.type === 'storyFinished' && event.status === 'success'), JSON.stringify(events));
        assert(!events.some(event => event.type !== 'storyFinished'), JSON.stringify(events));
        console.log(`PASS ${story.id}`);
      }
    } finally { await page.close(); }
  }
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
