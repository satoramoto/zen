import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { LineSlider, type LineSliderProps } from './LineSlider';
import LineSliderSvelte from './LineSlider.svelte';
import { lineSliderArgTypes, lineSliderStories as s } from './LineSlider.fixtures';

// Every story is built from LineSlider.fixtures.ts (`story(s.Name)`), which the tree snapshot shares;
// the toolbar's Renderer draws it with React's or Svelte's `Tree`. The plays are the behaviours.

const meta = {
  title: 'Design OS/Components/Core/LineSlider',
  component: LineSlider,
  decorators: [withRenderer, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { ...(s.Board.args as LineSliderProps), onchange: fn(), tipAction: fn() },
  argTypes: lineSliderArgTypes,
} satisfies Meta<typeof LineSlider>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(LineSlider, LineSliderSvelte);

/**
 * The Chord page's Chord settle: 10 ms of 0–30. → asks for 11, End for 30, Home for 0, Page Up for
 * 20; the value text carries the unit. A press at the line's middle asks for 15.
 */
export const Board: Story = {
  ...story(s.Board),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByRole('slider', { name: 'Chord settle' });
    await expect(slider).toHaveAttribute('aria-valuenow', '10');
    await expect(slider).toHaveAttribute('aria-valuemin', '0');
    await expect(slider).toHaveAttribute('aria-valuemax', '30');
    await expect(slider).toHaveAttribute('aria-valuetext', '10 ms');
    await expect(slider).toHaveAttribute('data-tip', 'settings.chord_settle');
    await expect(args.tipAction).toHaveBeenCalledWith(slider, 'settings.chord_settle');
    await expect(canvasElement).toHaveTextContent('10ms');

    slider.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(args.onchange).toHaveBeenLastCalledWith(11);
    await userEvent.keyboard('{ArrowLeft}');
    await expect(args.onchange).toHaveBeenLastCalledWith(9);
    await userEvent.keyboard('{End}');
    await expect(args.onchange).toHaveBeenLastCalledWith(30);
    await userEvent.keyboard('{Home}');
    await expect(args.onchange).toHaveBeenLastCalledWith(0);
    await userEvent.keyboard('{PageUp}');
    await expect(args.onchange).toHaveBeenLastCalledWith(20);
    await expect(args.onchange).toHaveBeenCalledTimes(5);
    // Controlled: nothing moved until the parent passes a new value.
    await expect(slider).toHaveAttribute('aria-valuenow', '10');

    const track = slider.firstElementChild as HTMLElement;
    track.getBoundingClientRect = () => ({ left: 0, width: 120, top: 0, height: 2 }) as DOMRect;
    await fireEvent.pointerDown(slider, { button: 0, pointerId: 1, clientX: 60 });
    await expect(args.onchange).toHaveBeenLastCalledWith(15);
    await fireEvent.pointerUp(slider, { pointerId: 1 });
  },
};

/** At the top: End and → ask for nothing, since the value is already the most it can be. */
export const AtMax: Story = {
  ...story(s.AtMax),
  play: async ({ canvasElement, args }) => {
    const slider = within(canvasElement).getByRole('slider');
    slider.focus();
    await userEvent.keyboard('{End}');
    await userEvent.keyboard('{ArrowRight}');
    await expect(args.onchange).not.toHaveBeenCalled();
  },
};

/** A value shown as a word with a fractional step: "5.0 s" of a 0–10 s fade, a step of 0.5. */
export const ValueText: Story = {
  ...story(s.ValueText),
  play: async ({ canvasElement, args }) => {
    const slider = within(canvasElement).getByRole('slider', { name: 'Fade in' });
    await expect(slider).toHaveAttribute('aria-valuetext', '5.0 s');
    slider.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(args.onchange).toHaveBeenLastCalledWith(5.5);
  },
};

/**
 * Disabled: the line in the faint ink and the value in the muted one, still focusable and
 * announced as disabled; keys and presses ask for nothing.
 */
export const Disabled: Story = {
  ...story(s.Disabled),
  play: async ({ canvasElement, args }) => {
    const slider = within(canvasElement).getByRole('slider');
    await expect(slider).toHaveAttribute('aria-disabled', 'true');
    await expect(slider).toHaveAttribute('tabindex', '0');
    slider.focus();
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard('{End}');
    await fireEvent.pointerDown(slider, { button: 0, pointerId: 1, clientX: 60 });
    await expect(args.onchange).not.toHaveBeenCalled();
  },
};

/** At the bottom of the range: the rail still shows the whole line, so the range reads when empty. */
export const AtMin: Story = story(s.AtMin);

/**
 * New: a column of Settings rows, live. The numerals right-align and the lines never shift as digits
 * change. Its own React `render` (live state and a labelled grid), so it stays React-only.
 */
export const SettingsColumn: Story = {
  render: function Column() {
    const [settleRow, fadeRow, swingRow] = s.SettingsColumn.items as LineSliderProps[];
    const [settle, setSettle] = useState(settleRow.value);
    const [fade, setFade] = useState(fadeRow.value);
    const [swing, setSwing] = useState(swingRow.value);
    const rows = [
      { label: settleRow.name, el: <LineSlider {...settleRow} value={settle} onchange={setSettle} /> },
      { label: fadeRow.name, el: <LineSlider {...fadeRow} value={fade} valueText={fade.toFixed(1)} onchange={setFade} /> },
      { label: swingRow.name, el: <LineSlider {...swingRow} value={swing} onchange={setSwing} /> },
    ];
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'max-content max-content', alignItems: 'center', columnGap: 'var(--space-6)' }}>
        {rows.map((r) => (
          <div key={r.label} style={{ display: 'contents' }}>
            <span style={{ color: 'var(--text-2)', textTransform: 'var(--label-case)' as 'none' }}>{r.label}</span>
            {r.el}
          </div>
        ))}
      </div>
    );
  },
};
