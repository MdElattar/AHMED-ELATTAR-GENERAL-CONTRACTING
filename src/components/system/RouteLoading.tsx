import { cn } from "@/lib/utils";

type Variant = "page" | "detail" | "dashboard" | "auth" | "legal";

/**
 * Shared, server-rendered route skeleton.
 *
 * Every placeholder mirrors the height of the content it replaces so the
 * layout does not shift when the real page streams in (zero CLS). Kept free
 * of client hooks and heavy imports so it can ship in the initial payload.
 */
export function RouteLoading({
  variant = "page",
  label = "Loading",
}: {
  variant?: Variant;
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="relative min-h-[100svh] overflow-hidden bg-obsidian pt-24"
    >
      <span className="sr-only">{label}</span>
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-25" />
      <div className="container-lux relative">
        {variant === "auth" ? <AuthSkeleton /> : null}
        {variant === "legal" ? <LegalSkeleton /> : null}
        {variant === "dashboard" ? <DashboardSkeleton /> : null}
        {variant === "detail" ? <DetailSkeleton /> : null}
        {variant === "page" ? <PageSkeleton /> : null}
      </div>
    </div>
  );
}

const bar = "animate-pulse rounded-sm bg-white/[0.06]";

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-16 pb-24">
      <div className="flex max-w-3xl flex-col gap-5 pt-10">
        <div className={cn(bar, "h-3 w-28 bg-gold/20")} />
        <div className={cn(bar, "h-12 w-full max-w-2xl sm:h-16")} />
        <div className={cn(bar, "h-12 w-3/4 max-w-xl sm:h-16")} />
        <div className={cn(bar, "mt-3 h-4 w-full max-w-lg")} />
        <div className={cn(bar, "h-4 w-2/3 max-w-md")} />
      </div>

      <div className="grid gap-px overflow-hidden border border-white/[0.06] bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-4 bg-obsidian p-8">
            <div className={cn(bar, "h-10 w-10 bg-gold/10")} />
            <div className={cn(bar, "h-4 w-3/4")} />
            <div className={cn(bar, "h-3 w-full")} />
            <div className={cn(bar, "h-3 w-5/6")} />
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-12 pb-24">
      <div className="flex flex-col gap-5 pt-8">
        <div className={cn(bar, "h-3 w-24 bg-gold/20")} />
        <div className={cn(bar, "h-14 w-full max-w-3xl sm:h-20")} />
        <div className={cn(bar, "h-4 w-full max-w-xl")} />
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-6">
          <div className={cn(bar, "aspect-[16/10] w-full")} />
          <div className="flex flex-col gap-3">
            <div className={cn(bar, "h-4 w-full")} />
            <div className={cn(bar, "h-4 w-11/12")} />
            <div className={cn(bar, "h-4 w-4/5")} />
          </div>
        </div>
        <div className="flex flex-col gap-px border border-white/[0.06] bg-white/[0.06]">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 bg-obsidian p-6">
              <div className={cn(bar, "h-3 w-20")} />
              <div className={cn(bar, "h-4 w-32")} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-10 pb-24">
      <div className="flex flex-col gap-4 pt-8">
        <div className={cn(bar, "h-3 w-24 bg-gold/20")} />
        <div className={cn(bar, "h-10 w-72 max-w-full")} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-4 border border-white/[0.06] p-6"
          >
            <div className={cn(bar, "h-3 w-20")} />
            <div className={cn(bar, "h-8 w-24")} />
            <div className={cn(bar, "h-2 w-full")} />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="h-80 animate-pulse border border-white/[0.06] bg-white/[0.02]" />
        <div className="flex flex-col gap-px border border-white/[0.06] bg-white/[0.06]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 bg-obsidian p-5">
              <div className={cn(bar, "h-10 w-10 shrink-0 bg-gold/10")} />
              <div className="flex flex-1 flex-col gap-2">
                <div className={cn(bar, "h-3 w-3/4")} />
                <div className={cn(bar, "h-2 w-1/2")} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuthSkeleton() {
  return (
    <div className="flex min-h-[calc(100svh-6rem)] items-center justify-center py-16">
      <div className="flex w-full max-w-md flex-col gap-6 border border-white/[0.06] p-8 sm:p-10">
        <div className={cn(bar, "h-3 w-20 bg-gold/20")} />
        <div className={cn(bar, "h-8 w-3/4")} />
        <div className={cn(bar, "h-3 w-full")} />
        <div className="mt-2 flex flex-col gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className={cn(bar, "h-3 w-24")} />
              <div className={cn(bar, "h-12 w-full")} />
            </div>
          ))}
          <div className={cn(bar, "mt-2 h-12 w-full bg-gold/15")} />
        </div>
      </div>
    </div>
  );
}

function LegalSkeleton() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 pb-24 pt-10">
      <div className={cn(bar, "h-3 w-24 bg-gold/20")} />
      <div className={cn(bar, "h-12 w-4/5 sm:h-16")} />
      <div className={cn(bar, "h-4 w-40")} />
      <div className="mt-4 flex flex-col gap-12">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className={cn(bar, "h-5 w-52 max-w-full")} />
            {Array.from({ length: 4 }).map((__, j) => (
              <div
                key={j}
                className={cn(bar, "h-3", j === 3 ? "w-3/5" : "w-full")}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
