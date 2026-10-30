// Optional tooling dependency: playwright, with a system Chromium. No audio calls.
// PLAYWRIGHT_MODULE may point to an isolated install, keeping Zen's lockfile intact.
import {mkdirSync, writeFileSync, readFileSync} from 'node:fs';
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
  ...(plugin ? [
    {id:'patchy-empty',story:'omarchy-plugins-patchy--empty',tab:'quick',scenario:'empty',width:850,height:850},
    {id:'patchy-loading',story:'omarchy-plugins-patchy--loading',tab:'quick',scenario:'loading',width:850,height:850},
    {id:'patchy-error',story:'omarchy-plugins-patchy--backend-error',tab:'quick',scenario:'error',width:850,height:850},
    {id:'patchy-editor',story:'omarchy-plugins-patchy--hardware-editor',tab:'alsa',scenario:'editor',width:850,height:850},
    {id:'patchy-confirm',story:'omarchy-plugins-patchy--disconnect-confirmation',tab:'routing',scenario:'confirm',width:850,height:850},
    {id:'patchy-clock-popup',story:'omarchy-plugins-patchy--quick',tab:'quick',scenario:'clock-popup',width:850,height:850},
    {id:'patchy-system-theme',story:'omarchy-plugins-patchy--quick',tab:'quick',systemTheme:true,width:850,height:850},
  ] : []),
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
    command('python', [scene.tab ? resolve(plugin,'tools/test-framework-native.py') : 'scripts/omarchy-preview.py', '--capture', '--width', String(scene.width), '--height', String(scene.height), '--screenshot', join(dir, 'native.png'), ...(scene.tab ? ['--tab', scene.tab] : []),...(scene.scenario?['--scenario',scene.scenario]:[]),...(scene.systemTheme?['--system-theme']:[])]);
    const nativeMeta = JSON.parse(readFileSync(join(dir, 'native.json'), 'utf8'));
    // grabToImage captures the QML item's alpha, not its QQuickWindow backdrop.
    // Composite against the real window colour, as the on-screen window does.
    command('magick',[join(dir,'native.png'),'-background',nativeMeta.theme.background,'-alpha','remove','-alpha','off',join(dir,'native.png')]);
    await page.setViewportSize({width: scene.width + 56, height: scene.height + 56});
    await page.goto(`${base}/iframe.html?id=${scene.story}&viewMode=story`);
    const panel = page.getByRole('main', {name: 'Plugin preview'});
    await panel.waitFor();
    await page.evaluate(t=>window.dispatchEvent(new CustomEvent('omarchy-preview-theme',{detail:t})),nativeMeta.theme);
    await page.waitForFunction(t=>JSON.parse(document.querySelector('[data-om-theme]').dataset.omTheme).selected===t.selected,nativeMeta.theme);
    await page.evaluate(() => document.fonts.ready);
    await panel.evaluate((el, scene) => Object.assign(el.style, {width: `${scene.width}px`, maxWidth: 'none', height: `${scene.height}px`, overflow: 'auto'}), scene);
    if(scene.scenario==='editor'){await page.getByRole('textbox').focus();await page.getByRole('textbox').evaluate(el=>el.select());await page.addStyleTag({content:'input {caret-color:transparent !important}'});}
    if(scene.scenario==='clock-popup'){await page.getByRole('combobox',{name:'Sample rate'}).evaluate(el=>el.click());await page.getByRole('listbox').waitFor();}
    await panel.screenshot({path: join(dir, 'browser.png'), animations: 'disabled'});
    const browserMeta = await panel.evaluate(el => {
      const origin = el.getBoundingClientRect();
      return {
        tree: JSON.parse(el.dataset.omTree), width: origin.width, height: origin.height,
        nodes: [...el.querySelectorAll('[data-om-kind]')].map(node => {
          const rect = node.getBoundingClientRect();
          return {kind: node.dataset.omKind, label: node.dataset.omLabel, action: node.dataset.omAction, x: rect.x - origin.x, y: rect.y - origin.y, width: rect.width, height: rect.height};
        }),
        popups:[...document.querySelectorAll('.om-popup')].map(node=>{const r=node.getBoundingClientRect();return{x:r.x-origin.x,y:r.y-origin.y,width:r.width,height:r.height};}),
      };
    });
    writeFileSync(join(dir, 'browser.json'), JSON.stringify(browserMeta, null, 2));
    assert.deepEqual(nativeMeta.tree, browserMeta.tree, `${scene.id}: native and browser must draw identical view data`);
    assert.equal(nativeMeta.width, browserMeta.width);
    assert.equal(nativeMeta.height, browserMeta.height);
    const nativeNodes = keyed(nativeMeta.nodes), browserNodes = keyed(browserMeta.nodes);
    assert.deepEqual([...nativeNodes.keys()].sort(), [...browserNodes.keys()].sort(), `${scene.id}: same semantic elements must exist`);
    if(scene.scenario==='clock-popup')assert.equal(nativeMeta.popups?.length,1,'Native capture must include the real Qt popup overlay');
    const deltas = [...browserNodes].map(([key, a]) => {
      const b = nativeNodes.get(key);
      return {kind: a.kind, label: a.label, action: a.action, browser: a, native: b, delta: Object.fromEntries(['x', 'y', 'width', 'height'].map(p => [p, Math.round((b[p] - a[p]) * 100) / 100]))};
    });
    command('magick', [join(dir, 'browser.png'), join(dir, 'native.png'), '-compose', 'difference', '-composite', join(dir, 'difference.png')]);
    command('magick', [join(dir, 'browser.png'), join(dir, 'native.png'), '-define', 'compose:args=50', '-compose', 'blend', '-composite', join(dir, 'overlay.png')]);
    const metric = command('magick', ['compare', '-metric', 'MAE', join(dir, 'browser.png'), join(dir, 'native.png'), 'null:'], true).stderr.trim();
    const report = {...scene, identicalTree: true, semanticNodes: nativeMeta.nodes.length, pixelMAE: metric,popups:{browser:browserMeta.popups,native:nativeMeta.popups??[]},maxGeometryDelta:Math.max(...deltas.flatMap(d=>Object.values(d.delta).map(Math.abs))),
      nativeOverflow: nativeMeta.nodes.filter(n => n.x < 0 || n.x + n.width > scene.width + 1).map(n => ({kind: n.kind, label: n.label, x: n.x, width: n.width})),
      largestGeometryDeltas: deltas.sort((a, b) => Math.max(...Object.values(b.delta).map(Math.abs)) - Math.max(...Object.values(a.delta).map(Math.abs))).slice(0, 12),
    };
    assert.equal(report.maxGeometryDelta,0,`${scene.id}: renderer geometry must agree exactly`);
    assert.equal(report.nativeOverflow.length,0,`${scene.id}: no offscreen horizontal controls`);
    if(scene.scenario==='clock-popup')assert.deepEqual(nativeMeta.popups,browserMeta.popups,'Popup geometry must agree too');
    reports.push(report);
    console.log(`${scene.id}: identical tree, ${report.semanticNodes} elements, pixel MAE ${metric}, ${report.nativeOverflow.length} horizontally overflowing elements`);
  }
  assert.deepEqual(errors, [], 'No browser render errors');
} finally { await browser.close(); }
writeFileSync(join(output, 'report.json'), JSON.stringify({capturedAt: new Date().toISOString(), method: 'Chromium vs actual native plugin host with installed Omarchy Ui, fake controllers, identical serialized view and theme snapshots, shared layout, DPR 1 and matching dimensions. Native overlays included; item alpha composited over its actual window colour. Geometry/overflow assertions are mandatory; raw pixel MAE describes cross-engine rasterization, not a pass rate.', cases: reports}, null, 2));
console.log(`Artifacts: ${output}`);
