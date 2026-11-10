"use client";

import { RouteError } from "@/components/system/RouteError";

export default function ServicesError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError {...props} />;
}
