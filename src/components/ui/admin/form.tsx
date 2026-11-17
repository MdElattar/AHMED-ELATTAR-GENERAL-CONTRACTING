"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as SliderPrimitive from "@radix-ui/react-slider";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronDown,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Field                                                                      */
/* -------------------------------------------------------------------------- */

type FieldProps = {
  label: ReactNode;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: ReactNode;
};

export function Field({
  label,
  htmlFor,
  error,
  required,
  hint,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1.5 text-[14px] font-medium text-[var(--admin-text,#F1EEE8)]/85"
      >
        <span>{label}</span>
        {required ? <span className="text-[#E2B04A]" aria-hidden="true">*</span> : null}
      </label>
      {children}
      {error ? (
        <p
          role="alert"
          className="flex items-start gap-1.5 text-[13px] leading-relaxed text-red-300"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="text-[13px] leading-relaxed text-[var(--admin-muted,#A6A9B4)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Controls                                                                   */
/* -------------------------------------------------------------------------- */

export const controlClassName =
  "h-11 w-full rounded-xl border border-white/10 bg-white/[.04] px-3.5 text-[15px] text-[var(--admin-text,#F1EEE8)] placeholder:text-white/40 transition focus-visible:border-[#E2B04A]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2B04A]/30 aria-[invalid=true]:border-red-400/60 disabled:cursor-not-allowed disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(controlClassName, className)} {...props} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(controlClassName, "min-h-24 resize-y py-3", className)}
      {...props}
    />
  );
});

/* -------------------------------------------------------------------------- */
/* Select                                                                     */
/* -------------------------------------------------------------------------- */

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = {
  id?: string;
  name?: string;
  value: string;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  "aria-label"?: string;
};

export function Select({
  id,
  name,
  value,
  onValueChange,
  onBlur,
  options,
  placeholder,
  disabled,
  className,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
}: SelectProps) {
  return (
    <SelectPrimitive.Root
      value={value || undefined}
      onValueChange={onValueChange}
      name={name}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        id={id}
        onBlur={onBlur}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        aria-label={ariaLabel}
        className={cn(
          controlClassName,
          "flex items-center justify-between gap-2 text-start data-[placeholder]:text-white/40",
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 shrink-0 text-white/40" aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="scroll-area z-[300] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-white/10 bg-[#161820] p-1 text-[var(--admin-text,#F1EEE8)] shadow-[0_18px_60px_rgba(0,0,0,.55)]"
        >
          <SelectPrimitive.Viewport className="scroll-area p-0">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="relative flex min-h-10 cursor-default select-none items-center rounded-lg px-3 pe-9 text-[14px] outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-white/[.07] data-[disabled]:opacity-40"
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute end-2 inline-flex items-center">
                  <Check className="h-4 w-4 text-[#E2B04A]" aria-hidden="true" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

/* -------------------------------------------------------------------------- */
/* Number input                                                               */
/* -------------------------------------------------------------------------- */

type NumberInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange"
> & {
  value: number;
  onValueChange: (value: number) => void;
  currency?: boolean;
  decimals?: number;
};

const numberFormatter = (decimals: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  });

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  function NumberInput(
    {
      value,
      onValueChange,
      currency,
      decimals = 0,
      className,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const formatter = useMemo(() => numberFormatter(decimals), [decimals]);
    const [text, setText] = useState(() => formatter.format(Number.isFinite(value) ? value : 0));

    useEffect(() => {
      if (document.activeElement === inputRef.current) return;
      setText(formatter.format(Number.isFinite(value) ? value : 0));
    }, [formatter, value]);

    return (
      <div className="relative">
        {currency ? (
          <span className="pointer-events-none absolute inset-y-0 start-3.5 flex items-center text-[13px] font-medium text-white/40">
            SAR
          </span>
        ) : null}
        <input
          {...props}
          ref={(node) => {
            inputRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          type="text"
          inputMode="decimal"
          value={text}
          onFocus={(event) => {
            setText(Number.isFinite(value) ? String(value) : "");
            onFocus?.(event);
          }}
          onChange={(event) => {
            const raw = event.target.value.replace(/[^\d.-]/g, "");
            setText(raw);
            const parsed = Number(raw);
            onValueChange(Number.isFinite(parsed) ? parsed : 0);
          }}
          onBlur={(event) => {
            setText(formatter.format(Number.isFinite(value) ? value : 0));
            onBlur?.(event);
          }}
          className={cn(controlClassName, currency && "ps-14", className)}
        />
      </div>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Date picker                                                                */
/* -------------------------------------------------------------------------- */

type DatePickerProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  function DatePicker({ className, ...props }, ref) {
    return (
      <div className="relative">
        <input
          {...props}
          ref={ref}
          type="date"
          className={cn(controlClassName, "pe-10 [color-scheme:dark]", className)}
        />
        <CalendarDays
          className="pointer-events-none absolute end-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
          aria-hidden="true"
        />
      </div>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Segmented control                                                          */
/* -------------------------------------------------------------------------- */

type SegmentedOption<T extends string> = {
  value: T;
  label: ReactNode;
};

export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  label,
  className,
}: {
  value: T;
  onValueChange: (value: T) => void;
  options: SegmentedOption<T>[];
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex h-10 gap-1 rounded-xl border border-white/10 bg-white/[.04] p-1",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "h-8 min-w-0 flex-1 whitespace-nowrap rounded-lg px-3 text-[13px] font-medium transition-colors admin-focus-ring",
              active
                ? "bg-[linear-gradient(180deg,#F3C86A,#D9A03A)] text-[#1a1205] shadow-[0_4px_14px_rgba(226,176,74,.18)]"
                : "text-white/55 hover:bg-white/[.05] hover:text-white/80",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Slider                                                                     */
/* -------------------------------------------------------------------------- */

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  disabled,
  className,
}: {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <SliderPrimitive.Root
      value={[value]}
      onValueChange={(next) => onValueChange(next[0] ?? min)}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "relative flex h-6 w-full touch-none select-none items-center disabled:opacity-50",
        className,
      )}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-white/10">
        <SliderPrimitive.Range className="absolute h-full bg-[linear-gradient(90deg,#D9A03A,#F3C86A)]" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-[#F3C86A] bg-[#161820] shadow-[0_0_0_4px_rgba(226,176,74,.12)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2B04A]/40" />
    </SliderPrimitive.Root>
  );
}

/* -------------------------------------------------------------------------- */
/* Switch                                                                     */
/* -------------------------------------------------------------------------- */

export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
  id,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: ReactNode;
  description?: string;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/[.03] px-4 py-3">
      <div className="min-w-0">
        <label
          htmlFor={id}
          className="text-[14px] font-medium text-[var(--admin-text,#F1EEE8)]"
        >
          {label}
        </label>
        {description ? (
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--admin-muted,#A6A9B4)]">
            {description}
          </p>
        ) : null}
      </div>
      <SwitchPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full border border-white/10 bg-white/10 transition-colors data-[state=checked]:border-transparent data-[state=checked]:bg-[linear-gradient(180deg,#F3C86A,#D9A03A)] disabled:opacity-50"
      >
        <SwitchPrimitive.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px] rtl:data-[state=checked]:-translate-x-[22px]" />
      </SwitchPrimitive.Root>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Combobox                                                                   */
/* -------------------------------------------------------------------------- */

export function Combobox({
  id,
  value,
  onValueChange,
  options,
  placeholder,
  emptyLabel = "No results",
  onBlur,
  "aria-invalid": ariaInvalid,
}: {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  emptyLabel?: string;
  onBlur?: () => void;
  "aria-invalid"?: boolean;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((option) => option.value === value);
  const filtered = options.filter((option) =>
    option.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-invalid={ariaInvalid}
          value={open ? query : selected?.label ?? ""}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 120);
            onBlur?.();
          }}
          className={cn(controlClassName, "ps-10")}
        />
        <ChevronDown className="pointer-events-none absolute end-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
      </div>
      {open ? (
        <div
          id={listId}
          role="listbox"
          className="scroll-area absolute inset-x-0 top-[calc(100%+6px)] z-[310] max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-[#161820] p-1 shadow-[0_18px_60px_rgba(0,0,0,.55)]"
        >
          {filtered.length ? (
            filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onValueChange(option.value);
                  setQuery("");
                  setOpen(false);
                }}
                className={cn(
                  "flex min-h-10 w-full items-center rounded-lg px-3 text-start text-[14px] hover:bg-white/[.07]",
                  option.value === value ? "text-[#F3C86A]" : "text-white/80",
                )}
              >
                {option.label}
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-[13px] text-white/40">{emptyLabel}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
