"use client";

import { RouteError } from "@/components/system/RouteError";

export default function AboutError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError {...props} />;
}
