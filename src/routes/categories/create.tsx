import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useKeyboardShortcuts } from "../../hooks/use-keyboard-shortcuts";
import { useMemo, useState } from "react";
import { Alert, type AlertProps } from "../../components/ui/alert/alert";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/ui/button/button";
import { LuArrowLeft, LuFolder, LuHash, LuPalette } from "react-icons/lu";
import { Input } from "../../components/ui/input/input";

export const Route = createFileRoute("/categories/create")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  useKeyboardShortcuts({
    shortcuts: useMemo(
      () => [
        {
          key: "Escape",
          action: () => {
            navigate({ to: "/categories" });
          },
        },
      ],
      [navigate],
    ),
  });

  function handleGoBack() {
    navigate({ to: "/categories" });
  }

  const [name, setName] = useState("");

  function handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    setName(event.target.value);
  }

  const [color, setColor] = useState("#3b82f6");

  function handleColorChange(event: React.ChangeEvent<HTMLInputElement>) {
    setColor(event.target.value.toLowerCase());
  }

  const [icon, setIcon] = useState("");

  function handleIconChange(event: React.ChangeEvent<HTMLInputElement>) {
    setIcon(event.target.value);
  }

  const [loading, setLoading] = useState(false);

  const [alert, setAlert] = useState<AlertProps>({
    type: "success",
    message: "",
  });

  const createCategory = useMutation(api.categories.createCategory);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);

    setAlert({
      type: "success",
      message: "",
    });

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
      await createCategory({ name, color, icon });

      setAlert({
        type: "success",
        message: "Category created successfully!",
      });

      navigate({ to: "/categories" });
    } catch (error) {
      const message =
        error instanceof ConvexError
          ? (error.data as string)
          : "Failed to create category. Please try again.";

      setAlert({ type: "error", message });
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <Button
          type="button"
          icon={LuArrowLeft}
          iconPosition="left"
          variant="outline"
          size="sm"
          onClick={handleGoBack}
        />

        <h1 className="text-3xl font-bold text-white">Create category</h1>
      </div>

      <p className="mb-8 text-secondary-4">
        Add a new category to organize your expenses
      </p>

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
              onClick={handleGoBack}
            />

            <Button loading={loading} type="submit" label="Create category" />
          </div>
        </form>
      </div>
    </div>
  );
}
