import type { Meta, StoryObj } from "@storybook/react-vite";
import { App } from "../App";
const meta = {
  title: "Overview",
  component: App,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof App>;
export default meta;
type Story = StoryObj<typeof meta>;
export const FieldGuide: Story = {};
