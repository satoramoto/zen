import type { Meta, StoryObj } from "@storybook/react-vite";
import { PrincipleExample } from "../PrincipleExample";
import { descriptionFor } from "../catalog";

const meta = {
  title: "Interaction of Color",
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

export const RelativeGray: Story = {
  name: "C1 · Relative Gray",
  args: { id: "C1", applied: false },
  parameters: { docs: { description: { story: descriptionFor("C1") } } },
};

export const ColorInContext: Story = {
  name: "C2 · Color In Context",
  args: { id: "C2", applied: false },
  parameters: { docs: { description: { story: descriptionFor("C2") } } },
};

export const HueComparison: Story = {
  name: "C3 · Hue Comparison",
  args: { id: "C3", hue: 30, applied: false },
  argTypes: {
    hue: {
      control: { type: "range", min: 0, max: 360, step: 1 },
      table: { disable: false },
    },
  },
  parameters: { docs: { description: { story: descriptionFor("C3") } } },
};
