import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  // Shared admin route wrapper. The admin shell is rendered by the client
  // dashboard component to enforce auth, live workspace state, and responsive
  // navigation across every admin sub-page.
  return <div className="min-h-screen bg-obsidian text-ivory">{children}</div>;
}
