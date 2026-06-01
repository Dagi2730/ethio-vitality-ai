import { useEffect, useState } from "react";
import { fetchRoutine, type RoutineBlock } from "../../api/client";
import { useWellnessStore } from "../../store/wellnessStore";

export function ActionsPage() {
  const lang = useWellnessStore((s) => s.lang);
  const [blocks, setBlocks] = useState<RoutineBlock[]>([]);
  const [theme, setTheme] = useState("");

  useEffect(() => {
    fetchRoutine(lang)
      .then((r) => {
        setBlocks(r.blocks);
        setTheme(lang === "am" ? r.focus_theme_am : r.focus_theme_en);
      })
      .catch(() => {});
  }, [lang]);

  const categoryColors: Record<string, string> = {
    intervention: "border-rose-200 bg-rose-50",
    mindfulness: "border-vitality-300 bg-vitality-50",
    sleep: "border-calm-200 bg-calm-50",
    movement: "border-emerald-200 bg-emerald-50",
  };

  return (
    <div className="space-y-5 pb-20 md:pb-6">
      <header>
        <h2 className="text-xl font-semibold text-vitality-900">
          {lang === "am" ? "የተግባር ማዕከል" : "Action Hub"}
        </h2>
        <p className="text-sm text-calm-500">
          {lang === "am" ? "አውቶ-ሩቲን ግንባቻ" : "Auto-Routine Builder"}
        </p>
        {theme && (
          <p className="mt-2 text-xs font-medium text-vitality-600">
            {lang === "am" ? "ትኩረት" : "Focus"}: {theme}
          </p>
        )}
      </header>

      <ol className="relative space-y-0 border-l-2 border-vitality-200 pl-6">
        {blocks.map((b, i) => (
          <li key={`${b.time}-${i}`} className="pb-6">
            <span className="absolute -left-[9px] mt-1 h-4 w-4 rounded-full border-2 border-white bg-vitality-500" />
            <div
              className={`rounded-xl border p-4 ${
                categoryColors[b.category] ?? "border-vitality-100 bg-white"
              } ${b.priority ? "ring-2 ring-vitality-300" : ""}`}
            >
              <time className="text-xs font-semibold text-vitality-600">{b.time}</time>
              <p className="mt-1 text-sm text-calm-800">{b.activity}</p>
              {b.priority && (
                <span className="mt-2 inline-block text-[10px] font-medium uppercase text-vitality-700">
                  {lang === "am" ? "አስቀድሞ" : "Priority"}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
