import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { OmarchyStage, stageOf } from '../stage';

// The Lab's view drawn by Qt, not the browser: the stage's sample plugin runs
// zen's native Tree with Omarchy's own controls in headless Quickshell. Point,
// click and type on it as on the bar. Needs the Storybook dev server, with
// quickshell and Omarchy's shell kit installed.
const meta = {
  title: 'Omarchy/Lab/On Qt',
  // Drawn by the stage in Qt: zen-stories plays these against a served stage, and skips them where none answers.
  tags: ['stage'],
  component: OmarchyStage,
  parameters: { layout: 'padded' },
  args: { plugin: 'zen.sample', width: 720, height: 800 },
} satisfies Meta<typeof OmarchyStage>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The sample's bar button, in the current Omarchy theme. */
export const Closed: Story = {
  play: async ({ canvasElement }) => {
    const stage = await stageOf(canvasElement);
    await stage.waitForText('Lab');
  },
};

/** The Lab view in Omarchy's KeyboardPanel. */
export const Open: Story = {
  play: async ({ canvasElement }) => {
    const stage = await stageOf(canvasElement);
    await stage.click('Lab');
    await stage.waitForText('OMARCHY / RENDER LAB');
  },
};

/** Every control, pressed through real Qt input. */
export const Controls: Story = {
  play: async ({ canvasElement }) => {
    const stage = await stageOf(canvasElement);
    await stage.click('Lab');
    await stage.click('Increment · 0');
    await stage.waitForText('Increment · 1');
    await stage.click('#checked');
    await expect((await stage.inspect('#checked')).checked).toBe(true);
    await stage.type('#input', 'Works on Qt');
    await stage.waitForText(/"input":"Works on Qt"/);
    await expect(stage.click('Disabled action', { timeout: 300 })).rejects.toThrow(/disabled/);
  },
};

/** A light Omarchy theme. */
export const Light: Story = {
  args: { theme: 'catppuccin-latte' },
  play: Open.play,
};

/** At twice the pixels, as on a HiDPI screen. */
export const Sharp: Story = {
  args: { scale: 2 },
  play: Open.play,
};
