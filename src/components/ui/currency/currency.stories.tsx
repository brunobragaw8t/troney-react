import type { Meta, StoryObj } from "@storybook/react-vite";
import { Currency } from "./currency";
import { BalanceVisibilityProvider } from "../../../contexts/balance-visibility-context";

const meta = {
  component: Currency,
  decorators: [
    (Story) => (
      <BalanceVisibilityProvider>
        <div className="text-white">
          <Story />
          <p className="mt-4 text-sm text-secondary-4">
            Press H to toggle visibility
          </p>
        </div>
      </BalanceVisibilityProvider>
    ),
  ],
} satisfies Meta<typeof Currency>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 1234.56,
  },
};

export const Zero: Story = {
  args: {
    value: 0,
  },
};

export const Negative: Story = {
  args: {
    value: -500.25,
  },
};

export const Large: Story = {
  args: {
    value: 1234567.89,
  },
};
