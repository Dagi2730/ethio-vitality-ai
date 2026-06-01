import { NavLink, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useWellnessStore } from "../../store/wellnessStore";
import { LanguageToggle } from "./LanguageToggle";

const personalLinks = [
  { to: "/personal", end: true, label: "Home" },
  { to: "/personal/coach", label: "Coach" },
  { to: "/personal/reflect", label: "Reflect" },
  { to: "/personal/actions", label: "Actions" },
  { to: "/personal/insights", label: "Insights" },
];

const professionalLinks = [
  { to: "/manager", end: true, label: "Overview" },
  { to: "/manager/heatmap", label: "Heatmap" },
];

export function NavigationRail() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { pathname } = useLocation();
  const lang = useWellnessStore((s) => s.lang);
  const inProfessional = pathname.startsWith("/manager");

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-calm-200 bg-calm-50/90">
      <div className="border-b border-calm-200 px-4 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-vitality-500">
          Ethio-Vitality
        </p>
        <p className="text-sm font-medium text-calm-800 truncate">{user?.name}</p>
        <p className="text-[10px] text-calm-400 capitalize">{user?.role}</p>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-3">
        <div>
          <p
            className={`mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider ${
              !inProfessional ? "text-vitality-600" : "text-calm-400"
            }`}
          >
            {lang === "am" ? "የግል ቦታ" : "Personal Space"}
          </p>
          <ul className="space-y-0.5">
            {personalLinks.map(({ to, end, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive && !inProfessional
                        ? "bg-vitality-600 text-white shadow-sm"
                        : "text-calm-600 hover:bg-white hover:text-vitality-700"
                    }`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p
            className={`mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider ${
              inProfessional ? "text-vitality-600" : "text-calm-400"
            }`}
          >
            {lang === "am" ? "ሙያዊ ቦታ" : "Professional Space"}
          </p>
          <ul className="space-y-0.5">
            {professionalLinks.map(({ to, end, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive && inProfessional
                        ? "bg-vitality-600 text-white shadow-sm"
                        : "text-calm-600 hover:bg-white hover:text-vitality-700"
                    }`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="space-y-2 border-t border-calm-200 p-3">
        <LanguageToggle />
        <button
          type="button"
          onClick={logout}
          className="w-full rounded-lg py-2 text-xs text-calm-500 hover:bg-calm-100 hover:text-calm-800"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
