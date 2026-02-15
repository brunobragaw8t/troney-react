import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Checkbox } from "./checkbox";
import { useState } from "react";

const meta = {
  component: Checkbox,
  argTypes: {
    label: {
      control: "text",
    },
    name: { table: { disable: true } },
    value: { table: { disable: true } },
    checked: { table: { disable: true } },
    onChange: { table: { disable: true } },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Remember me",
    name: "remember",
    value: "",
    checked: false,
    onChange: () => {},
  },
  render: (args) => {
    const [checked, setChecked] = useState(args.checked || false);

    function handleOnChange() {
      setChecked(!checked);
    }

    return <Checkbox {...args} checked={checked} onChange={handleOnChange} />;
  },
};
