import { Outlet } from "react-router-dom";

/** Pass-through layout — role gates removed for simpler demo access. */
export function PersonalSpaceGuard() {
  return <Outlet />;
}

export function ProfessionalSpaceGuard() {
  return <Outlet />;
}
