import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LuFolder, LuHash, LuPalette } from "react-icons/lu";
import { Alert, type AlertProps } from "../ui/alert/alert";
import { Button } from "../ui/button/button";
import { Input } from "../ui/input/input";

export interface CategoryFormData {
  name: string;
  color: string;
  icon: string;
}

interface CategoryFormProps {
  initialName?: string;
  initialColor?: string;
  initialIcon?: string;
  submitLabel: string;
  onSubmit: (data: CategoryFormData) => Promise<void>;
}

export function CategoryForm({
  initialName = "",
  initialColor = "#3b82f6",
  initialIcon = "",
  submitLabel,
  onSubmit,
}: CategoryFormProps) {
  const [name, setName] = useState(initialName);

  function handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    setName(event.target.value);
  }

  const [color, setColor] = useState(initialColor);

  function handleColorChange(event: React.ChangeEvent<HTMLInputElement>) {
    setColor(event.target.value.toLowerCase());
  }

  const [icon, setIcon] = useState(initialIcon);

  function handleIconChange(event: React.ChangeEvent<HTMLInputElement>) {
    setIcon(event.target.value);
  }

  const [alert, setAlert] = useState<AlertProps>({
    type: "success",
    message: "",
  });

  const navigate = useNavigate();

  function handleCancel() {
    navigate({ to: "/categories" });
  }

  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setAlert({ type: "success", message: "" });

    const hexColorRegex = /^#([a-f0-9]{6})$/;
    if (!hexColorRegex.test(color)) {
      setAlert({
        type: "error",
        message: "Color must be a valid hexadecimal color (e.g.: #ff0000)",
      });
      setLoading(false);
      return;
    }

    try {
      await onSubmit({ name, color, icon });
    } catch (error) {
      setAlert({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });

      setLoading(false);
    }
  }

  return (
    <div className="max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Name"
          icon={LuFolder}
          type="text"
          name="name"
          value={name}
          onChange={handleNameChange}
          placeholder="Food, Transport, Entertainment..."
          autoFocus={true}
        />

        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              label="Color"
              icon={LuPalette}
              type="text"
              name="color"
              value={color}
              onChange={handleColorChange}
            />
          </div>

          <div
            className="mt-6 h-12 w-12 rounded-full border border-gray-600"
            style={{ backgroundColor: color }}
          />
        </div>

        <Input
          label="Icon"
          icon={LuHash}
          type="text"
          name="icon"
          value={icon}
          onChange={handleIconChange}
          placeholder="🍔, 🚗, 🎬..."
        />

        {alert.message && <Alert type={alert.type} message={alert.message} />}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            label="Cancel"
            variant="outline"
            onClick={handleCancel}
          />

          <Button loading={loading} type="submit" label={submitLabel} />
        </div>
      </form>
    </div>
  );
}
