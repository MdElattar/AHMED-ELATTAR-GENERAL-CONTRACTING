import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "gold" | "outline" | "light" | "ghost" | "dark";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  gold: "bg-gold text-obsidian hover:bg-gold-light border border-gold",
  outline:
    "border border-white/20 text-ivory hover:border-gold/70 hover:text-gold bg-transparent",
  light: "bg-ivory text-obsidian hover:bg-paper border border-ivory",
  ghost: "text-ivory/80 hover:text-gold border border-transparent",
  dark: "bg-obsidian text-ivory hover:bg-graphite border border-obsidian",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-5 text-[0.7rem] tracking-[0.14em]",
  md: "h-12 px-7 text-[0.72rem] tracking-[0.16em]",
  lg: "h-14 px-9 text-[0.75rem] tracking-[0.18em]",
};

const base =
  "btn-shine group/btn inline-flex items-center justify-center gap-2.5 font-medium uppercase transition-all duration-500 disabled:cursor-not-allowed disabled:opacity-50";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  icon?: ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps & {
  href: string;
  target?: string;
  rel?: string;
  prefetch?: boolean;
  "aria-label"?: string;
};

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = "gold", size = "md", className, children, icon } = props;
  const classes = cn(base, variants[variant], sizes[size], className);

  if (props.href) {
    const { href, target, rel, prefetch, "aria-label": ariaLabel } = props as ButtonAsLink;
    const external = href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:");

    if (external) {
      return (
        <a
          href={href}
          target={target}
          rel={rel}
          aria-label={ariaLabel}
          className={classes}
        >
          <span>{children}</span>
          {icon}
        </a>
      );
    }

    return (
      <Link
        href={href}
        target={target}
        rel={rel}
        prefetch={prefetch}
        aria-label={ariaLabel}
        className={classes}
      >
        <span>{children}</span>
        {icon}
      </Link>
    );
  }

  const { type = "button", disabled, onClick, name, value, form } = props as ButtonAsButton;
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      name={name}
      value={value}
      form={form}
      className={classes}
    >
      <span>{children}</span>
      {icon}
    </button>
  );
}
