import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { resolveNeed, useScopePrinciples, type Forms as FormList } from '../../layout/assembly';
import { Stack } from '../../primitives/Stack';
import { Text } from '../../primitives/Text';
import {
  FORM_FORMS,
  SONG_FORM_FORMS,
  SongForm,
  TRANSPORT_FORMS,
  type FormFormId,
  type SongFormPart,
  type SongFormProps,
  type TransportFormId,
} from './SongForm';
import {
  songFormBoard,
  songFormFillPending,
  songFormSparse,
  songFormStopped,
  songFormSyncArmed,
} from './SongForm.fixtures';

/**
 * The region's box on the Stage: `regionWidth` in a story's parameters sets its width, and
 * `regionHeight` gives it a height, as the Stage's strip does (the steps then fill it).
 */
const atWidth: Decorator = (Story, context) => {
  const width = (context.parameters.regionWidth as number | undefined) ?? 1392;
  const height = context.parameters.regionHeight as number | undefined;
  return (
    <div style={{ width, maxWidth: '100%', height }}>
      <Story />
    </div>
  );
};

/**
 * The Stage's song form and transport, one region. It replaces three places in the original:
 * PadBank's Sections bank (Yahaha baseline / Components / PadBank › Board), SectionRow's transport
 * (Components / SectionRow) and TransportColumn (Components / TransportColumn). Default width
 * 1392, the 1440 × 900 board inside its padding; see `At1217` and `Narrow` for smaller Stages.
 */
const meta = {
  title: 'Yahaha/Components/SongForm',
  component: SongForm,
  decorators: [atWidth, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    ...songFormBoard,
    lit: true,
    tipAction: fn(),
    onSection: fn(),
    onStartStop: fn(),
    onStopWithFade: fn(),
    onAccomp: fn(),
    onSyncStart: fn(),
    onSyncStop: fn(),
    onAutoFill: fn(),
    onFillUp: fn(),
    onFillDown: fn(),
    onFade: fn(),
    onReset: fn(),
  },
  argTypes: {
    running: { control: 'boolean' },
    fillPending: { control: 'inline-radio', options: [undefined, 'up', 'down'] },
    lit: { control: 'boolean' },
    nextAt: { control: 'text' },
  },
} satisfies Meta<typeof SongForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Stopped (SectionRow's board): Main A chosen to start, underlined rather than filled (nothing sounds); Start on the `--transport` fill, the one saturated key; Accomp on as an outline with its LED lit; the sync and fill keys neutral until armed or queued. */
export const Stopped: Story = {
  args: { ...songFormStopped, next: undefined, nextAt: undefined },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const start = canvas.getByRole('button', { name: 'Start / Stop, stopped' });
    await expect(start).toHaveAttribute('aria-pressed', 'false');
    await expect(canvas.getByRole('button', { name: 'Main A, starts here' })).toHaveAttribute('data-state', 'idle');
    await userEvent.click(start);
    await expect(args.onStartStop).toHaveBeenCalledTimes(1);
  },
};

/** Running in Main B with Main C next after bar 4 (PadBank's board). A press on a section queues it. */
export const Board: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Main B, playing' })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: 'Main C, next, after bar 4' })).toBeInTheDocument();
    await expect(canvas.getByText('NEXT')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Ending I' }));
    await expect(args.onSection).toHaveBeenCalledWith('ending1');
  },
};

/** The flash's off phase: Main C keeps its NEXT tag; its accent wash goes. */
export const FlashOff: Story = { args: { lit: false } };

/** Fill ▲ queued: the key waits, and the spoken cue says "Fill, then Main C, after bar 4". */
export const FillPending: Story = {
  args: songFormFillPending,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status')).toHaveTextContent('Fill, then Main C, after bar 4');
    await expect(
      canvas.getByRole('button', { name: 'Fill Up: a fill, then the next Main up, queued' }),
    ).toHaveAttribute('data-face', 'waiting');
  },
};

/** Sync Start armed on Intro I: its key waits, the only transport-hue ring in the cluster, and the spoken cue says the band starts with the first chord. */
export const SyncStartArmed: Story = {
  args: { ...songFormSyncArmed, next: undefined, nextAt: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Sync Start, armed' })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByText('Starts with the first chord')).toBeInTheDocument();
  },
};

/** A style missing sections: one Intro, two Mains, one Ending, no Break; Auto Fill on. Absent steps keep their place. */
export const MissingSections: Story = {
  args: songFormSparse,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Main D, not in this style' }));
    await expect(args.onSection).not.toHaveBeenCalled();
    await expect(canvas.getByRole('button', { name: 'Auto Fill' })).toHaveAttribute('aria-pressed', 'true');
  },
};

/** A fade-out under way while running: Fade rings in the ink colour, not a fill (a fill means sounding). */
export const Fading: Story = { args: { fading: true } };

/** The 1217 × 752 Stage: the region 1169 wide, the form over the transport (as `both` always is), its steps at numeral size. */
export const At1217: Story = { parameters: { regionWidth: 1169 } };

/** A narrow column (720): the transport under the form, in two rows sharing its width; the steps at body size so the form stays one row. */
export const Narrow: Story = { parameters: { regionWidth: 720 } };

