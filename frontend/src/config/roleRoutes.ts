import type { AppRole } from "../store/authStore";

/** Default landing route per role — no unauthorized screens. */
export const ROLE_HOME: Record<AppRole, string> = {
  user: "/personal",
  hr: "/corporate/heatmap",
  doctor: "/clinical/ward",
};

export const ROLE_PREFIX: Record<AppRole, string> = {
  user: "/personal",
  hr: "/corporate",
  doctor: "/clinical",
};

export function getHomeForRole(role: AppRole): string {
  return ROLE_HOME[role];
}

export function isPathAllowedForRole(pathname: string, role: AppRole): boolean {
  return pathname.startsWith(ROLE_PREFIX[role]);
}

export function redirectPathForRole(role: AppRole, requestedPath: string): string {
  if (isPathAllowedForRole(requestedPath, role)) {
    return requestedPath;
  }
  return getHomeForRole(role);
}
