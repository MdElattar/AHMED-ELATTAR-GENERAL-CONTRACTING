import { RouteLoading } from "@/components/system/RouteLoading";
import { dictionary } from "@/lib/dictionary";

export default function PasskeyEnrollLoading() {
  return <RouteLoading variant="auth" label={dictionary.ar.auth.loadingEnrollment} />;
}
