// Optional tooling dependency: playwright, with a system Chromium. No audio calls.
// PLAYWRIGHT_MODULE may point to an isolated install, keeping Zen's lockfile intact.
import {mkdirSync, writeFileSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';

const {chromium} = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const plugin = process.argv[2];
const base = process.env.STORYBOOK_URL ?? 'http://127.0.0.1:6023';
const output = resolve(repo, '.shots/omarchy-ab');
const cases = [
  {id: 'lab', story: 'omarchy-lab--baseline', width: 850, height: 850},
  {id: 'lab-narrow', story: 'omarchy-lab--baseline', width: 390, height: 850},
  ...(plugin ? ['quick', 'levels', 'routing', 'hardware'].flatMap((tab) => [
    {id: `patchy-${tab}`, story: `omarchy-plugins-patchy--${tab}`, tab: tab === 'hardware' ? 'alsa' : tab, width: 850, height: 850},
    {id: `patchy-${tab}-narrow`, story: `omarchy-plugins-patchy--${tab}`, tab: tab === 'hardware' ? 'alsa' : tab, width: 390, height: 850},
  ]) : []),
];

function command(binary, args, allowDifference = false) {
  const result = spawnSync(binary, args, {cwd: repo, encoding: 'utf8', timeout: 35000});
  if (result.error) throw result.error;
  if (result.status !== 0 && !(allowDifference && result.status === 1)) throw new Error(`${binary} failed: ${result.stdout}\n${result.stderr}`);
  return result;
}
function keyed(nodes) {
  const occurrences = new Map();
  return new Map(nodes.map(n => {
    const base = JSON.stringify([n.kind, n.label, n.action]);
    const occurrence = occurrences.get(base) ?? 0;
    occurrences.set(base, occurrence + 1);
    return [base + occurrence, n];
  }));
}

mkdirSync(output, {recursive: true});
const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH ?? '/usr/bin/chromium', headless: true, args: ['--no-sandbox']});
const reports = [];
try {
  const page = await browser.newPage({deviceScaleFactor: 1});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  for (const scene of cases) {
    const dir = join(output, scene.id);
    mkdirSync(dir, {recursive: true});
    await page.setViewportSize({width: scene.width + 56, height: scene.height + 56});
    await page.goto(`${base}/iframe.html?id=${scene.story}&viewMode=story`);
    const panel = page.getByRole('main', {name: 'Plugin preview'});
    await panel.waitFor();
    await page.evaluate(() => document.fonts.ready);
    await panel.evaluate((el, scene) => Object.assign(el.style, {width: `${scene.width}px`, maxWidth: 'none', height: `${scene.height}px`, overflow: 'auto'}), scene);
    await panel.screenshot({path: join(dir, 'browser.png'), animations: 'disabled'});
    const browserMeta = await panel.evaluate(el => {
      const origin = el.getBoundingClientRect();
      return {
        tree: JSON.parse(el.dataset.omTree), width: origin.width, height: origin.height,
        nodes: [...el.querySelectorAll('[data-om-kind]')].map(node => {
          const rect = node.getBoundingClientRect();
          return {kind: node.dataset.omKind, label: node.dataset.omLabel, action: node.dataset.omAction, x: rect.x - origin.x, y: rect.y - origin.y, width: rect.width, height: rect.height};
        }),
      };
    });
    writeFileSync(join(dir, 'browser.json'), JSON.stringify(browserMeta, null, 2));
    command('python', ['scripts/omarchy-preview.py', '--capture', '--width', String(scene.width), '--height', String(scene.height), '--screenshot', join(dir, 'native.png'), ...(scene.tab ? ['--plugin', resolve(plugin), '--tab', scene.tab] : [])]);
    const {readFileSync} = await import('node:fs');
    const nativeMeta = JSON.parse(readFileSync(join(dir, 'native.json'), 'utf8'));
    assert.deepEqual(nativeMeta.tree, browserMeta.tree, `${scene.id}: native and browser must draw identical view data`);
    assert.equal(nativeMeta.width, browserMeta.width);
    assert.equal(nativeMeta.height, browserMeta.height);
    const nativeNodes = keyed(nativeMeta.nodes), browserNodes = keyed(browserMeta.nodes);
    assert.deepEqual([...nativeNodes.keys()].sort(), [...browserNodes.keys()].sort(), `${scene.id}: same semantic elements must exist`);
    const deltas = [...browserNodes].map(([key, a]) => {
      const b = nativeNodes.get(key);
      return {kind: a.kind, label: a.label, action: a.action, browser: a, native: b, delta: Object.fromEntries(['x', 'y', 'width', 'height'].map(p => [p, Math.round((b[p] - a[p]) * 100) / 100]))};
    });
    command('magick', [join(dir, 'browser.png'), join(dir, 'native.png'), '-compose', 'difference', '-composite', join(dir, 'difference.png')]);
    command('magick', [join(dir, 'browser.png'), join(dir, 'native.png'), '-define', 'compose:args=50', '-compose', 'blend', '-composite', join(dir, 'overlay.png')]);
    const metric = command('magick', ['compare', '-metric', 'MAE', join(dir, 'browser.png'), join(dir, 'native.png'), 'null:'], true).stderr.trim();
    const report = {...scene, identicalTree: true, semanticNodes: nativeMeta.nodes.length, pixelMAE: metric,
      nativeOverflow: nativeMeta.nodes.filter(n => n.x < 0 || n.x + n.width > scene.width + 1).map(n => ({kind: n.kind, label: n.label, x: n.x, width: n.width})),
      largestGeometryDeltas: deltas.sort((a, b) => Math.max(...Object.values(b.delta).map(Math.abs)) - Math.max(...Object.values(a.delta).map(Math.abs))).slice(0, 12),
    };
    reports.push(report);
    console.log(`${scene.id}: identical tree, ${report.semanticNodes} elements, pixel MAE ${metric}, ${report.nativeOverflow.length} horizontally overflowing elements`);
  }
  assert.deepEqual(errors, [], 'No browser render errors');
} finally { await browser.close(); }
writeFileSync(join(output, 'report.json'), JSON.stringify({capturedAt: new Date().toISOString(), method: 'Chromium vs offscreen Quickshell, identical serialized trees, DPR 1, same panel dimensions, untouched initial fixtures. Pixel MAE is descriptive, NOT a parity pass/fail.', cases: reports}, null, 2));
console.log(`Artifacts: ${output}`);
