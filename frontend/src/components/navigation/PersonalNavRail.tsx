import { NavLink } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useWellnessStore } from "../../store/wellnessStore";
import { LanguageToggle } from "../layout/LanguageToggle";

const links = [
  { to: "/personal", end: true, label: "Your Space", am: "የእርስዎ ቦታ", icon: "🏠" },
  { to: "/personal/coach", label: "Vitality", am: "Vitality", icon: "🌿" },
  { to: "/personal/reflect", label: "Reflect", am: "መጽሐፍ", icon: "📔" },
  { to: "/personal/actions", label: "Actions", am: "ተግባር", icon: "✨" },
  { to: "/personal/insights", label: "Insights", am: "ትንተና", icon: "📊" },
];

export function PersonalNavRail() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const lang = useWellnessStore((s) => s.lang);

  return (
    <aside className="relative z-10 hidden w-[260px] shrink-0 flex-col border-r border-white/40 bg-white/50 backdrop-blur-xl md:flex">
      <div className="border-b border-white/50 px-5 py-6">
        <p className="font-display text-lg font-medium text-teal">Vitality</p>
        <p className="mt-0.5 truncate text-xs text-ink-muted">{user?.name}</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {links.map(({ to, end, label, am, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition duration-300 ${
                isActive
                  ? "bg-teal-light text-teal shadow-sanctuary"
                  : "text-ink-muted hover:bg-white/60 hover:text-ink"
              }`
            }
          >
            <span className="text-lg" aria-hidden>
              {icon}
            </span>
            {lang === "am" ? am : label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-2 border-t border-white/50 p-3">
        <LanguageToggle />
        <button
          type="button"
          onClick={logout}
          className="w-full rounded-xl py-2 text-xs text-ink-muted transition hover:bg-white/50 hover:text-ink"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
