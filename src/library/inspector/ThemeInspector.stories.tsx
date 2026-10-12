import type { Meta, StoryObj } from '@storybook/react-vite';
import { resolveTheme, useSystemMode, type ModeChoice, type ThemeChoice } from '../theme';
import { withLibraryTheme } from '../storybook';
import { ThemeInspector } from './ThemeInspector';

/** Reads the toolbar like the theme scope does, so the values shown are the ones in force. */
function Inspect({ globals }: { globals: ThemeChoice & { mode?: ModeChoice } }) {
  const system = useSystemMode();
  const { pack, facets } = resolveTheme(globals);
  const choice = globals.mode ?? 'system';
  return <ThemeInspector pack={pack} facets={facets} mode={choice === 'system' ? system : choice} />;
}

const meta: Meta = {
  title: 'Design OS/Systems/Theme inspector',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  render: (_args, { globals }) => <Inspect globals={globals} />,
};
export default meta;
type Story = StoryObj;

// One story per pack in themes/packs.ts; the mode and facet menus still apply.
export const YahahaElektron: Story = { name: 'yahaha × Elektron', globals: { theme: 'yahaha-elektron' } };
export const YahahaClassic: Story = { name: 'yahaha classic', globals: { theme: 'yahaha-classic' } };
export const YahahaPush: Story = { name: 'yahaha Push', globals: { theme: 'yahaha-push' } };
export const Visuals: Story = { name: 'visual[flow] (glass)', globals: { theme: 'visuals' } };
export const Elektron: Story = { globals: { theme: 'elektron' } };
export const Ableton: Story = { globals: { theme: 'ableton' } };
export const Linear: Story = { globals: { theme: 'linear' } };
