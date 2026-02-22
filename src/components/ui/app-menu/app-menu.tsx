import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  LuArrowLeftRight,
  LuChartColumn,
  LuCreditCard,
  LuFolder,
  LuPackageOpen,
  LuTrendingUp,
  LuWallet,
} from "react-icons/lu";
import { useKeyboardShortcuts } from "../../../hooks/use-keyboard-shortcuts";
import { Keymap } from "../keymap/keymap";

export function AppMenu() {
  const { pathname } = useLocation();

  const navItems = useMemo(
    () => [
      {
        href: "/control-panel",
        icon: LuChartColumn,
        label: "Control panel",
        keymap: "p",
      },
      {
        href: "/earnings",
        icon: LuTrendingUp,
        label: "Earnings",
        keymap: "r",
      },
      {
        href: "/expenses",
        icon: LuCreditCard,
        label: "Expenses",
        keymap: "x",
      },
      {
        href: "/movements",
        icon: LuArrowLeftRight,
        label: "Movements",
        keymap: "m",
      },
      {
        href: "/wallets",
        icon: LuWallet,
        label: "Wallets",
        keymap: "w",
      },
      {
        href: "/buckets",
        icon: LuPackageOpen,
        label: "Buckets",
        keymap: "b",
      },
      {
        href: "/categories",
        icon: LuFolder,
        label: "Categories",
        keymap: "c",
      },
    ],
    [],
  );

  const navigate = useNavigate();

  useKeyboardShortcuts({
    shortcuts: useMemo(
      () =>
        navItems.map((item) => ({
          key: item.keymap,
          action: () => navigate({ to: item.href }),
        })),
      [navItems, navigate],
    ),
  });

  return (
    <nav>
      <ul className="space-y-1">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              to={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-secondary-4 hover:text-primary-1 ${
                pathname.startsWith(item.href)
                  ? "bg-primary-2 bg-opacity-10 !text-primary-1"
                  : ""
              }`}
            >
              <item.icon size={20} />

              <span>{item.label}</span>

              <Keymap
                text={item.keymap}
                className="group-hover:text-primary-1"
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
