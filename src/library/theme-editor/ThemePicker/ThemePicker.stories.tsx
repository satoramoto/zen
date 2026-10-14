import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import type { ModeChoice } from '../../theme';
import { Stack } from '../../primitives/Stack';
import { Text } from '../../primitives/Text';
import { packs } from '../../themes/packs';
import { setOverride, skinFromPack, type Skin } from '../skin';
import { ThemePicker } from './ThemePicker';

type Globals = { theme?: string; mode?: ModeChoice };

/** The toolbar's pack as a skin (the first pack if it names none we know). */
const toolbarSkin = (globals: Globals) => skinFromPack(packs.find((p) => p.id === globals.theme) ?? packs[0]);

function Demo({ start, mode, width }: { start: Skin; mode?: ModeChoice; width?: string }) {
  const [skin, setSkin] = useState(start);
  return (
    <Stack gap={4} style={width ? { maxWidth: width } : undefined}>
      <Text role="body" tone="secondary" data-testid="chosen">
        Chosen: {skin.label}
      </Text>
      <ThemePicker value={skin} onChange={setSkin} mode={mode} />
    </Stack>
  );
}

const meta: Meta = {
  title: 'Design OS/Theme Editor/Picker',
  decorators: [withLibraryTheme],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: (_args, { globals }) => <Demo start={toolbarSkin(globals as Globals)} mode={(globals as Globals).mode} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = within(canvas.getByRole('radiogroup', { name: 'Theme' }));
    const current = group.getAllByRole('radio').find((r) => r.getAttribute('aria-checked') === 'true');
    const other = packs.find((p) => p.label !== current?.getAttribute('aria-label'))!;
    const radio = group.getByRole('radio', { name: other.label });
    await userEvent.click(radio);
    await expect(radio).toHaveAttribute('aria-checked', 'true');
    await expect(canvas.getByTestId('chosen')).toHaveTextContent(other.label);
  },
};

export const WithACustomSkin: Story = {
  name: 'With a custom skin',
  render: (_args, { globals }) => (
    <Demo start={setOverride(skinFromPack('linear'), ['palette', 'dark', 'accent'], '#ff7a59')} mode={(globals as Globals).mode} />
  ),
};

export const Narrow: Story = {
  render: (_args, { globals }) => <Demo start={toolbarSkin(globals as Globals)} mode={(globals as Globals).mode} width="360px" />,
};
