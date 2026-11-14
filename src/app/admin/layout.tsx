import { AdminDashboard } from "@/components/sections/admin/AdminDashboard";

/**
 * The admin shell lives at the layout level so the sidebar, its scroll
 * position, and the mobile navigation stay mounted while section routes change.
 */
export default function AdminLayout() {
  return <AdminDashboard />;
}
