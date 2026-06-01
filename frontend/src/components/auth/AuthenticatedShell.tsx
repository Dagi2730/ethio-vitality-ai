import { ProtectedRoute } from "./ProtectedRoute";
import { RoleLayoutSwitcher } from "./RoleLayoutSwitcher";

export function AuthenticatedShell() {
  return (
    <ProtectedRoute>
      <RoleLayoutSwitcher />
    </ProtectedRoute>
  );
}