/**
 * The form alone (`part="form"`), as the stacked Stage's strip on the 1440 × 900 board: the
 * container is 72 tall and the steps fill it, captions in its top padding; nothing sets SongForm's
 * own variables.
 */
export const FormPart: Story = {
  args: { part: 'form' },
  parameters: { regionWidth: 1392, regionHeight: 72 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('group', { name: 'Sections' })).toBeInTheDocument();
    await expect(canvas.queryByRole('group', { name: 'Transport' })).toBeNull();
    const form = canvasElement.querySelector('.yh-songform__form') as HTMLElement;
    await expect(Math.round(form.getBoundingClientRect().height)).toBe(72);
  },
};

/**
 * The form alone in the 1217 × 752 Stage's strip at its floor: the `strip` form's least, 66.3
 * tall in the compact packs (the steps one numeral, their inset and borders, the captions over
 * them), here 67; still one row.
 */
export const FormPartSmall: Story = {
  args: { part: 'form' },
  parameters: { regionWidth: 1169, regionHeight: 67 },
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('.yh-songform__form') as HTMLElement;
    await expect(Math.round(form.getBoundingClientRect().height)).toBe(67);
  },
};

/** The form alone with no height given: the steps take their default, two control heights. */
export const FormPartAuto: Story = { args: { part: 'form' } };

/** The transport alone (`part="transport"`), as the stacked Stage sets it beside the hero; running. */
export const TransportPart: Story = {
  args: { part: 'transport' },
  parameters: { regionWidth: 520 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('group', { name: 'Transport' })).toBeInTheDocument();
    await expect(canvas.queryByRole('group', { name: 'Sections' })).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Auto Fill' })).toBeInTheDocument();
  },
};

/**
 * The transport alone given a height, as beside the 1440 × 900 hero: the key rows share it, and
 * past five control heights tall and 25 wide (700 at the compact density) the labels grow with
 * the keys (body size, Start / Stop at display).
 */
export const TransportPartTall: Story = {
  args: { part: 'transport' },
  parameters: { regionWidth: 720, regionHeight: 210 },
};

/**
 * Every form of each half, drawn in a box exactly its declared least (`min`) and its `ideal`, at
 * the theme's scale (the toolbar's pack): nothing may be cut off at its least, and at its ideal it
 * looks as designed. The dashed edge is the box; it clips, so a need that lied would show. The
 * transport runs `keys` (two rows) → `tight` (three rows, no taller than the hero's least) →
 * `compact` (four rows, the narrowest), each narrower than the one before.
 */
export const Forms: Story = {
  render: (args) => <FormsSheet {...args} />,
  play: async ({ canvasElement }) => {
    const boxes = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-specimen]'));
    await expect(boxes.length).toBe((TRANSPORT_FORMS.length + FORM_FORMS.length + SONG_FORM_FORMS.length) * 2);
    for (const box of boxes) {
      const name = box.getAttribute('data-specimen');
      await expect(box.scrollWidth, `${name} width`).toBeLessThanOrEqual(box.clientWidth + 1);
      await expect(box.scrollHeight, `${name} height`).toBeLessThanOrEqual(box.clientHeight + 1);
    }
  },
};

function FormsSheet(args: SongFormProps) {
  const p = useScopePrinciples();
  const rows: { part: SongFormPart; forms: FormList; pin: (id: string) => Partial<SongFormProps> }[] = [
    { part: 'transport', forms: TRANSPORT_FORMS, pin: (id) => ({ transportForm: id as TransportFormId }) },
    { part: 'form', forms: FORM_FORMS, pin: (id) => ({ formForm: id as FormFormId }) },
    {
      part: 'both',
      forms: SONG_FORM_FORMS,
      pin: (id) => {
        const parts = SONG_FORM_FORMS.find((f) => f.id === id)!.parts!;
        return { formForm: parts.form as FormFormId, transportForm: parts.transport as TransportFormId };
      },
    },
  ];
  return (
    <Stack gap={6}>
      {rows.flatMap(({ part, forms, pin }) =>
        forms.flatMap((f) =>
          (['min', 'ideal'] as const).map((at) => {
            const { w, h } = resolveNeed(f[at], p);
            return (
              <Stack key={`${part}-${f.id}-${at}`} gap={2}>
                <Text role="caption" tone="muted">
                  {`${part} · ${f.id} · ${at} ${Math.round(w)} × ${Math.round(h)}`}
                </Text>
                <div
                  data-specimen={`${part} ${f.id} ${at}`}
                  style={{ width: w, height: h, display: 'flex', flexDirection: 'column', overflow: 'hidden', outline: '1px dashed var(--border)' }}
                >
                  <SongForm {...args} part={part} {...pin(f.id)} />
                </div>
              </Stack>
            );
          }),
        ),
      )}
    </Stack>
  );
}

/** The transport alone while stopped with Sync Start armed: Start the one fill, Sync Start the one transport-hue ring. */
export const TransportPartStopped: Story = {
  args: { ...songFormSyncArmed, part: 'transport', next: undefined, nextAt: undefined },
  parameters: { regionWidth: 520 },
};
