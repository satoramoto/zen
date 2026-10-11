import type { Meta, StoryObj } from "@storybook/react-vite";
import { PrincipleExample } from "../PrincipleExample";
import { descriptionFor } from "../catalog";

const meta = {
  title: "Grid Systems",
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

export const SharedEdges: Story = {
  name: "G1 · Shared Edges",
  args: { id: "G1", applied: true },
  parameters: { docs: { description: { story: descriptionFor("G1") } } },
};

export const ContentProportions: Story = {
  name: "G2 · Content Proportions",
  args: { id: "G2", applied: true },
  parameters: { docs: { description: { story: descriptionFor("G2") } } },
};

export const RegularIntervals: Story = {
  name: "G3 · Regular Intervals",
  args: { id: "G3", applied: true },
  parameters: { docs: { description: { story: descriptionFor("G3") } } },
};
