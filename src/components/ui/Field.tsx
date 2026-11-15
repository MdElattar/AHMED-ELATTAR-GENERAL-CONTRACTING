import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { AlertCircle } from "lucide-react";
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
          "flex items-center gap-1.5 text-[14px] font-medium",
          tone === "light" ? "text-ink/75" : "text-[var(--admin-text,#F1EEE8)]/85",
        )}
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
        <p
          className={cn(
            "text-[13px] leading-relaxed",
            tone === "light" ? "text-ink/45" : "text-[var(--admin-muted,#A6A9B4)]",
          )}
        >
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
      className={cn("field min-h-24 resize-y", tone === "light" && "field-light", className)}
    />
  );
}
