import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { fixtureStories, treeStory, withRenderer } from '../../stories/story';
import { h, wire } from '../../view/Tree.model';
import { withMusicScope } from '../preview';
import { DEFAULT_SPECTRAL } from '../theme/spectral';
import { Waveform } from './Waveform';
import WaveformSvelte from './Waveform.svelte';
import { waveformView, type WaveformProps } from './Waveform.model';
import { waveformArgTypes, waveformBase, waveformSamples, waveformSpectrum, waveformStories as s } from './Waveform.fixtures';

const meta = {
  id: 'music-waveform',
  title: 'Music/Displays/Waveform',
  component: Waveform,
  decorators: [withRenderer, withMusicScope, withLibraryTheme],
  parameters: { layout: 'padded' },
  args: waveformBase,
  argTypes: waveformArgTypes,
} satisfies Meta<typeof Waveform>;
export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Waveform, WaveformSvelte);

const pixels = (canvas: HTMLCanvasElement) => canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
const hasInk = (canvas: HTMLCanvasElement) => pixels(canvas).some((value, i) => i % 4 === 3 && value > 0);

/** Source geometry: folded extrema, cell centres, adaptive density and a visible silence floor. */
export const Default: Story = story(s.Default, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement).getByRole('img') as HTMLCanvasElement;
    await waitFor(() => expect(hasInk(canvas)).toBe(true));
    await expect(canvas).toHaveClass('wdg', 'wdg-wave');
    await expect(canvas).not.toHaveAttribute('tabindex');
  },
});
export const Empty: Story = story(s.Empty, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement).getByRole('img') as HTMLCanvasElement;
    await waitFor(() => expect(canvas.width).toBe(Math.round(canvas.getBoundingClientRect().width * devicePixelRatio)));
    await expect(hasInk(canvas)).toBe(false);
  },
});
export const Silence: Story = story(s.Silence, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement).getByRole('img') as HTMLCanvasElement;
    await waitFor(() => expect(hasInk(canvas)).toBe(true));
  },
});
export const Colors: Story = story(s.Colors);
export const Samples: Story = story(s.Samples);

/** Same measured spectrum; only paint changes. No forced inner Zen pack. */
export const SpectralPaint: Story = {
  ...treeStory((args: WaveformProps) => ({ tree: h('div', { style: 'display: grid; gap: var(--space-2); width: 100%' },
    ...['Scope spectral', 'Deck ink', 'Prism', 'Aurora', 'Ember', 'Layers'].map((name, i) => h('section', {
      style: i === 1 ? '--instrument-spectral-mode: deck' : `--instrument-spectral-mode: spectral${i > 1 && i < 5 ? `; --music-spectral-preset: ${name}` : ''}`,
    }, h('div', { style: 'font: var(--font-caption); color: var(--text-2)' }, name), waveformView({
      ...args, spectrum: waveformSpectrum, label: name,
      presentation: i === 5 ? { layout: 'layers', spectral: DEFAULT_SPECTRAL, weights: [1, 1, 1], edge: .35 } : args.presentation,
    }))),
  ) })),
  play: async ({ canvasElement }) => {
    const canvases = [...canvasElement.querySelectorAll('canvas')];
    await expect(canvases).toHaveLength(6);
    await waitFor(() => expect(canvases.every(hasInk)).toBe(true));
    await expect(canvases[0].toDataURL()).not.toBe(canvases[1].toDataURL());
    await expect(canvases[2].toDataURL()).not.toBe(canvases[3].toDataURL());
    await expect(canvases[3].toDataURL()).not.toBe(canvases[4].toDataURL());
  },
};

/** Controls still affect every specimen; the labelled options override only the stated variable. */
export const GeometryOptions: Story = {
  ...treeStory((args: WaveformProps) => ({ tree: h('div', { style: 'display: grid; gap: var(--space-2); width: 100%' },
    ...[
      { label: 'Polyline', smooth: 0 }, { label: 'Curved through measured points', smooth: 1 },
      { label: 'Coarse outline', density: .15 }, { label: 'Fine outline', density: 2 },
      { label: 'Low headroom', headroom: .4 }, { label: 'Scrolling strip detail', visibleShare: .025 },
      { label: 'Sample handover', from: .003, to: .006, density: 2, samples: waveformSamples },
    ].map(option => h('section', {}, h('div', { style: 'color: var(--text-2)' }, option.label), waveformView({ ...args, ...option }))),
  ) })),
};

