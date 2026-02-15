import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Spinner } from "./spinner";

const meta = {
  component: Spinner,
  argTypes: {
    message: {
      control: "text",
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomMessage: Story = {
  args: {
    message: "Activating your account...",
  },
};
