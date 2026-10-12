import type { Meta, StoryObj } from "@storybook/react-vite";
import { PrincipleExample } from "../PrincipleExample";
import { descriptionFor } from "../catalog";

const meta = {
  title: "On Web Typography",
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

export const TypeVoice: Story = {
  name: "W1 · Type Voice",
  args: { id: "W1", voice: "editorial" },
  argTypes: {
    applied: { table: { disable: true } },
    voice: {
      control: "select",
      options: ["editorial", "everyday", "technical"],
      table: { disable: false },
    },
  },
  parameters: { docs: { description: { story: descriptionFor("W1") } } },
};

export const ComplementaryRoles: Story = {
  name: "W2 · Complementary Roles",
  args: { id: "W2", applied: true },
  parameters: { docs: { description: { story: descriptionFor("W2") } } },
};

export const ResponsiveType: Story = {
  name: "W3 · Responsive Type",
  args: { id: "W3", width: 520, applied: true },
  argTypes: {
    width: {
      control: { type: "range", min: 280, max: 640, step: 1 },
      table: { disable: false },
    },
  },
  parameters: { docs: { description: { story: descriptionFor("W3") } } },
};
