import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Decorator } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { useScopePrinciples } from '../../layout/assembly/AssembledScreen';
import { resolveNeed } from '../../layout/assembly/units';
import { withLibraryTheme } from '../../storybook';
import { DISPLAY_FORMS, Display, type DisplayProps } from './Display';
import { DISPLAY_REGIONS, displayArgTypes, displayStories as s, displayStoryRegions as regions, type DisplayRegion } from './Display.fixtures';

// Every story's args come from Display.fixtures.ts, which the Svelte stories and the parity test
// share; so does the region each is drawn in (`DISPLAY_REGIONS`).

/**
 * Draws the story in its Stage region, `parameters.region` (`large` by default). The region's
 * height is a floor: where the roomier hero needs more than the original's region (the full
 * density's thicker beat cells and wider gaps), the frame grows rather than clipping the tempo
 * keys. A grid, so the hero's `height: 100%` still fills the region.
 */
const inRegion: Decorator = (Story, { parameters }) => {
  const size = DISPLAY_REGIONS[(parameters.region as DisplayRegion) ?? 'large'];
  return (
    <div style={{ display: 'grid', width: size.width, minHeight: size.height, maxWidth: '100%' }}>
      <Story />
    </div>
  );
};

/**
 * The Stage's hero: one hierarchy instead of three competing thirds. The section largest, on the
 * one `--selected` block, the tempo next, the chord a step behind, in neutral ink and no captions;
 * what's next said once, in a "then" tab hanging from the section block; the style header and One
 * Touch on one quiet line above; four beat cells under the tempo. Tempo's Tap (and Style tempo) lives
 * here and nowhere else on the Stage.
 */
const meta = {
  title: 'Yahaha/Components/Display',
  component: Display,
  decorators: [inRegion, withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: {
    ...s.Board.args!,
    onPrev: fn(),
    onNext: fn(),
    onBrowse: fn(),
    onOneTouch: fn(),
    onSound: fn(),
    onTempoUp: fn(),
    onTempoDown: fn(),
    onTempo: fn(),
    onTap: fn(),
    onStyleTempo: fn(),
  },
  argTypes: displayArgTypes,
} satisfies Meta<typeof Display>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A story from its fixture, in its region. */
const story = (name: keyof typeof s): Story => ({
  args: s[name].args as Story['args'],
  ...(regions[name] ? { parameters: { region: regions[name] } } : {}),
});

/** The board: Am7 in Main B, Main C next with the fill after bar 4, 104 BPM on beat 2, One Touch 2. */
export const Board: Story = story('Board');

/** Stopped with the last chord held, Coastal Highway queued, a clean rack: "Stopped", the beat cells at rest. */
export const Stopped: Story = story('Stopped');

/** Sync Start armed, Intro II armed: the band starts on the first chord. */
export const SyncStartArmed: Story = story('SyncStartArmed');

/** A long chord name: the hero size steps down until it fits its column. */
export const LongChord: Story = story('LongChord');

/** A long style name: the genre · metre drops first, then the name ends in an ellipsis (the full name in its title). */
export const LongStyleName: Story = story('LongStyleName');

/** A long fingering: the notes over it, the fingering on one line ending in an ellipsis (whole in the chord's spoken name and tooltip). */
export const LongFingering: Story = story('LongFingering');

/** Right 1 and Right 3 off: their dots hollow, "· off" after the part's name (just "off" in the one-row strip of a narrow hero). */
export const PartOff: Story = story('PartOff');

/** A waltz in 3/4: three beat cells, on beat 3. */
export const ThreeFour: Story = story('ThreeFour');

/** Main D looping, nothing queued: no "then" tab; the beat cells say where the bar is. */
export const Looping: Story = story('Looping');

/** A fill with Ending II waiting. */
export const FillToEnding: Story = story('FillToEnding');

/** Without parts, as the Stage may draw it (its mixer names the sounds): three readouts. */
export const NoParts: Story = story('NoParts');

/**
 * The Stage's hero column at 1440×900, 660 × 250: auto is compact there, so the readouts stop at
 * their compact caps (60 / 52 / 44); below a 900px hero the parts are not drawn (the Stage's
 * mixer names the sounds).
 */
export const StageColumn: Story = story('StageColumn');

/**
 * About the column a 1217×752 Stage has unzoomed, at the compact form's least width on the compact
 * scale (454 × 200): every readout at its floor, the notes over the fingering.
 */
export const StageColumnSmall: Story = story('StageColumnSmall');

/** The narrow column with the longest section name, "Ending III", and the long fingering: the three readouts step down together so each keeps its cell and the ranking holds, the fingering ends in an ellipsis. */
export const StageColumnSmallLong: Story = story('StageColumnSmallLong');

/** Compact in a short, wide region (1169 × 200): the readouts stop at 60 / 52 / 44px, so the hero fits in 200px. */
export const Compact: Story = story('Compact');

/** Full in the Stage's column (660 × 250), without parts as the Stage draws it: the roomy chrome, when the region has the height. */
export const FullInColumn: Story = story('FullInColumn');

/** The board in a 1217×752 Stage's region: every size scales with the width (auto: compact below 1200px wide). */
export const SmallStage: Story = story('SmallStage');

/** The long chord in the small region. */
export const SmallStageLongChord: Story = story('SmallStageLongChord');

/** At the style's own tempo (104 of 104): the Style tempo key takes the unavailable face, still focusable. */
export const AtStyleTempo: Story = story('AtStyleTempo');

/** The three forms side by side, each in a frame exactly its least, resolved for the pack worn. */
function FormsAtLeast(args: DisplayProps) {
  const p = useScopePrinciples();
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 24, padding: 16 }}>
      {DISPLAY_FORMS.map((f) => {
        const { w, h } = resolveNeed(f.min, p);
        return (
          <figure key={f.id} style={{ margin: 0, display: 'grid', gap: 8 }}>
            <figcaption style={{ font: 'inherit', opacity: 0.7 }}>
              {f.id}: {Math.round(w)} × {Math.round(h)} ({(w / p.scale.control).toFixed(1)} × {(h / p.scale.control).toFixed(1)} control heights)
            </figcaption>
            <div data-testid={`form-${f.id}`} style={{ display: 'flex', width: w, height: h }}>
              <Display {...args} form={f.id} />
            </div>
          </figure>
        );
      })}
    </div>
  );
}

/**
 * Full, compact and minimal at their least: every concept drawn, nothing cut off (the needs are
 * Display.forms.ts's, resolved against this pack's scale). Without parts, as the Stage draws it.
 */
export const Forms: Story = {
  ...story('Forms'),
  render: (args) => <FormsAtLeast {...args} />,
  play: async ({ canvasElement }) => {
    for (const id of ['full', 'compact', 'minimal']) {
      const frame = canvasElement.querySelector<HTMLElement>(`[data-testid='form-${id}']`)!;
      const display = frame.querySelector<HTMLElement>('.yh-display')!;
      await expect(display).toHaveAttribute('data-form', id);
      // The hero fills its frame and its content stays inside it.
      const box = frame.getBoundingClientRect();
      for (const el of display.querySelectorAll<HTMLElement>('[data-part]')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || getComputedStyle(el).position === 'absolute') continue;
        await expect(r.right, `${id} ${el.dataset.part} right`).toBeLessThanOrEqual(box.right + 1);
        await expect(r.bottom, `${id} ${el.dataset.part} bottom`).toBeLessThanOrEqual(box.bottom + 1);
      }
    }
  },
};

/** With the background art at the right edge, without parts. */
export const WithArt: Story = story('WithArt');
