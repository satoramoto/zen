// A real-story theme smoke check: same mounted, edited instrument across every pack and facet.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = resolve(process.env.MUSIC_ARTIFACTS ?? '.shots/music-themes');
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
try {
  await page.goto(`${process.env.MUSIC_PREVIEW_URL ?? 'http://127.0.0.1:6023'}/iframe.html?id=music-four-deck-mixer--four-decks&globals=theme:mixflow;mode:dark`, { waitUntil: 'networkidle' });
  await page.locator('.play-example').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole('button', { name: 'Deck 1: Verse Drums', exact: true }).click();
  const lists = await page.evaluate(async () => {
    const { packs } = await import('/src/library/themes/packs.ts');
    const { palettes } = await import('/src/library/themes/palettes.ts');
    const { faces } = await import('/src/library/themes/faces.ts');
    const { scales } = await import('/src/library/themes/scales.ts');
    const { materials } = await import('/src/library/themes/materials.ts');
    window.__musicThemeCanvas = document.querySelector('.play-example canvas');
    window.__musicThemeRoot = document.querySelector('.play-example');
    return { theme: packs.map((item) => item.id), palette: palettes.map((item) => item.id), faces: faces.map((item) => item.id), scale: scales.map((item) => item.id), materials: materials.map((item) => item.id) };
  });
  const report = [];
  for (const [facet, choices] of Object.entries(lists)) for (const choice of choices) {
    const globals = { theme: 'mixflow', palette: 'theme', faces: 'theme', scale: 'theme', materials: 'theme', [facet]: choice, mode: 'dark' };
    await page.evaluate((globals) => window.__STORYBOOK_ADDONS_CHANNEL__.emit('updateGlobals', { globals }), globals);
    await page.waitForFunction((wanted) => {
      const got = window.__STORYBOOK_PREVIEW__?.storyRenders?.[0]?.storyContext().globals;
      return got && Object.entries(wanted).every(([key, value]) => got[key] === value);
    }, globals);
    await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
    await page.evaluate(() => document.fonts.ready);
    const reading = await page.evaluate(() => {
      const root = document.querySelector('.play-example'), canvas = root?.querySelector('canvas');
      const action = root?.querySelector('.wdg-toggle-body');
      const scope = root?.closest('.lib-scope');
      const css = root && getComputedStyle(root), face = action && getComputedStyle(action);
      return {
        mountedRootPreserved: root === window.__musicThemeRoot,
        mountedCanvasPreserved: canvas === window.__musicThemeCanvas,
        selected: root?.querySelector('[aria-label="Deck 1: Verse Drums, selected"]')?.getAttribute('aria-pressed'),
        primary: css?.getPropertyValue('--primary').trim(),
        source: css?.getPropertyValue('--stem-drums').trim(),
        font: css?.fontFamily,
        knobSize: css?.getPropertyValue('--wdg-knob-size').trim(),
        radius: face?.borderRadius, background: face?.background, shadow: face?.boxShadow,
        scheme: scope?.getAttribute('data-mode'),
      };
    });
    if (!reading.mountedRootPreserved || !reading.mountedCanvasPreserved || reading.selected !== 'true' || !reading.primary || !reading.source || !reading.font) {
      throw new Error(`${facet}:${choice} reset or lost the instrument: ${JSON.stringify(reading)}`);
    }
    report.push({ facet, choice, ...reading });
  }
  const materialStates = report.filter((reading) => reading.facet === 'materials');
  const original = materialStates.find((reading) => reading.choice === 'mixflow');
  if (original && !materialStates.some((reading) => reading.background !== original.background || reading.shadow !== original.shadow)) {
    throw new Error('Material swaps changed no control-face fill, texture or shadow');
  }
  if (errors.length) throw new Error(errors.join('\n'));
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(`${report.length} live pack/facet changes passed; selection, mixer and canvas nodes preserved.`);
} finally {
  await browser.close();
}