/** Paused data, same canvas: change scoped tokens, mode, bands and the full original treatments. */
export const ThemeRepaint: Story = {
  ...treeStory((args: WaveformProps) => ({ tree: h('div', {
    'data-waveform-theme': '', style: '--instrument-spectral-mode: deck; width: 100%',
  }, waveformView({ ...args, ink: 'var(--instrument-waveform-base, var(--text-2))', spectrum: waveformSpectrum, label: 'Paused theme repaint' })) })),
  play: async ({ canvasElement, step }) => {
    const scope = canvasElement.querySelector<HTMLElement>('[data-waveform-theme]')!;
    const canvas = within(canvasElement).getByRole('img') as HTMLCanvasElement;
    await waitFor(() => expect(hasInk(canvas)).toBe(true));
    const width = canvas.width, height = canvas.height;
    let before = canvas.toDataURL();
    try {
      await step('Repaint deck ink from the inherited scope without changing props', async () => {
        scope.style.setProperty('--instrument-waveform-base', '#1f6fea');
        await waitFor(() => expect(canvas.toDataURL()).not.toBe(before));
        before = canvas.toDataURL();
      });
      await step('Switch paused measured data to scope spectral paint', async () => {
        scope.style.setProperty('--instrument-spectral-mode', 'spectral');
        await waitFor(() => expect(canvas.toDataURL()).not.toBe(before));
        before = canvas.toDataURL();
        scope.style.setProperty('--instrument-spectral-low', 'hsl(27.125 91.5% 49.25%)');
        await waitFor(() => expect(canvas.toDataURL()).not.toBe(before));
        before = canvas.toDataURL();
        scope.style.setProperty('--instrument-spectral-strength', '0');
        await waitFor(() => expect(canvas.toDataURL()).not.toBe(before));
        scope.style.setProperty('--instrument-spectral-strength', '100');
        await waitFor(() => expect(canvas.toDataURL()).toBe(before));
      });
      await step('Full Prism, Aurora and Ember treatments stay live', async () => {
        for (const preset of ['Prism', 'Aurora', 'Ember']) {
          before = canvas.toDataURL();
          scope.style.setProperty('--music-spectral-preset', preset);
          await waitFor(() => expect(canvas.toDataURL()).not.toBe(before));
          await expect(within(canvasElement).getByRole('img')).toBe(canvas);
          await expect(canvas.width).toBe(width);
          await expect(canvas.height).toBe(height);
        }
      });
    } finally {
      for (const name of ['--instrument-waveform-base', '--instrument-spectral-low', '--instrument-spectral-strength', '--music-spectral-preset']) scope.style.removeProperty(name);
      scope.style.setProperty('--instrument-spectral-mode', 'deck');
    }
  },
};

