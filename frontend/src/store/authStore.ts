import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppRole = "user" | "hr" | "doctor";

export type AuthUser = {
  email: string;
  role: AppRole;
  name: string;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
};

const initialState = {
  token: null as string | null,
  user: null as AuthUser | null,
  isAuthenticated: false,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,
      login: (token, user) =>
        set({ token, user, isAuthenticated: true }),
      logout: () => set({ ...initialState }),
    }),
    {
      name: "ethio-vitality-auth-v2",
      version: 2,
      migrate: (persisted: unknown) => {
        const p = persisted as Partial<AuthState> | undefined;
        if (!p?.token || !p?.user) {
          return { ...initialState };
        }
        return {
          token: p.token,
          user: p.user,
          isAuthenticated: Boolean(p.isAuthenticated && p.token),
        };
      },
    }
  )
);

/** Clear invalid sessions after rehydrate (e.g. old store shape). */
export function validateAuthSession() {
  const { isAuthenticated, token, user, logout } = useAuthStore.getState();
  if (isAuthenticated && (!token || !user)) {
    logout();
  }
}

export function authHeaders(): HeadersInit {
  const { token } = useAuthStore.getState();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export function isProfessional(role?: AppRole): boolean {
  return role === "hr" || role === "doctor";
}
