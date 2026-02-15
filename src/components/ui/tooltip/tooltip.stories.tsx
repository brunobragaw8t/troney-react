import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Tooltip } from "./tooltip";
import { Keymap } from "../keymap/keymap";

const meta = {
  component: Tooltip,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="group relative cursor-pointer p-4 text-white">
        Hover me
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "This is a tooltip",
  },
};

export const WithKeymap: Story = {
  args: {
    children: (
      <>
        Hide balances
        <Keymap text="H" />
      </>
    ),
  },
};