const animationFrames = (count: number) => new Promise<void>(resolve => {
  const tick = () => { if (--count <= 0) resolve(); else requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
});

/** The real frame-bound source store translates its strip against a deterministic 60Hz clock.
 * Only paint inputs may invalidate the cached canvas; ordinary scrolling must not clear/fill it. */
export const CachedScrolling: Story = {
  ...treeStory((args: WaveformProps) => {
    let beat = 12;
    return {
      tree: h('div', { 'data-waveform-scroll-scope': '', style: 'width: min(600px, 100%); overflow: hidden' },
        wire(h('div', { class: 'play-wave-source', style: `position: relative; width: 100%; height: ${args.height ?? 96}px` },
          h('div', { class: 'play-wave-scroll', style: 'width: 200%' }, waveformView({
            ...args, ink: 'var(--instrument-waveform-base, var(--text-2))', spectrum: undefined, presentation: undefined,
            label: 'Frame-bound cached waveform',
          })),
          h('span', { class: 'play-playhead' }), h('span', { class: 'play-slip-marker' })), {
          bind: [['musicFrameWaveLane', { deckId: 'scroll', laneId: 'measured', fixed: false, start: 0, visible: 32, length: 64, readFrame: 'scrollFrame' }]],
        })),
      handlers: { scrollFrame: () => ({ masterLevel: 0, decks: { scroll: { beat: beat += 1 / 60, level: 0 } } }) },
    };
  }),
  play: async ({ canvasElement, args, step }) => {
    const scope = canvasElement.querySelector<HTMLElement>('[data-waveform-scroll-scope]')!;
    const strip = scope.querySelector<HTMLElement>('.play-wave-scroll')!;
    const canvas = within(canvasElement).getByRole('img') as HTMLCanvasElement;
    await waitFor(() => expect(hasInk(canvas)).toBe(true));
    await animationFrames(3); // Settle the initial ResizeObserver notification before counting.
    const g = canvas.getContext('2d')!;
    const originalClear = g.clearRect, originalFill = g.fill;
    const drawFill = g.fill.bind(g);
    const clear = fn(g.clearRect.bind(g));
    const fill = fn((pathOrRule?: Path2D | CanvasFillRule, rule?: CanvasFillRule) => {
      if (typeof pathOrRule === 'object') drawFill(pathOrRule, rule);
      else drawFill(pathOrRule);
    });
    g.clearRect = clear; g.fill = fill;
    let transforms = 0;
    const watch = new MutationObserver(records => { transforms += records.filter(record => record.attributeName === 'style').length; });
    watch.observe(strip, { attributes: true, attributeFilter: ['style'] });
    const before = canvas.toDataURL(), transform = strip.style.transform;
    const width = canvas.width, height = canvas.height;
    try {
      await step('Thirty frame-bound transform writes reuse the painted canvas', async () => {
        await animationFrames(30);
        await expect(transforms).toBeGreaterThanOrEqual(20);
        await expect(strip.style.transform).not.toBe(transform); // Only the clock/strip moves, not the reading.
        await expect(clear).not.toHaveBeenCalled();
        await expect(fill).not.toHaveBeenCalled();
        await expect(canvas.toDataURL()).toBe(before);
      });
      await step('A real paused skin edit repaints once, then scroll stays cached', async () => {
        scope.style.setProperty('--instrument-waveform-base', '#1f6fea');
        await waitFor(() => expect(clear).toHaveBeenCalledTimes(1));
        await expect(fill).toHaveBeenCalledTimes(1);
        await expect(canvas.toDataURL()).not.toBe(before);
        await animationFrames(20);
        await expect(clear).toHaveBeenCalledTimes(1);
        await expect(fill).toHaveBeenCalledTimes(1);
      });
      if (args.colors?.length) await step('A host colour variable also invalidates the cached gradient', async () => {
        const beforeColor = canvas.toDataURL();
        scope.style.setProperty('--waveform-host-color', '#e46a2a');
        await waitFor(() => expect(clear).toHaveBeenCalledTimes(2));
        await expect(fill).toHaveBeenCalledTimes(2);
        await expect(canvas.toDataURL()).not.toBe(beforeColor);
        await animationFrames(20);
        await expect(clear).toHaveBeenCalledTimes(2);
        await expect(fill).toHaveBeenCalledTimes(2);
      });
      await expect(within(canvasElement).getByRole('img')).toBe(canvas);
      await expect(canvas.width).toBe(width);
      await expect(canvas.height).toBe(height);
      scope.dataset.waveformPaintStats = JSON.stringify({ transformWrites: transforms, scrollClears: 0, scrollFills: 0, skinClears: 1, skinFills: 1, totalClears: clear.mock.calls.length, totalFills: fill.mock.calls.length });
    } finally {
      watch.disconnect();
      g.clearRect = originalClear; g.fill = originalFill;
      scope.style.removeProperty('--instrument-waveform-base');
      scope.style.removeProperty('--waveform-host-color');
    }
  },
};

/** Same frame lifecycle, with a host gradient whose custom variable is not a theme token. */
export const CachedColorScrolling: Story = {
  ...CachedScrolling,
  args: { colors: ['var(--waveform-host-color, var(--instrument-waveform-base))', 'var(--instrument-waveform-base)'] },
};
