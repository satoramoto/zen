// Generate walkthroughs from opted-in stories. Owns and closes its bounded browser and HTTP server.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, stat, realpath, mkdir, mkdtemp } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { parseArgs } from 'node:util';
import { captureStory, walkthroughStories } from 'story-spec/walkthrough/capture';
import { manualSettings as settings, manualSources } from './manual-sources.mjs';

const { values } = parseArgs({ options: {
  stories: { type: 'string', default: 'storybook-static' },
  output: { type: 'string', default: '.shots/walkthroughs' },
} });
const root = await realpath(values.stories);
await mkdir(values.output, { recursive: true });
const output = await mkdtemp(resolve(values.output, 'run-'));
const sources = await manualSources('.');
const server = createServer(async (request, response) => {
  try {
    let file = resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
    if (file !== root && !file.startsWith(root + sep)) throw new Error('outside root');
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    file = await realpath(file);
    if (!file.startsWith(root + sep)) throw new Error('outside root');
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
    response.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
    response.end(await readFile(file));
  } catch { response.statusCode = 404; response.end('Not found'); }
});
let browser;
try {
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  browser = await chromium.launch();
  const url = `http://127.0.0.1:${server.address().port}/`;
  const index = JSON.parse(await readFile(resolve(root, 'index.json'), 'utf8'));
  const stories = await walkthroughStories(index, '.');
  if (!stories.length) throw new Error('No opted-in walkthrough stories; rebuild Storybook');
  const bundles = [];
  for (const story of stories) {
    const result = await captureStory({ browser, url, storyId: story.id, sources, output: resolve(output, story.id), ...settings });
    bundles.push({ directory: result.directory, sources });
    console.log(`CAPTURED ${result.bundle.task.id}: ${result.bundle.steps.length} screenshots`);
  }
  await writeFile(resolve(output, 'bundles.json'), JSON.stringify(bundles, null, 2) + '\n');
  console.log(`WALKTHROUGHS ${resolve(output, 'bundles.json')}`);
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
