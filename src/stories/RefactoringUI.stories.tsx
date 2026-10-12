import type { Meta, StoryObj } from "@storybook/react-vite";
import { PrincipleExample } from "../PrincipleExample";
import { descriptionFor } from "../catalog";

const meta = {
  title: "Refactoring UI",
  component: PrincipleExample,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: {
    id: { table: { disable: true } },
    applied: {
      control: "boolean",
      description:
        "Select the second composition, or remove context in color studies. Both compositions are intentional.",
    },
    measure: { table: { disable: true } },
    hue: { table: { disable: true } },
    voice: { table: { disable: true } },
    width: { table: { disable: true } },
  },
} satisfies Meta<typeof PrincipleExample>;
export default meta;
type Story = StoryObj<typeof meta>;

export const QuietCompetition: Story = {
  name: "R1 · Quiet Competition",
  args: { id: "R1", applied: true },
  parameters: { docs: { description: { story: descriptionFor("R1") } } },
};

export const SpacingScale: Story = {
  name: "R2 · Spacing Scale",
  args: { id: "R2", applied: true },
  parameters: { docs: { description: { story: descriptionFor("R2") } } },
};

export const LabelProximity: Story = {
  name: "R3 · Label Proximity",
  args: { id: "R3", applied: true },
  parameters: { docs: { description: { story: descriptionFor("R3") } } },
};
