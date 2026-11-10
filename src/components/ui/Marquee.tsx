import { cn } from "@/lib/utils";

type MarqueeProps = {
  items: string[];
  speed?: number;
  reverse?: boolean;
  className?: string;
  itemClassName?: string;
};

export function Marquee({
  items,
  speed = 38,
  reverse = false,
  className,
  itemClassName,
}: MarqueeProps) {
  const sequence = [...items, ...items];

  return (
    <div
      className={cn("mask-fade-x relative flex overflow-hidden", className)}
      dir="ltr"
      aria-hidden="true"
    >
      <div
        className="marquee-track flex w-max shrink-0 items-center"
        style={{
          "--marquee-duration": `${speed}s`,
          animationDirection: reverse ? "reverse" : "normal",
        } as React.CSSProperties}
      >
        {sequence.map((item, index) => (
          <span key={`${item}-${index}`} className="flex items-center">
            <span
              className={cn(
                "whitespace-nowrap text-sm font-medium tracking-wide text-ivory/45",
                itemClassName,
              )}
            >
              {item}
            </span>
            <span className="mx-8 inline-block h-1 w-1 rotate-45 bg-gold/60" />
          </span>
        ))}
      </div>
    </div>
  );
}
