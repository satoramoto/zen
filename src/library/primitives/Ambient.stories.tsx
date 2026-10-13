import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AMBIENT_REGIONS, type AmbientRegion } from '../contract';
import { withLibraryTheme } from '../storybook';
import { Ambient } from './Ambient';
import { Surface } from './Surface';
import { Text } from './Text';

// A few of the starter fixture's thumbnails, evenly spread, for the slideshow source.
const thumbFiles = import.meta.glob<string>('../visuals/fixtures/starter/thumbnails/*.webp', { eager: true, query: '?url', import: 'default' });
const ALL_THUMBS = Object.keys(thumbFiles).sort().map((k) => thumbFiles[k]);
const THUMBS = Array.from({ length: 8 }, (_, i) => ALL_THUMBS[Math.floor((i * ALL_THUMBS.length) / 8)]).filter(Boolean);

interface AmbientArgs {
  source: 'animation' | 'thumbnails' | 'none';
  rate: number;
  smoothing: number;
  reduce: boolean;
  strength: number;
  /** How much of the ambient colour the panels mix in at full strength, in %. Story only: the real wiring is the materials'. */
  tint: number;
}

const meta: Meta<AmbientArgs> = {
  title: 'Design OS/Primitives/Ambient',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { source: 'animation', rate: 10, smoothing: 600, reduce: false, strength: 1, tint: 40 },
  argTypes: {
    source: { control: 'inline-radio', options: ['animation', 'thumbnails', 'none'] },
    rate: { control: { type: 'range', min: 1, max: 30, step: 1 } },
    smoothing: { control: { type: 'range', min: 0, max: 3000, step: 50 } },
    reduce: { control: 'boolean' },
    strength: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    tint: { control: { type: 'range', min: 0, max: 80, step: 5 } },
  },
};
export default meta;
type Story = StoryObj<AmbientArgs>;

/** A panel's fill: its layer's own, mixed with one ambient region by strength × tint. */
const tinted = (region: AmbientRegion, layer: 'float' | 'base', tint: number): CSSProperties =>
  ({
    '--lib-surface-fill': `color-mix(in oklab, var(--ambient-${region}) calc(var(--ambient-strength) * ${tint}%), var(--layer-${layer}-fill))`,
    '--lib-surface-cast': `0 0 calc(var(--space-6) * 2) calc(var(--ambient-strength) * var(--space-1)) color-mix(in oklab, var(--ambient-${region}) calc(var(--ambient-strength) * ${tint}%), transparent)`,
  }) as CSSProperties;

/** A slow looping canvas animation: drifting colour fields, so each region changes on its own. */
function useAnimation(canvas: HTMLCanvasElement | null) {
  useEffect(() => {
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let raf = 0;
    const draw = (t: number) => {
      const s = t / 1000;
      const { width: w, height: h } = canvas;
      ctx.fillStyle = `hsl(${(s * 12) % 360} 40% 12%)`;
      ctx.fillRect(0, 0, w, h);
      const blob = (x: number, y: number, r: number, hue: number) => {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `hsl(${hue % 360} 90% 60%)`);
        g.addColorStop(1, `hsl(${hue % 360} 90% 60% / 0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      };
      blob(w * (0.5 + 0.42 * Math.sin(s * 0.35)), h * 0.5, h * 0.8, s * 20);
      blob(w * 0.5, h * (0.5 + 0.45 * Math.cos(s * 0.27)), h * 0.6, 160 + s * 15);
      blob(w * (0.5 - 0.4 * Math.cos(s * 0.21)), h * (0.5 + 0.3 * Math.sin(s * 0.4)), h * 0.5, 280 + s * 9);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [canvas]);
}

/** Steps an index every few seconds. */
function useSlideshow(on: boolean, length: number) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!on || length < 2) return;
    const id = setInterval(() => setI((n) => (n + 1) % length), 3000);
    return () => clearInterval(id);
  }, [on, length]);
  return i;
}

const swatch = (region: AmbientRegion): CSSProperties => ({
  width: 'var(--control-h)',
  height: 'var(--control-h)',
  background: `var(--ambient-${region})`,
});

function Demo({ source, rate, smoothing, reduce, strength, tint }: AmbientArgs) {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const img = useRef<HTMLImageElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useAnimation(source === 'animation' ? canvas : null);
  const slide = useSlideshow(source === 'thumbnails', THUMBS.length);
  useEffect(() => setImage(img.current), [source]);
  const picked = source === 'animation' ? canvas : source === 'thumbnails' ? image : null;

  const picture: CSSProperties = { width: '100%', aspectRatio: '16 / 9', display: 'block', objectFit: 'cover' };
  return (
    <Ambient
      source={picked}
      rate={rate}
      smoothing={smoothing}
      reduce={reduce}
      strength={strength}
      style={{ minHeight: '100vh', boxSizing: 'border-box', padding: 'var(--space-5)', display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 3fr) minmax(0, 1fr)', gridTemplateRows: 'auto auto auto auto', alignItems: 'stretch' }}
    >
      <Surface layer="float" style={{ ...tinted('top', 'float', tint), gridColumn: '1 / -1', padding: 'var(--space-3) var(--space-4)' }}>
        <Text role="label">Top · --ambient-top</Text>
      </Surface>
      <Surface layer="float" style={{ ...tinted('left', 'float', tint), padding: 'var(--space-4)' }}>
        <Text role="caption">Left · --ambient-left</Text>
      </Surface>
      <Surface layer="base" style={{ ...tinted('avg', 'base', tint), padding: 'var(--space-3)', display: 'grid' }}>
        {source === 'animation' && <canvas ref={setCanvas} width={320} height={180} style={picture} aria-label="A looping colour animation" />}
        {source === 'thumbnails' && <img ref={img} src={THUMBS[slide]} alt="A fixture thumbnail" style={picture} />}
        {source === 'none' && (
          <div style={{ ...picture, display: 'grid', placeItems: 'center' }}>
            <Text role="caption">No picture: the fallbacks, at strength 0</Text>
          </div>
        )}
      </Surface>
      <Surface layer="float" style={{ ...tinted('right', 'float', tint), padding: 'var(--space-4)' }}>
        <Text role="caption">Right · --ambient-right</Text>
      </Surface>
      <Surface layer="float" style={{ ...tinted('bottom', 'float', tint), gridColumn: '1 / -1', padding: 'var(--space-3) var(--space-4)' }}>
        <Text role="label">Bottom · --ambient-bottom</Text>
      </Surface>
      <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        {AMBIENT_REGIONS.map((r) => (
          <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Surface radius="control" border style={swatch(r)} />
            <Text role="caption">{r}</Text>
          </div>
        ))}
      </div>
    </Ambient>
  );
}

/** The panels round a picture take its light: each from the region it sits beside. Change the source, the rate, the easing, Reduce flashing. */
export const Playground: Story = { render: (args) => <Demo {...args} /> };

/** The fixture thumbnails as a slideshow: each change eases in over the smoothing time. */
export const Thumbnails: Story = { args: { source: 'thumbnails' }, render: (args) => <Demo {...args} /> };

/** Reduce flashing: the same picture, but the light drifts over seconds. */
export const ReduceFlashing: Story = { args: { reduce: true }, render: (args) => <Demo {...args} /> };
