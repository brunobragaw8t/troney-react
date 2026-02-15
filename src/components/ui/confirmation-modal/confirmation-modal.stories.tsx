import { Button } from "@/components/ui/button/button";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { ConfirmationModal } from "./confirmation-modal";

const meta = {
  component: ConfirmationModal,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    isOpen: {
      control: "boolean",
    },
    onClose: { table: { disable: true } },
    onConfirm: { table: { disable: true } },
    title: {
      control: "text",
    },
    message: {
      control: "text",
    },
    confirmText: {
      control: "text",
    },
    cancelText: {
      control: "text",
    },
    variant: {
      control: "radio",
      options: ["primary", "danger-ghost"],
    },
    loading: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof ConfirmationModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: false,
    onClose: () => {},
    onConfirm: () => {
      console.log("Confirmed");
    },
    title: "Delete item",
    message: "Are you sure you want to delete? This action cannot be undone.",
    variant: "danger-ghost",
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button
          type="button"
          label="Open modal"
          onClick={() => setIsOpen(true)}
        />

        <ConfirmationModal
          {...args}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </>
    );
  },
};
