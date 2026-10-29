// Browser evidence, not a model/unit test. Both servers must already be running.
// node scripts/music-visual.mjs --reference-only   (capture before making changes)
// node scripts/music-visual.mjs                    (capture and compare both implementations)
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const referenceOnly = process.argv.includes('--reference-only');
const reference = process.env.MUSIC_REFERENCE_URL ?? 'http://127.0.0.1:6024';
const target = process.env.MUSIC_PREVIEW_URL ?? 'http://127.0.0.1:6023';
const output = resolve(process.env.MUSIC_ARTIFACTS ?? '.shots/music');
const story = process.env.MUSIC_STORY_ID ?? 'music-four-deck-mixer--four-decks';
const referenceStory = process.env.MUSIC_REFERENCE_STORY_ID ?? story;
const targetStory = process.env.MUSIC_TARGET_STORY_ID ?? story;
const renderer = process.env.MUSIC_RENDERER ?? 'react';
const state = process.env.MUSIC_VISUAL_STATE ?? 'baseline';
const sizes = [[1440, 900], [1280, 720], [900, 700]];
await mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true });
const reports = [];
try {
  for (const [width, height] of sizes) {
    const label = `${width}x${height}`;
    for (const kind of referenceOnly ? ['before'] : ['before', 'after']) {
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1, colorScheme: 'dark', reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const url = new URL(kind === 'after' ? process.env.MUSIC_TARGET_PATH ?? '/iframe.html' : '/iframe.html', kind === 'before' ? reference : target);
      url.searchParams.set('id', kind === 'before' ? referenceStory : targetStory);
      url.searchParams.set('viewMode', 'story');
      if (kind === 'after') url.searchParams.set('globals', `theme:mixflow;mode:dark;renderer:${renderer}`);
      await page.goto(url.href, { waitUntil: 'networkidle' });
      await page.locator('.play-example').waitFor().catch(async (error) => {
        await page.screenshot({ path: `${output}/${kind}-${label}-error.png`, fullPage: true });
        throw new Error(`${kind} ${label}: ${errors.join('; ')}\n${(await page.locator('body').innerText()).slice(0, 3000)}`, { cause: error });
      });
      await page.evaluate(() => document.fonts.ready);
      // All baseline fixtures are paused. Two frames settle canvas sizing and CSS inheritance.
      await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
      if (state === 'wave-settings') {
        await page.getByRole('button', { name: 'Deck 1 waveform settings', exact: true }).click();
        await page.getByRole('dialog', { name: 'Deck 1 waveform settings', exact: true }).waitFor();
      } else if (state === 'fx-menu') {
        await page.getByRole('combobox', { name: 'FX A effect', exact: true }).click();
        await page.getByRole('listbox').waitFor();
      } else if (state !== 'baseline') throw new Error(`Unknown MUSIC_VISUAL_STATE: ${state}`);
      await page.screenshot({ path: `${output}/${kind}-${label}.png`, animations: 'disabled', fullPage: true });
      const layout = await page.evaluate(() => {
        const selectors = ['.play-example', '.play-timeline', '.play-decks', '.play-deck', '.play-master-strip', '.play-grid', '.play-channel', '.play-deck-footer', '.wdg-knob-body', '.wdg-slider-body'];
        return Object.fromEntries(selectors.map((selector) => [selector, [...document.querySelectorAll(selector)].map((el) => {
          const { x, y, width, height } = el.getBoundingClientRect();
          const css = getComputedStyle(el);
          return { x, y, width, height, color: css.color, background: css.backgroundColor, font: css.font, fontVariationSettings: css.fontVariationSettings };
        })]));
      });
      await writeFile(`${output}/${kind}-${label}.json`, JSON.stringify({ url: url.href, errors, layout }, null, 2));
      if (errors.length) throw new Error(`${kind} ${label}: ${errors.join('; ')}`);
      await page.close();
    }
    if (referenceOnly) { reports.push({ viewport: label, reference: `${output}/before-${label}.png` }); continue; }
    const before = PNG.sync.read(await readFile(`${output}/before-${label}.png`));
    const after = PNG.sync.read(await readFile(`${output}/after-${label}.png`));
    if (before.width !== after.width || before.height !== after.height) {
      reports.push({ viewport: label, dimensionsMatch: false, before: [before.width, before.height], after: [after.width, after.height] });
      continue;
    }
    const diff = new PNG({ width: before.width, height: before.height });
    let different = 0;
    let maximumDelta = 0;
    for (let i = 0; i < before.data.length; i += 4) {
      const delta = Math.max(...[0, 1, 2, 3].map((c) => Math.abs(before.data[i + c] - after.data[i + c])));
      maximumDelta = Math.max(maximumDelta, delta);
      if (delta) different++;
      diff.data[i] = delta ? 255 : Math.round(before.data[i] * 0.2);
      diff.data[i + 1] = delta ? 0 : Math.round(before.data[i + 1] * 0.2);
      diff.data[i + 2] = delta ? 100 : Math.round(before.data[i + 2] * 0.2);
      diff.data[i + 3] = 255;
    }
    await writeFile(`${output}/diff-${label}.png`, PNG.sync.write(diff));
    reports.push({ viewport: label, dimensionsMatch: true, differentPixels: different, percent: +(different / (before.width * before.height) * 100).toFixed(4), maximumDelta });
  }
} finally {
  await browser.close();
}
await writeFile(`${output}/report.json`, JSON.stringify(reports, null, 2));
console.log(JSON.stringify(reports, null, 2));
if (!referenceOnly && reports.some((report) => report.dimensionsMatch === false || report.differentPixels !== 0)) process.exitCode = 1;
