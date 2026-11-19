import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "start" | "center";
  tone?: "dark" | "light";
  className?: string;
  titleClassName?: string;
  children?: ReactNode;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "start",
  tone = "dark",
  className,
  titleClassName,
  children,
}: SectionHeadingProps) {
  const light = tone === "light";

  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow ? (
        <Reveal>
          <span className={cn("eyebrow", light && "text-gold-dark")}>{eyebrow}</span>
        </Reveal>
      ) : null}
      <Reveal delay={80}>
        <h2
          className={cn(
            "display-title max-w-4xl text-[clamp(2.2rem,4.6vw,4.6rem)]",
            light ? "text-ink" : "text-ivory",
            titleClassName,
          )}
        >
          {title}
        </h2>
      </Reveal>
      {description ? (
        <Reveal delay={160}>
          <p
            className={cn(
              "max-w-2xl text-[0.95rem] leading-[1.9]",
              light ? "text-ink/60" : "text-ivory/65",
              align === "center" && "mx-auto",
            )}
          >
            {description}
          </p>
        </Reveal>
      ) : null}
      {children}
    </div>
  );
}
