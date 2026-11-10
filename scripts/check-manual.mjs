// End-to-end evidence: real story plays, native-run results, static builds, and browser reading.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, mkdtemp, stat, realpath, cp, rm, symlink } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import assert from 'node:assert/strict';
import { scenario, captureCheckpoint } from 'story-spec';
import { captureStory, walkthroughStories } from 'story-spec/walkthrough/capture';
import { readWalkthrough } from 'story-spec/walkthrough/node';
import { manualSources, manualSettings } from './manual-sources.mjs';
import { readContent } from '../src/site/content.mjs';

const { values } = parseArgs({ options: { native: { type: 'string' }, 'native-headless': { type: 'boolean', default: false }, before: { type: 'string' } } });
await mkdir('.shots', { recursive: true });
const run = await mkdtemp(resolve('.shots/manual-check-'));
const evidenceDir = resolve(run, 'evidence');
await mkdir(evidenceDir);
const save = (name, value) => writeFile(resolve(evidenceDir, `${name}.json`), JSON.stringify(value, null, 2));
const storyRoot = await realpath('storybook-static');
const siteRoot = resolve('fixtures/site/dist');
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const base = pathname.startsWith('/project/') ? siteRoot : storyRoot;
    const suffix = pathname.startsWith('/project/') ? pathname.slice('/project/'.length) : pathname.slice(1);
    let file = resolve(base, suffix);
    if (file !== base && !file.startsWith(base + sep)) throw new Error('outside root');
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    file = await realpath(file);
    if (!file.startsWith(await realpath(base) + sep)) throw new Error('outside root');
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
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
  const sources = await manualSources('.');
  const index = JSON.parse(await readFile(resolve(storyRoot, 'index.json'), 'utf8'));
  const selected = await walkthroughStories(index, '.');
  assert.deepEqual(selected.map(story => story.walkthrough.id), ['find-documentation']);
  await save('selection', { selected: selected.map(story => story.walkthrough.id), tasks: selected.map(({ walkthrough: { id, title, chapter, order } }) => ({ id, title, chapter, order })) });
  const captureOptions = { browser, url: origin, storyId: selected[0].id, sources, ...manualSettings };
  const result = await captureStory({ ...captureOptions, output: resolve(run, 'web') });
  const bundle = await readWalkthrough(result.directory, sources);
  await save('web', { bundle, validated: true, exitCode: 0, captured: bundle.steps.map(step => step.id), required: bundle.run.required, playCount: 1 });
  // A real assertion failure occurs after the initial screenshot: no matching search result.
  const failedOutput = resolve(run, 'web-failure');
  let failure;
  try { await captureStory({ ...captureOptions, storyId: 'site-screens-manualfailure--missing-match', output: failedOutput }); }
  catch (error) { failure = error; }
  assert(failure, 'The negative story must fail');
  assert(failure.captured.length > 0, failure.message);
  await assert.rejects(stat(failedOutput), { code: 'ENOENT' });
  await save('web-failure', { exitCode: 1, captured: failure.captured, publishable: false, reusedPrevious: false, error: failure.message });
  await assert.rejects(captureStory({ ...captureOptions, output: resolve(run, 'timeout'), timeout: 1 }), /timed out/);
  assert.equal(browser.contexts().length, 0, 'Timeout leaked a browser context');
  const hiddenBrowser = {
    version: () => browser.version(),
    newContext: async options => {
      const context = await browser.newContext(options);
      await context.addInitScript(() => document.addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style'); style.textContent = '#storybook-root { display:none !important; }'; document.head.append(style);
      }));
      return context;
    },
  };
  await assert.rejects(captureStory({ ...captureOptions, browser: hiddenBrowser, output: resolve(run, 'screenshot-failure'), timeout: 2000 }));
  await assert.rejects(stat(resolve(run, 'screenshot-failure')), { code: 'ENOENT' });
  assert.equal(browser.contexts().length, 0, 'Screenshot failure leaked a browser context');
  const changedSources = structuredClone(sources);
  changedSources.product.digest = 'f'.repeat(64);
  await assert.rejects(captureStory({ ...captureOptions, sources: changedSources, output: resolve(run, 'stale-build') }), /stale Storybook/);
  console.log('PASS capture: real play, failed assertion, stale build fingerprint, no partial publication');

  const declaration = selected[0].walkthrough;
  let actions = 0, checks = 0;
  const ordinary = scenario({ when: 'acting', then: 'checked', walkthrough: declaration,
    act: async ctx => { actions++; await captureCheckpoint(ctx, 'start'); }, check: () => { checks++; } });
  const ctx = { parameters: ordinary.parameters, step: (_label, fn) => fn(ctx) };
  await ordinary.play(ctx);
  assert.equal(actions, 1); assert.equal(checks, 1);
  await save('no-adapter', { exitCode: 0, actions, checks, captures: 0 });
  const phases = [];
  const base = { play: () => {} };
  const plain = scenario({ when: 'acting', then: 'checked', act: () => {}, check: () => {} }, base);
  const opted = scenario({ when: 'acting', then: 'checked', act: () => {}, check: () => {}, walkthrough: declaration }, base);
  await plain.play({ step: async (label, fn) => { phases.push(label.split(' ')[0]); await fn({}); } });
  assert.deepEqual(opted.parameters.scenario, plain.parameters.scenario);
  assert.deepEqual(opted.parameters.docs, plain.parameters.docs);
  execFileSync('npm', ['run', 'typecheck'], { stdio: 'inherit' });
  await save('compatibility', { typecheckExitCode: 0, steps: phases, specUnchanged: true, docsUnchanged: true });

  const fixture = resolve('fixtures/site');
  const siteOptions = directory => ({ base: '/project/', content: [{ file: 'content/overview.md', slug: '' }, { file: 'content/architecture.md', slug: 'architecture' }], manuals: [{ from: directory, sources }] });
  async function invalid(name, mutate, fileEdit) {
    const directory = resolve(run, name);
    await cp(result.directory, directory, { recursive: true });
    const edited = structuredClone(bundle);
    mutate(edited);
    await writeFile(resolve(directory, 'manifest.json'), JSON.stringify(edited));
    if (fileEdit) await fileEdit(directory);
    let error;
    try { await readContent(siteOptions(directory), fixture); } catch (caught) { error = caught; }
    assert(error, `${name} must fail publication`);
    assert(error.message.includes(bundle.task.id), error.message);
    return { exitCode: 1, taskId: bundle.task.id, error: error.message };
  }
  const invalids = {};
  invalids.version = await invalid('version', b => b.version = 99);
  invalids.duplicate = await invalid('duplicate', b => b.steps.push(b.steps[0]));
  invalids.callout = await invalid('callout', b => b.steps[0].callouts[0].rect = [1, 1, 1, 1]);
  invalids.missing = await invalid('missing', () => {}, d => rm(resolve(d, bundle.steps[0].image)));
  invalids.altered = await invalid('altered', () => {}, d => writeFile(resolve(d, bundle.steps[0].image), 'altered'));
  invalids.traversal = await invalid('traversal', b => b.steps[0].image = '../outside.png');
  invalids.symlink = await invalid('symlink', () => {}, async d => { await rm(resolve(d, bundle.steps[0].image)); await symlink(resolve(result.directory, bundle.steps[0].image), resolve(d, bundle.steps[0].image)); });
  await save('invalid', invalids);
  const stale = await invalid('stale', b => b.sources.product.digest = '0'.repeat(64));
  await save('stale', stale);
  await save('unverified', { stale, failed: await invalid('failed', b => b.run.status = 'failed'), incomplete: await invalid('incomplete', b => b.steps.pop()) });
  let collision;
  try { await readContent({ ...siteOptions(result.directory), content: [{ file: 'content/overview.md', slug: 'manual/find-documentation' }, { file: 'content/architecture.md', slug: 'architecture' }] }, fixture); }
  catch (error) { collision = error; }
  assert.match(collision?.message ?? '', /manual\/find-documentation/);
  await save('collision', { exitCode: 1, error: collision.message });
  console.log('PASS publication rejection: invalid, stale, incomplete, conflicting, missing and escaping assets');

  const inputs = resolve(run, 'bundles.json');
  await writeFile(inputs, JSON.stringify([{ directory: result.directory }]));
  execFileSync('npm', ['run', 'build:site-fixture'], { env: { ...process.env, MANUAL_BUNDLES: inputs }, stdio: 'inherit' });
  const reading = {}, callouts = {};
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: 1000 } });
    const page = await context.newPage();
    await page.goto(`${origin}/project/manual/find-documentation/`);
    for (const image of await page.locator('.zen-walkthrough img').all()) await image.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => [...document.querySelectorAll('.zen-walkthrough img')].every(image => image.complete && image.naturalWidth > 0));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    assert.equal(overflow, false);
    const captions = await page.locator('figcaption').allTextContents();
    assert.equal(captions.length, 2);
    reading[width] = { javascriptEnabled: false, overflow, captions, imagesLoaded: await page.locator('.zen-walkthrough img').count(), provenanceVisible: await page.locator('.zen-walkthrough__provenance').isVisible() };
    const rect = bundle.steps[0].callouts[0].rect;
    const imageBox = await page.locator('.zen-walkthrough__image').first().boundingBox();
    const calloutBox = await page.locator('.zen-walkthrough__callout').first().boundingBox();
    const maxPositionError = Math.max(Math.abs(calloutBox.x - imageBox.x - rect[0] * imageBox.width), Math.abs(calloutBox.y - imageBox.y - rect[1] * imageBox.height));
    assert(maxPositionError < 2);
    callouts[width] = { maxPositionError, labels: await page.locator('.zen-walkthrough__callout > span').allTextContents(), explanations: await page.locator('.zen-walkthrough__explanations li').evaluateAll(items => items.map(item => String(item.value))) };
    await page.screenshot({ path: resolve(run, `manual-${width}.png`), fullPage: true });
    await context.close();
  }
  await save('reading', reading); await save('callouts', callouts);
  const page = await browser.newPage();
  await page.goto(`${origin}/project/`);
  await page.locator('astro-island[ssr]').waitFor({ state: 'detached' });
  await page.getByRole('searchbox').fill('matching');
  await page.keyboard.press('Tab');
  const keyboardReached = await page.getByRole('region', { name: 'Documentation search' }).getByRole('link', { name: 'Find documentation' }).evaluate(node => node === document.activeElement);
  assert(keyboardReached);
  await page.keyboard.press('Enter');
  await page.waitForURL('**/project/manual/find-documentation/');
  const brokenResources = [];
  for (const url of await page.locator('img').evaluateAll(images => images.map(image => image.src))) if (!(await page.request.get(url)).ok()) brokenResources.push(url);
  assert.deepEqual(brokenResources, []);
  await save('search', { keyboardReached, url: page.url(), brokenResources });
  if (values.before) {
    const before = JSON.parse(await readFile(resolve(values.before, 'manifest.json'), 'utf8'));
    assert.notEqual(before.steps[0].caption, bundle.steps[0].caption);
    const renderedCaption = (await page.locator('figcaption').first().innerText()).replace(/^1\s+/, '');
    assert.equal(renderedCaption, bundle.steps[0].caption);
    await save('caption-refresh', { before: before.steps[0].caption, after: bundle.steps[0].caption, renderedCaption, sourceDigestBefore: before.sources.product.digest, sourceDigestAfter: bundle.sources.product.digest });
  }
  await page.close();
  if (values.native) {
    const nativeRoot = resolve(values.native, '../..');
    const { manualSources: nativeSources } = await import(pathToFileURL(resolve(nativeRoot, 'site/manual-sources.mjs')).href);
    const expectedNativeSources = await nativeSources(nativeRoot, values['native-headless']);
    for (const name of ['native', 'native-timeout']) {
      const data = JSON.parse(await readFile(resolve(values.native, `${name}.json`), 'utf8'));
      assert.deepEqual(data.ownedProcessesRemaining, []);
      assert.deepEqual(data.sources, expectedNativeSources, `Stale ${name} evidence; rerun native validation`);
      if (name === 'native') data.bundle = await readWalkthrough(data.directory, expectedNativeSources);
      await save(name, data);
    }
  }
  console.log(`MANUAL_EVIDENCE ${evidenceDir}`);
  console.log(`MANUAL_INPUTS ${inputs}`);
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
