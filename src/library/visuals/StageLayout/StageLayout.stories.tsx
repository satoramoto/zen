import { useState, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Layer } from '../../layout/Layer';
import { withLibraryTheme } from '../../storybook';
import { VISUALS_GLOBALS, visualsBeforeEach, withVisualsFrame } from '../fixtures/story';
import { Icon } from '../Icon/Icon';
import { useLiveKeys } from '../model/liveKeys';
import { crateModeFor, escapeDoes, panelsAtStart, STAGE_CRATE_ID, toggleCrate, togglePanels, type Panels } from '../model/stage-model';
import { ViewSwitch } from '../Views/Views';
import { crateDocks, StageLayout } from './StageLayout';
import { useLayoutPrinciples } from '../HomeLayout/HomeLayout';

/** The window a story draws, and how it starts. */
interface Args {
  width: number;
  height: number;
  /** The crate shown (true), put away (false), or as the width has it (null). */
  crate: boolean | null;
  /** The panels hidden at start, as `\` hides them. */
  hidden: boolean;
  warning: boolean;
  inWindow: boolean;
  /** Esc held at start, as if pressed and not let go: the progress toward leaving. */
  leaving?: boolean;
}

/** The stand-in parts' looks (the real ones are their own stories'): base layers over the picture, the Stage's opaque scope making them solid. */
const capsule: CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 8px', borderRadius: 12, color: 'var(--text-2)', fontSize: 'var(--size-caption)' };
const panel: CSSProperties = { padding: '14px 18px', borderRadius: 18, color: 'var(--text-2)', fontSize: 'var(--size-body)' };
const heading: CSSProperties = { margin: '6px 10px', color: 'var(--text-3)', fontSize: 'var(--size-caption)', fontWeight: 'var(--weight-strong)' as CSSProperties['fontWeight'] };
const row: CSSProperties = { height: 36, padding: '0 10px', border: 0, borderRadius: 8, background: 'none', color: 'inherit', font: 'inherit', textAlign: 'left' };

/** The native window buttons' stand-in: three 12px dots where macOS puts them (x 24, centred on y 28). */
function Lights() {
  return (
    <span aria-hidden="true" style={{ position: 'absolute', top: 22, left: 24, zIndex: 11, display: 'flex', gap: 8, pointerEvents: 'none' }}>
      {[0, 1, 2].map((i) => (
        <i key={i} style={{ width: 12, height: 12, borderRadius: 6, background: 'color-mix(in oklab, var(--text-1) 18%, transparent)' }} />
      ))}
    </span>
  );
}

/**
 * The Stage on stand-in parts (the header's capsules, the dock and the crate
 * are their own stories'), working as Live wires it: the crate's toggle, `\` to
 * hide and show the panels, Esc showing hidden panels, Esc or a press outside
 * putting a laid-over crate away.
 */
function Composed({ width, height, crate, hidden, warning, inWindow, leaving: heldAtStart = false }: Args) {
  const [panels, setPanels] = useState<Panels>(hidden ? togglePanels(panelsAtStart(crate)) : panelsAtStart(crate));
  const [leaving, setLeaving] = useState(heldAtStart);
  const [left, setLeft] = useState(false);
  // Where the crate docks is the assembled Stage's answer for this window, as Live asks it.
  const docks = crateDocks({ w: width, h: height }, useLayoutPrinciples());
  const open = crateModeFor(docks, panels.crate) !== 'hidden';
  const none = () => {};
  // Live's keys as Live wires them: Esc pressed shows hidden panels, held 3 s leaves (here, says so).
  useLiveKeys({
    editor: () => setLeft(true),
    act: none,
    fx: none,
    rate: none,
    favourite: none,
    help: none,
    sheetOpen: () => false,
    panels: () => setPanels(togglePanels),
    escape: () => {
      if (escapeDoes(panels) === 'show') {
        setPanels(togglePanels);
        return true;
      }
      // A crate laid over the picture takes Esc before live does.
      if (crateModeFor(docks, panels.crate) !== 'overlay') return false;
      setPanels((p) => ({ ...p, crate: false }));
      return true;
    },
    holding: setLeaving,
  });
  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden' }} data-left={left ? '' : undefined}>
      <StageLayout
        width={width}
        height={height}
        panels={panels}
        warning={warning}
        inWindow={inWindow}
        leaving={leaving}
        onCrateAway={() => setPanels((p) => ({ ...p, crate: false }))}
        crate={
          <div style={{ display: 'grid', gap: 2, padding: 8, color: 'var(--text-2)', fontSize: 'var(--size-body)' }}>
            <h2 style={heading}>Playlists</h2>
            <button type="button" style={row}>
              Warm-up
            </button>
            <button type="button" style={row}>
              Peak time
            </button>
            <h2 style={heading}>Moods</h2>
            <button type="button" style={row}>
              Hypnotic
            </button>
          </div>
        }
        head={
          <>
            <Layer level="base" style={capsule}>
              <button type="button" style={row} aria-label="crate" aria-controls={STAGE_CRATE_ID} aria-expanded={open} onClick={() => setPanels((p) => toggleCrate(p, docks))}>
                <Icon name="sidebar" />
              </button>
              <ViewSwitch view="live" onChange={() => {}} />
            </Layer>
            <span style={{ flex: 1, alignSelf: 'stretch' }} data-tauri-drag-region />
            <Layer level="base" style={capsule}>
              Beat · Output · ? · ⚙
            </Layer>
          </>
        }
        dock={
          <div style={{ display: 'grid', gap: 6, padding: '14px var(--mat-plate-inset)', color: 'var(--text-2)', fontSize: 'var(--size-body)' }}>
            <span>
              <b style={{ color: 'var(--text-1)' }}>Flexi - mindblob</b> from Warm-up · 3 of 10
            </span>
            <span>Next: Geiss - Cosmic Dust · Strobe · Blackout · Freeze · Intensity</span>
          </div>
        }
        centre={
          warning ? (
            <Layer level="overlay" role="alertdialog" aria-label="flashing lights" style={{ ...panel, maxWidth: 420 }}>
              Live mode can show flashing lights. I understand.
            </Layer>
          ) : inWindow ? (
            <Layer level="base" style={panel}>
              <button type="button">Go full screen on Projector</button>
            </Layer>
          ) : undefined
        }
      >
        <Lights />
      </StageLayout>
    </div>
  );
}

