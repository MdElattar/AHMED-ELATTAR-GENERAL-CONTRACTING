"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Checkbox({
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  return <input type="checkbox" className={cn("lux-checkbox", className)} {...props} />;
}
