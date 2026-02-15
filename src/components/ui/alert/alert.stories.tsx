import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Alert } from "./alert";

const meta = {
  component: Alert,
  argTypes: {
    type: {
      control: "radio",
      options: ["success", "error", "warning", "info"],
      table: {
        readonly: true,
      },
    },
    message: {
      control: "text",
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: {
    type: "success",
    message: "Your changes have been saved successfully!",
  },
};

export const Error: Story = {
  args: {
    type: "error",
    message: "There was an error processing your request. Please try again.",
  },
};

export const Warning: Story = {
  args: {
    type: "warning",
    message: "Please review your information before proceeding.",
  },
};

export const Info: Story = {
  args: {
    type: "info",
    message: "New features are available. Check out what's new!",
  },
};

export const LongMessage: Story = {
  args: {
    type: "info",
    message:
      "This is a longer alert message that demonstrates how the component handles multiple lines of text. The alert should maintain proper spacing and readability even with longer content that may wrap to multiple lines.",
  },
};

export const WithLink: Story = {
  args: {
    type: "info",
    message: (
      <>
        Didn't receive the email?{" "}
        <button type="button" className="underline hover:opacity-80">
          Click here to resend
        </button>
      </>
    ),
  },
};
