import type { AppRole } from "../store/authStore";

/** Default landing route per role — no unauthorized screens. */
export const ROLE_HOME: Record<AppRole, string> = {
  user: "/personal",
  hr: "/corporate/heatmap",
  doctor: "/clinical/ward",
};

export function getHomePath(role: AppRole): string {
  return ROLE_HOME[role];
}

export function pathPrefixForRole(role: AppRole): string {
  if (role === "hr") return "/corporate";
  if (role === "doctor") return "/clinical";
  return "/personal";
}

export function isPathAllowedForRole(role: AppRole, pathname: string): boolean {
  const prefix = pathPrefixForRole(role);
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}
