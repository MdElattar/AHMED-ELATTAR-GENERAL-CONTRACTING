import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

type Tone = "dark" | "light";

type FieldProps = {
  label: string;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  hint?: string;
  tone?: Tone;
  className?: string;
  children: ReactNode;
};

export function Field({
  label,
  htmlFor,
  error,
  required,
  hint,
  tone = "dark",
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        htmlFor={htmlFor}
        className={cn(
          "flex items-center gap-1.5 text-[0.65rem] font-medium uppercase tracking-[0.18em]",
          tone === "light" ? "text-ink/55" : "text-ivory/45",
        )}
      >
        {label}
        {required ? <span className="text-gold">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-[0.68rem] text-[#d98572]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className={cn("text-[0.68rem]", tone === "light" ? "text-ink/40" : "text-ivory/30")}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & { tone?: Tone };

export function TextInput({ className, tone = "dark", ...props }: TextInputProps) {
  return <input {...props} className={cn("field", tone === "light" && "field-light", className)} />;
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  tone?: Tone;
  options: { value: string; label: string }[];
  placeholder?: string;
};

export function Select({ className, tone = "dark", options, placeholder, ...props }: SelectProps) {
  return (
    <select
      {...props}
      className={cn("field appearance-none", tone === "light" && "field-light", className)}
    >
      {placeholder ? (
        <option value="" disabled>
          {placeholder}
        </option>
      ) : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { tone?: Tone };

export function Textarea({ className, tone = "dark", ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      className={cn("field resize-none", tone === "light" && "field-light", className)}
    />
  );
}
