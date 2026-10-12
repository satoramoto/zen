import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { LAYERS, type LayerName } from '../contract';
import { withLibraryTheme } from '../storybook';
import { Hole, Layer, Opaque } from './Layer';

/** A busy picture standing in for what's behind the page (a video, a GPU preview): it shows what a layer blurs or hides. */
const PICTURE: CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(45deg, var(--hue-1) 0 18px, var(--hue-2) 18px 36px, var(--hue-3) 36px 54px, var(--hue-4) 54px 72px)',
};

const caption: CSSProperties = { color: 'var(--text-3)', fontSize: 'var(--size-caption)', textTransform: 'var(--label-case)' as CSSProperties['textTransform'] };

interface LayerArgs {
  level: LayerName;
  overPicture: boolean;
  opaque: boolean;
}

const meta: Meta<LayerArgs> = {
  title: 'Design OS/Layout/Layer',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { level: 'float', overPicture: true, opaque: false },
  argTypes: {
    level: { control: 'inline-radio', options: [...LAYERS] },
    overPicture: { control: 'boolean' },
    opaque: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<LayerArgs>;

function Surface({ level }: { level: LayerName }) {
  return (
    <Layer level={level} style={{ padding: 'var(--space-4)', minHeight: 96, display: 'grid', alignContent: 'end' }}>
      <span style={caption}>{level}</span>
    </Layer>
  );
}

/** One layer, chosen by `level`. Over the picture, a translucent layer shows (or blurs) it; `opaque` wraps it in `Opaque`. */
export const Level: Story = {
  render: ({ level, overPicture, opaque }) => {
    const surface = <Surface level={level} />;
    return (
      <div style={{ ...(overPicture ? PICTURE : {}), padding: 'var(--space-6)', maxWidth: 480 }}>
        {opaque ? <Opaque>{surface}</Opaque> : surface}
      </div>
    );
  },
};

/** Every level of the depth stack, back to front, over the picture, so each one's fill, edge, shadow and backdrop can be compared. */
export const Levels: Story = {
  argTypes: { level: { table: { disable: true } } },
  render: ({ overPicture, opaque }) => {
    const row = (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--space-4)' }}>
        {LAYERS.map((l) => (
          <Surface key={l} level={l} />
        ))}
      </div>
    );
    return <div style={{ ...(overPicture ? PICTURE : {}), padding: 'var(--space-6)' }}>{opaque ? <Opaque>{row}</Opaque> : row}</div>;
  },
};

/** Nested depth: a base plate holding a raised control, with a float popover over both. */
export const Stack: Story = {
  argTypes: { level: { table: { disable: true } } },
  render: ({ overPicture, opaque }) => {
    const stack = (
      <Layer level="base" style={{ padding: 'var(--space-6)', display: 'grid', gap: 'var(--space-4)', maxWidth: 420 }}>
        <span style={caption}>base</span>
        <Layer level="raised" style={{ padding: 'var(--space-3)' }}>
          <span style={caption}>raised</span>
        </Layer>
        <Layer level="float" style={{ padding: 'var(--space-3)', marginLeft: 'var(--space-6)' }}>
          <span style={caption}>float</span>
        </Layer>
      </Layer>
    );
    return <div style={{ ...(overPicture ? PICTURE : {}), padding: 'var(--space-6)' }}>{opaque ? <Opaque>{stack}</Opaque> : stack}</div>;
  },
};

/** Opaque: the same panels with and without it, side by side over the picture. Inside, every layer draws its solid fill and blurs nothing. */
export const OpaqueScope: Story = {
  name: 'Opaque',
  args: { level: 'overlay' },
  argTypes: { overPicture: { table: { disable: true } }, opaque: { table: { disable: true } } },
  render: ({ level }) => (
    <div style={{ ...PICTURE, padding: 'var(--space-6)', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--space-6)', maxWidth: 640 }}>
      <Surface level={level} />
      <Opaque>
        <Surface level={level} />
      </Opaque>
    </div>
  ),
};

/** Hole: a cell of the screen that paints nothing, beside a base plate, so the picture behind shows through; the panel over it sits in an `Opaque` scope (turn `opaque` off to see why). */
export const HoleThrough: Story = {
  name: 'Hole',
  args: { level: 'float', opaque: true },
  argTypes: { overPicture: { table: { disable: true } } },
  render: ({ level, opaque }) => {
    const panel = (
      <Layer level={level} style={{ padding: 'var(--space-3)', position: 'absolute', right: 'var(--space-4)', bottom: 'var(--space-4)', width: 200 }}>
        <span style={caption}>{level} over the hole</span>
      </Layer>
    );
    return (
      <div style={{ ...PICTURE, padding: 'var(--space-6)', display: 'grid', gridTemplateColumns: '180px minmax(0, 1fr)', gap: 'var(--space-4)', maxWidth: 720 }}>
        <Layer level="base" style={{ padding: 'var(--space-4)', minHeight: 260 }}>
          <span style={caption}>base plate</span>
        </Layer>
        <Hole name="Preview" style={{ position: 'relative', minHeight: 260 }}>
          {opaque ? <Opaque>{panel}</Opaque> : panel}
        </Hole>
      </div>
    );
  },
};
