import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { treeStory, withRenderer } from '../../foundation/stories/story';
import { CodeImage, type CodeImageProps } from './CodeImage';
import { codeImageArgTypes, codeImageStories as s } from './CodeImage.fixtures';
import { codeImageView } from './CodeImage.model';

// Every story is the model's tree drawn with React's or Svelte's `Tree` (the toolbar's Renderer).
const meta = {
  title: 'Core/Components/CodeImage',
  component: CodeImage,
  decorators: [withRenderer, withLibraryTheme],
  argTypes: codeImageArgTypes,
} satisfies Meta<typeof CodeImage>;

export default meta;
type Story = StoryObj<typeof meta>;

const story = (args: unknown) => ({ ...treeStory((a: CodeImageProps) => ({ tree: codeImageView(a) })), args: args as CodeImageProps });

/** An address: dark marks on a light ground, with its margin, whatever the pack and mode. */
export const Address: Story = {
  ...story(s.Address.args),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('.lib-codeimage')!;
    await expect(root).toHaveAttribute('role', 'img');
    const lightness = (el: Element) => {
      const c = document.createElement('canvas').getContext('2d')!;
      c.fillStyle = getComputedStyle(el).fill;
      c.fillRect(0, 0, 1, 1);
      const [r, g, b] = c.getImageData(0, 0, 1, 1).data;
      return (r + g + b) / 765;
    };
    await expect(lightness(root.querySelector('[data-part="ground"]')!)).toBeGreaterThan(0.85);
    await expect(lightness(root.querySelector('[data-part="modules"]')!)).toBeLessThan(0.25);
  },
};

/** A long address takes a denser code in the same box. */
export const Long: Story = story(s.Long.args);

/** A text too long to hold draws nothing. */
export const TooLong: Story = {
  ...story(s.TooLong.args),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.lib-codeimage svg')).toBeNull();
  },
};
