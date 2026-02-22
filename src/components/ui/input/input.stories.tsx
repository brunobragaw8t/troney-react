import type { Meta, StoryObj } from "@storybook/react-vite";
import { LuEye, LuEyeClosed, LuLockKeyhole, LuUser, LuX } from "react-icons/lu";
import { useState } from "react";
import { Input } from "./input";

const meta = {
  component: Input,
  argTypes: {
    label: {
      control: "text",
    },
    icon: { table: { disable: true } },
    type: {
      control: "radio",
      options: ["text", "password", "email"],
      table: { readonly: true },
    },
    name: { table: { disable: true } },
    value: {
      control: "text",
    },
    onChange: { table: { disable: true } },
    placeholder: {
      control: "text",
    },
    autoFocus: {
      control: "boolean",
    },
    rightAccessoryIcon: { table: { disable: true } },
    rightAccessoryAction: { table: { disable: true } },
    error: {
      control: "text",
    },
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Name",
    icon: LuUser,
    type: "text",
    name: "name",
    value: "",
    onChange: () => {},
    placeholder: "Enter your name",
    autoFocus: true,
    rightAccessoryLabel: "Clear field",
  },
  render: (args) => {
    const [value, setValue] = useState(args.value || "");

    function handleOnChange(e: React.ChangeEvent<HTMLInputElement>) {
      setValue(e.target.value);
    }

    function clearValue(ref: HTMLInputElement) {
      setValue("");
      ref.focus();
    }

    return (
      <Input
        {...args}
        value={value}
        onChange={handleOnChange}
        rightAccessoryIcon={value !== "" ? LuX : undefined}
        rightAccessoryAction={clearValue}
      />
    );
  },
};

export const Password: Story = {
  argTypes: {
    rightAccessoryLabel: { table: { disable: true } },
  },
  args: {
    label: "Password",
    icon: LuLockKeyhole,
    type: "password",
    name: "password",
    value: "",
    onChange: () => {},
    placeholder: "Enter your password",
  },
  render: (args) => {
    const [value, setValue] = useState(args.value || "");
    const [displayAsText, setDisplayAsText] = useState(false);

    function handleOnChange(e: React.ChangeEvent<HTMLInputElement>) {
      setValue(e.target.value);
    }

    function toggleDisplayAsText() {
      setDisplayAsText(!displayAsText);
    }

    return (
      <Input
        {...args}
        value={value}
        onChange={handleOnChange}
        type={displayAsText ? "text" : "password"}
        rightAccessoryIcon={displayAsText ? LuEyeClosed : LuEye}
        rightAccessoryAction={toggleDisplayAsText}
        rightAccessoryLabel={displayAsText ? "Hide password" : "Show password"}
      />
    );
  },
};

export const WithErrors: Story = {
  args: {
    label: "Password",
    icon: LuLockKeyhole,
    type: "password",
    name: "password",
    value: "",
    onChange: () => {},
    placeholder: "Enter your password",
    error: [
      "Password must be at least 8 characters long",
      "Password must contain at least one number",
      "Password must contain at least one uppercase letter",
    ],
  },
  render: (args) => {
    const [value, setValue] = useState(args.value || "");

    function handleOnChange(e: React.ChangeEvent<HTMLInputElement>) {
      setValue(e.target.value);
    }

    return <Input {...args} value={value} onChange={handleOnChange} />;
  },
};
