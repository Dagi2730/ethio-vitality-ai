import { NavLink } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { LanguageToggle } from "../layout/LanguageToggle";

const links = [
  { to: "/corporate/heatmap", end: true, label: "Health Heatmap" },
  { to: "/corporate/overview", label: "Org Overview" },
];

export function CorporateNavRail() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-calm-200 bg-calm-50/90">
      <div className="border-b border-calm-200 px-4 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-calm-500">
          Corporate · HR
        </p>
        <p className="truncate text-sm font-medium text-calm-800">{user?.name}</p>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {links.map(({ to, end, label }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2.5 text-sm font-medium ${
                isActive
                  ? "bg-vitality-600 text-white"
                  : "text-calm-600 hover:bg-white"
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-2 border-t border-calm-200 p-3">
        <LanguageToggle />
        <button
          type="button"
          onClick={logout}
          className="w-full py-2 text-xs text-calm-500"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
