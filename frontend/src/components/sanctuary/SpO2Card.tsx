import { useCountUp } from "../../hooks/useCountUp";
import { useWellnessStore } from "../../store/wellnessStore";

export function SpO2Card() {
  const latest = useWellnessStore((s) => s.latest);
  const lang = useWellnessStore((s) => s.lang);
  const value = latest?.spo2 ?? 98.0;
  const display = useCountUp(value, 800, true);

  const status =
    value >= 95
      ? { label: lang === "am" ? "መደበኛ" : "Normal", color: "text-teal", bg: "bg-teal-light/60", bar: "bg-teal" }
      : value >= 90
        ? { label: lang === "am" ? "ዝቅተኛ" : "Low", color: "text-amber-alert", bg: "bg-amber-wash/80", bar: "bg-amber-alert" }
        : { label: lang === "am" ? "አስቸኳይ" : "Critical", color: "text-red-600", bg: "bg-coral-wash", bar: "bg-red-500" };

  const barWidth = Math.min(100, ((value - 85) / 15) * 100);

  return (
    <article className={`glass-card ${status.bg} sm:col-span-2`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl" aria-hidden>🫁</span>
        <span className="text-sm font-medium text-ink-muted dark:text-gray-400">
          {lang === "am" ? "የደም ኦክሲጅን" : "Blood Oxygen"}
        </span>
        {latest?.source === "proteus" && (
          <span className="ml-auto rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-medium text-teal">
            Proteus
          </span>
        )}
      </div>
      <div className="flex items-end gap-1">
        <span className={`text-3xl font-bold ${status.color}`}>{display}</span>
        <span className="mb-1 text-sm text-ink-muted">%</span>
      </div>
      <span className={`text-xs font-semibold ${status.color}`}>{status.label}</span>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full rounded-full transition-all duration-500 ${status.bar}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-ink-muted">
        <span>85%</span>
        <span>{lang === "am" ? "መደበኛ ≥95%" : "Normal ≥95%"}</span>
        <span>100%</span>
      </div>
    </article>
  );
}
