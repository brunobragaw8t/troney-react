import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Keymap } from "./keymap";

const meta = {
  component: Keymap,
  argTypes: {
    text: {
      control: "text",
    },
    className: { table: { disable: true } },
  },
} satisfies Meta<typeof Keymap>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    text: "k",
  },
};
