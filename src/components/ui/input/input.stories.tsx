import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Eye, EyeClosed, LockKeyhole, User, X } from "lucide-react";
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
    icon: User,
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
        rightAccessoryIcon={value !== "" ? X : undefined}
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
    icon: LockKeyhole,
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
        rightAccessoryIcon={displayAsText ? EyeClosed : Eye}
        rightAccessoryAction={toggleDisplayAsText}
        rightAccessoryLabel={displayAsText ? "Hide password" : "Show password"}
      />
    );
  },
};

export const WithErrors: Story = {
  args: {
    label: "Password",
    icon: LockKeyhole,
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
