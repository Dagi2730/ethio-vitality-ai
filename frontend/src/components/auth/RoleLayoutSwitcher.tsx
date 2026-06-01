import { Navigate, useLocation } from "react-router-dom";
import { getHomeForRole, isPathAllowedForRole } from "../../config/roleRoutes";
import { useAuthStore, type AppRole } from "../../store/authStore";
import { PersonalLayout } from "../layout/PersonalLayout";
import { CorporateLayout } from "../layout/CorporateLayout";
import { ClinicalLayout } from "../layout/ClinicalLayout";

function LayoutForRole({ role }: { role: AppRole }) {
  switch (role) {
    case "hr":
      return <CorporateLayout />;
    case "doctor":
      return <ClinicalLayout />;
    default:
      return <PersonalLayout />;
  }
}

/**
 * Picks layout + nav by role. Wrong-prefix URLs silently redirect home (no error wall).
 */
export function RoleLayoutSwitcher() {
  const user = useAuthStore((s) => s.user);
  const { pathname } = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isPathAllowedForRole(pathname, user.role)) {
    return <Navigate to={getHomeForRole(user.role)} replace />;
  }

  return <LayoutForRole role={user.role} />;
}
