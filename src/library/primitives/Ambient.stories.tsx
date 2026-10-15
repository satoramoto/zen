import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AMBIENT_REGIONS, type AmbientRegion } from '../contract';
import { withLibraryTheme } from '../storybook';
import { Ambient } from './Ambient';
import { Surface } from './Surface';
import { Text } from './Text';

// Eight generated stills for the slideshow source: each a different pair of colour fields, so
// every region's light changes from one slide to the next.
const THUMBS = Array.from({ length: 8 }, (_, i) => {
  const a = (i * 45) % 360;
  const b = (a + 150) % 360;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${a} 80% 55%)"/><stop offset="1" stop-color="hsl(${b} 70% 25%)"/>` +
    `</linearGradient></defs><rect width="320" height="180" fill="url(#g)"/>` +
    `<circle cx="${60 + i * 28}" cy="90" r="50" fill="hsl(${(a + 60) % 360} 90% 65%)"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
});

interface AmbientArgs {
  source: 'animation' | 'thumbnails' | 'none';
  rate: number;
  smoothing: number;
  reduce: boolean;
  strength: number;
}

// The panels are plain `Surface layer="raised"`: how much light each takes is the material's (frost's
// `ambient` shares, decision 85: base and raised; what floats takes none, decision 87), so the story
// opens under visual[flow]'s pack. Other packs take none.
const meta: Meta<AmbientArgs> = {
  title: 'Design OS/Primitives/Ambient',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  globals: { theme: 'visuals' },
  args: { source: 'animation', rate: 10, smoothing: 600, reduce: false, strength: 1 },
  argTypes: {
    source: { control: 'inline-radio', options: ['animation', 'thumbnails', 'none'] },
    rate: { control: { type: 'range', min: 1, max: 30, step: 1 } },
    smoothing: { control: { type: 'range', min: 0, max: 3000, step: 50 } },
    reduce: { control: 'boolean' },
    strength: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
  },
};
export default meta;
type Story = StoryObj<AmbientArgs>;

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

/** A raised panel beside the picture (what floats takes no light, decision 87): a label in the primary ink and a caption in the muted one (held at 4.5:1). */
function Panel({ region, wide }: { region: AmbientRegion; wide?: boolean }) {
  return (
    <Surface
      layer="raised"
      ambient={region}
      style={{ gridColumn: wide ? '1 / -1' : undefined, padding: wide ? 'var(--space-3) var(--space-4)' : 'var(--space-4)', display: 'grid', gap: 'var(--space-2)', alignContent: 'start' }}
    >
      <Text role="label">
        raised · ambient=&quot;{region}&quot;
      </Text>
      <Text role="caption" tone="muted">
        Caption ink, held at 4.5:1
      </Text>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        {['raised', 'chip'].map((w) => (
          <Surface key={w} layer="raised" radius="pill" style={{ padding: 'var(--space-1) var(--space-3)' }}>
            <Text role="caption" tone="secondary">
              {w}
            </Text>
          </Surface>
        ))}
      </div>
    </Surface>
  );
}

function Demo({ source, rate, smoothing, reduce, strength }: AmbientArgs) {
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
      <Panel region="top" wide />
      <Panel region="left" />
      <Surface layer="base" style={{ padding: 'var(--space-3)', display: 'grid' }}>
        {source === 'animation' && <canvas ref={setCanvas} width={320} height={180} style={picture} aria-label="A looping colour animation" />}
        {source === 'thumbnails' && <img ref={img} src={THUMBS[slide]} alt="A generated still" style={picture} />}
        {source === 'none' && (
          <div style={{ ...picture, display: 'grid', placeItems: 'center' }}>
            <Text role="caption">No picture: the fallbacks, at strength 0</Text>
          </div>
        )}
      </Surface>
      <Panel region="right" />
      <Panel region="bottom" wide />
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

/** Generated stills as a slideshow: each change eases in over the smoothing time. */
export const Thumbnails: Story = { args: { source: 'thumbnails' }, render: (args) => <Demo {...args} /> };

/** Reduce flashing: the same picture, but the light drifts over seconds. */
export const ReduceFlashing: Story = { args: { reduce: true }, render: (args) => <Demo {...args} /> };
