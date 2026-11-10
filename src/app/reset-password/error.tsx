"use client";

import { RouteError } from "@/components/system/RouteError";

export default function ResetPasswordError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError {...props} />;
}
