import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { ActionButton, ButtonFace } from './ActionButton';

const Cross = () => (
  <svg width="10" height="10" viewBox="0 0 9 9" aria-hidden="true">
    <path d="M1 1l7 7M8 1l-7 7" stroke="currentColor" strokeWidth="1.2" fill="none" />
  </svg>
);
const Plus = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
    <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.4" fill="none" />
  </svg>
);
const Trash = () => (
  <svg width="11" height="12" viewBox="0 0 11 12" aria-hidden="true">
    <path d="M1 3h9M4 3V1.5h3V3M2.5 3l.6 7.5h4.8L8.5 3" stroke="currentColor" strokeWidth="1.2" fill="none" />
  </svg>
);

const row = { display: 'flex', gap: 'var(--space-3)', alignItems: 'end', flexWrap: 'wrap' } as const;

const meta = {
  title: 'Design OS/Components/Core/ActionButton',
  component: ActionButton,
  decorators: [withLibraryTheme],
  args: { onPress: fn(), children: 'Export' },
  argTypes: {
    tone: { control: 'inline-radio', options: ['normal', 'quiet', 'danger'] },
    width: { control: { type: 'number', min: 24, max: 320 } },
  },
} satisfies Meta<typeof ActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A word on a key; a press reports the event. */
export const Normal: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Export' }));
    await expect(args.onPress).toHaveBeenCalledTimes(1);
  },
};

/** An icon with a word. */
export const IconAndWord: Story = {
  args: {
    children: (
      <>
        <Plus /> Add
      </>
    ),
  },
};

/** Icon only: `label` names it for assistive technology. */
export const IconOnly: Story = {
  args: { tone: 'quiet', label: 'Close', title: 'Close (Esc)', children: <Cross /> },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Close' })).toBeInTheDocument();
  },
};

/** A caption above names it too, when no `label` is given. */
export const Captioned: Story = {
  args: { name: 'Stems', children: 'Write', hint: 'Writes each part to its own file' },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Stems' });
    await expect(button.closest('[data-hint]')).toHaveAttribute('data-hint', 'Writes each part to its own file');
  },
};

/** Danger is ordinary until pointed at. */
export const Danger: Story = {
  args: {
    tone: 'danger',
    children: (
      <>
        <Trash /> Delete
      </>
    ),
  },
};

/** A fixed width in px. */
export const FixedWidth: Story = { args: { width: 160, children: 'Replace' } };

/** Disabled: no press reaches `onPress`. */
export const Disabled: Story = { args: { disabled: true, children: 'Export' } };

/** Every tone at rest, and disabled. */
export const Tones: Story = {
  render: (args) => (
    <div style={row}>
      <ActionButton {...args} tone="normal">Normal</ActionButton>
      <ActionButton {...args} tone="quiet">Quiet</ActionButton>
      <ActionButton {...args} tone="danger">Danger</ActionButton>
      <ActionButton {...args} disabled>Disabled</ActionButton>
      <ActionButton {...args} tone="quiet" label="Remove">
        <Cross />
      </ActionButton>
    </div>
  ),
};

function Switch() {
  const [on, setOn] = useState(false);
  return (
    <ButtonFace lit={on} onClick={() => setOn((v) => !v)}>
      {on ? 'On' : 'Off'}
    </ButtonFace>
  );
}

/** The bare face: sizes, a toggle by `lit` and by `aria-pressed`, and a live switch. */
export const Face: StoryObj<typeof ButtonFace> = {
  render: () => (
    <div style={row}>
      <ButtonFace>Default</ButtonFace>
      <ButtonFace size="medium">Medium</ButtonFace>
      <ButtonFace size="small">Small</ButtonFace>
      <ButtonFace lit>Lit</ButtonFace>
      <ButtonFace lit={false}>Unlit</ButtonFace>
      <ButtonFace aria-pressed>Pressed</ButtonFace>
      <ButtonFace tone="quiet" aria-label="Add">
        <Plus />
      </ButtonFace>
      <Switch />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Lit' })).toHaveAttribute('data-on');
    await expect(canvas.getByRole('button', { name: 'Unlit' })).not.toHaveAttribute('data-on');
    await expect(canvas.getByRole('button', { name: 'Pressed' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(canvas.getByRole('button', { name: 'Off' }));
    await expect(canvas.getByRole('button', { name: 'On' })).toHaveAttribute('data-on');
  },
};
