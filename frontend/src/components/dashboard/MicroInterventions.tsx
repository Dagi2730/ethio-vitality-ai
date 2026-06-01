import { Link } from "react-router-dom";
import type { Trigger } from "../../api/client";
import { useWellnessStore } from "../../store/wellnessStore";

const actionRoutes: Record<string, string> = {
  breathing_exercise: "/personal/coach",
  open_coach: "/personal/coach",
  open_reflect: "/personal/reflect",
  view_insights: "/personal/insights",
};

export function MicroInterventions({ triggers }: { triggers: Trigger[] }) {
  const lang = useWellnessStore((s) => s.lang);
  if (!triggers.length) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-calm-500">
        {lang === "am" ? "ፈጣን እርዳታ" : "Micro-interventions"}
      </h3>
      {triggers.map((t) => (
        <Link
          key={t.id}
          to={actionRoutes[t.action] ?? "/personal/coach"}
          className={`block rounded-xl border px-4 py-3 transition hover:shadow-sm ${
            t.severity === "high"
              ? "border-rose-200 bg-rose-50/80"
              : "border-vitality-100 bg-white"
          }`}
        >
          <p className="text-sm font-medium text-vitality-900">
            {lang === "am" ? t.title_am : t.title_en}
          </p>
          <p className="mt-0.5 text-xs text-calm-600">
            {lang === "am" ? t.message_am : t.message_en}
          </p>
        </Link>
      ))}
    </div>
  );
}
