import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Building, MapPin, User } from "lucide-react";
import { useState } from "react";
import { Select } from "./select";

const meta = {
  component: Select,
  argTypes: {
    label: {
      control: "text",
    },
    icon: { table: { disable: true } },
    name: { table: { disable: true } },
    value: {
      control: "text",
    },
    onChange: { table: { disable: true } },
    placeholder: {
      control: "text",
    },
    options: { table: { disable: true } },
    autoFocus: {
      control: "boolean",
    },
    error: {
      control: "text",
    },
    disabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

const countryOptions = [
  { value: "us", label: "United States" },
  { value: "ca", label: "Canada" },
  { value: "uk", label: "United Kingdom" },
  { value: "fr", label: "France" },
  { value: "de", label: "Germany" },
  { value: "jp", label: "Japan" },
  { value: "au", label: "Australia" },
];

export const Default: Story = {
  args: {
    label: "Country",
    icon: MapPin,
    name: "country",
    value: "",
    onChange: () => {},
    placeholder: "Select a country",
    options: countryOptions,
    autoFocus: true,
  },
  render: (args) => {
    const [value, setValue] = useState(args.value || "");

    function handleOnChange(e: React.ChangeEvent<HTMLSelectElement>) {
      setValue(e.target.value);
    }

    return <Select {...args} value={value} onChange={handleOnChange} />;
  },
};

export const WithErrors: Story = {
  args: {
    label: "Country",
    icon: MapPin,
    name: "country",
    value: "",
    onChange: () => {},
    placeholder: "Select a country",
    options: countryOptions,
    error: ["Please select a country from the list"],
  },
  render: (args) => {
    const [value, setValue] = useState(args.value || "");

    function handleOnChange(e: React.ChangeEvent<HTMLSelectElement>) {
      setValue(e.target.value);
    }

    return <Select {...args} value={value} onChange={handleOnChange} />;
  },
};
