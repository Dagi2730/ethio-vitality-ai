/**
 * Legacy layout shim — use AppShell + ProfessionalSpaceGuard in App.tsx.
 */
import { Outlet } from "react-router-dom";

export function ManagerLayout() {
  return <Outlet />;
}