const meta = {
  title: 'open[flow]/visuals/Live/Stage/Layout',
  component: Composed,
  decorators: [withVisualsFrame, withLibraryTheme],
  globals: VISUALS_GLOBALS,
  beforeEach: visualsBeforeEach,
  args: { width: 1440, height: 900, crate: null, hidden: false, warning: false, inWindow: false, leaving: false },
  parameters: { scope: 'bare', layout: 'fullscreen' },
} satisfies Meta<typeof Composed>;
export default meta;
type Story = StoryObj<typeof meta>;

const picture = (canvas: { getByRole: (role: string, o: { name: RegExp }) => HTMLElement }) => canvas.getByRole('img', { name: /preview of the playing preset/ });

/** 1440 × 900: the crate docked over the picture's left edge, the header and the dock beside it, the picture the whole window. */
export const Wide: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('navigation', { name: 'playlists and up next' })).toBeVisible();
    await expect(canvas.getByRole('region', { name: 'Live controls' })).toBeVisible();
    const hole = picture(canvas).getBoundingClientRect();
    await expect([hole.left, hole.top, hole.width, hole.height]).toEqual([0, 0, 1440, 900]);
  },
};

/** 800 wide: the crate starts put away; its toggle lays it over, Escape puts it away. */
export const Narrow: Story = {
  args: { width: 800 },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('navigation', { name: 'playlists and up next' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'crate' }));
    await expect(canvas.getByRole('navigation', { name: 'playlists and up next' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(canvas.queryByRole('navigation', { name: 'playlists and up next' })).toBeNull());
  },
};

/** The crate laid over the picture in a narrow window. */
export const CrateOver: Story = {
  args: { width: 800, crate: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('navigation', { name: 'playlists and up next' })).toBeVisible();
    const hole = picture(canvas).getBoundingClientRect();
    await expect([hole.left, hole.width]).toEqual([0, 800]);
  },
};

/** `\` hid the panels: only the picture, and at the bottom (the pointer near it) the hint; `\` brings them back. */
export const PanelsHidden: Story = {
  args: { hidden: true },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('region', { name: 'Live controls' })).toBeNull();
    await expect(canvas.getByText('for controls', { exact: false })).toBeInTheDocument();
    await userEvent.keyboard('\\');
    await expect(await canvas.findByRole('region', { name: 'Live controls' })).toBeVisible();
  },
};

/** Playing in the window: the "Go full screen on…" offer over the picture, under the header. */
export const Windowed: Story = {
  args: { inWindow: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Go full screen on Projector' })).toBeVisible();
  },
};

/** Esc held to leave live: a ring filling over 3 s and "Keep holding Esc to leave live" over the picture's middle; let go early, it goes. */
export const EscHeld: Story = {
  args: { leaving: true },
  play: async ({ canvas, canvasElement }) => {
    // It shows after a beat, so a short press shows nothing.
    await waitFor(() => expect(canvas.getByText('Keep holding Esc to leave live')).toBeVisible());
    // Held from the keyboard (one user, so it knows the key is down): shows, and let go early, goes without leaving.
    const user = userEvent.setup();
    await user.keyboard('{Escape>}');
    await user.keyboard('{/Escape}');
    await waitFor(() => expect(canvas.queryByText('Keep holding Esc to leave live')).toBeNull());
    await user.keyboard('{Escape>}');
    await expect(await canvas.findByRole('status')).toBeInTheDocument();
    await user.keyboard('{/Escape}');
    await waitFor(() => expect(canvas.queryByRole('status')).toBeNull());
    await expect(canvasElement.querySelector('[data-left]')).toBeNull();
  },
};

/** The flashing warning owed: a dark window, the warning where the picture would be, the controls dimmed and inert. */
export const Warning: Story = {
  args: { warning: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('alertdialog', { name: 'flashing lights' })).toBeVisible();
    await expect(canvas.queryByRole('img', { name: /preview of the playing preset/ })).toBeNull();
  },
};
