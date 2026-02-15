import { cn } from "../../../lib/utils";
import { Tooltip } from "../../../components/ui/tooltip/tooltip";
import Link from "next/link";

type Variant =
  | "primary"
  | "primary-ghost"
  | "outline"
  | "danger"
  | "danger-ghost";
type Size = "sm" | "md";

type Props = {
  label?: string;
  variant?: Variant;
  size?: Size;
  icon?: React.ComponentType<{ size: number }>;
  iconPosition?: "left" | "right";
  tooltip?: React.ReactNode;
} & (ButtonProps | LinkProps);

type ButtonProps = {
  type: "button" | "submit";
  onClick?: () => void;
  loading?: boolean;
};

type LinkProps = {
  type: "link";
  href: string;
  target?: "_self" | "_blank";
};

export function Button(props: Props) {
  const defaultStyles =
    "group relative inline-block rounded-lg border text-center outline-none focus:border-white";

  const { variant = "primary", size = "md" } = props;

  const variantStyles: Record<Variant, string> = {
    primary:
      "border-transparent bg-primary-1 text-secondary-1 hover:bg-primary-2",
    "primary-ghost":
      "border-transparent bg-primary-1/20 text-primary-1 hover:bg-primary-1/30",
    outline:
      "border-primary-1 bg-transparent text-primary-1 hover:border-primary-2 hover:text-primary-2",
    danger: "border-transparent bg-red-500 text-secondary-1 hover:bg-red-400",
    "danger-ghost":
      "border-transparent bg-red-500/20 text-red-400 hover:bg-red-500/30",
  };

  const sizeStyles: Record<
    Size,
    { button: string; text: string; icon: number }
  > = {
    sm: {
      button: `text-sm py-1 ${props.label ? "px-2" : "px-1"}`,
      text: "gap-1",
      icon: 20,
    },
    md: {
      button: `text-base py-2 ${props.label ? "px-4" : "px-2"}`,
      text: "gap-2",
      icon: 24,
    },
  };

  const className = cn(
    defaultStyles,
    variantStyles[variant],
    sizeStyles[size].button,
  );

  const content = (
    <div
      className={cn("flex items-center justify-center", sizeStyles[size].text)}
    >
      {props.iconPosition === "left" && props.icon && (
        <props.icon size={sizeStyles[size].icon} />
      )}

      {props.label && <span>{props.label}</span>}

      {props.iconPosition === "right" && props.icon && (
        <props.icon size={sizeStyles[size].icon} />
      )}
    </div>
  );

  const tooltipElement = props.tooltip && <Tooltip>{props.tooltip}</Tooltip>;

  if (props.type === "link") {
    return (
      <Link href={props.href} target={props.target} className={className}>
        {content}
        {tooltipElement}
      </Link>
    );
  }

  return (
    <button
      type={props.type}
      onClick={props.onClick}
      disabled={props.loading}
      className={cn(className, { "cursor-wait opacity-50": props.loading })}
    >
      {content}
      {tooltipElement}
    </button>
  );
}
