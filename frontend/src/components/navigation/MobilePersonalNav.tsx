import { NavLink } from "react-router-dom";
import { useWellnessStore } from "../../store/wellnessStore";

const tabs = [
  { to: "/personal", end: true, icon: "🏠", label: "Space" },
  { to: "/personal/coach", icon: "🌿", label: "Vitality" },
  { to: "/personal/reflect", icon: "📔", label: "Journal" },
  { to: "/personal/insights", icon: "📊", label: "Insights" },
];

export function MobilePersonalNav() {
  const lang = useWellnessStore((s) => s.lang);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/50 bg-white/80 px-2 py-2 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-lg justify-around">
        {tabs.map(({ to, end, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center rounded-2xl px-3 py-1.5 text-[10px] font-medium transition ${
                isActive ? "text-teal" : "text-ink-muted"
              }`
            }
          >
            <span className="text-xl">{icon}</span>
            {lang === "am" && label === "Vitality" ? "Vitality" : label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
