import type { Meta, StoryObj } from "@storybook/react-vite";
import { PrincipleExample } from "../PrincipleExample";
import { descriptionFor } from "../catalog";

const meta = {
  title: "Thinking with Type",
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

export const Hierarchy: Story = {
  name: "T1 · Hierarchy",
  args: { id: "T1", applied: true },
  parameters: { docs: { description: { story: descriptionFor("T1") } } },
};

export const ReadingMeasure: Story = {
  name: "T2 · Reading Measure",
  args: { id: "T2", measure: 52 },
  argTypes: {
    applied: { table: { disable: true } },
    measure: {
      control: { type: "range", min: 44, max: 76, step: 1 },
      table: { disable: false },
    },
  },
  parameters: { docs: { description: { story: descriptionFor("T2") } } },
};

export const RepeatedRoles: Story = {
  name: "T3 · Repeated Roles",
  args: { id: "T3", applied: true },
  parameters: { docs: { description: { story: descriptionFor("T3") } } },
};
