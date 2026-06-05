import { useCallback, useEffect, useState } from "react";
import {
  completeAction,
  fetchRoutine,
  refreshActionPlan,
  type ActionPlan,
  type ActionPlanItem,
} from "../../api/client";
import { useWellnessStore } from "../../store/wellnessStore";

const CATEGORY_COLORS: Record<string, string> = {
  breathwork: "border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950",
  physical: "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950",
  journaling: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950",
  mindfulness: "border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950",
  social: "border-pink-200 bg-pink-50 dark:border-pink-800 dark:bg-pink-950",
  lifestyle: "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950",
  spiritual: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
  nutrition: "border-teal-200 bg-teal-50 dark:border-teal-800 dark:bg-teal-950",
};

function ActionCard({
  action,
  onComplete,
  lang,
}: {
  action: ActionPlanItem;
  onComplete: (id: string) => void;
  lang: string;
}) {
  const [busy, setBusy] = useState(false);
  const colors = CATEGORY_COLORS[action.category] ?? "border-vitality-100 bg-white dark:bg-gray-900";

  async function handleDone() {
    if (action.completed || busy) return;
    setBusy(true);
    await onComplete(action.id);
    setBusy(false);
  }

  return (
    <div
      className={`rounded-2xl border p-4 transition ${colors} ${
        action.completed ? "opacity-70" : ""
      }`}
    >
      <div className="flex gap-3">
        <span className="text-2xl">{action.completed ? "✅" : action.emoji}</span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={`font-medium text-ink dark:text-gray-100 ${
                action.completed ? "line-through" : ""
              }`}
            >
              {action.title}
            </h3>
            <span className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] dark:bg-gray-800">
              {action.category}
            </span>
            <span className="ml-auto text-[10px] text-ink-muted">⏱ {action.duration} min</span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted dark:text-gray-400">
            {action.description}
          </p>
          {!action.completed && (
            <button
              type="button"
              onClick={handleDone}
              disabled={busy}
              className="mt-3 rounded-lg bg-teal px-4 py-1.5 text-xs font-medium text-white disabled:opacity-60"
            >
              {busy
                ? lang === "am"
                  ? "..."
                  : "Saving..."
                : lang === "am"
                  ? "ተጠናቋል ✓"
                  : "Mark done ✓"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ActionsPage() {
  const lang = useWellnessStore((s) => s.lang);
  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchRoutine(lang);
      setPlan(data);
    } catch {
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleComplete(actionId: string) {
    try {
      const res = await completeAction(actionId);
      setPlan(res.plan);
    } catch {
      load();
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const data = await refreshActionPlan();
      setPlan(data);
    } finally {
      setRefreshing(false);
    }
  }

  const completed = plan?.actions.filter((a) => a.completed).length ?? 0;
  const total = plan?.actions.length ?? 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (loading) {
    return (
      <div className="py-12 text-center text-ink-muted">
        <span className="text-3xl">⚡</span>
        <p className="mt-2">{lang === "am" ? "ዕቅድ በመገንባት ላይ..." : "Building your plan..."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-20 md:pb-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink dark:text-gray-100">
            {lang === "am" ? "የዛሬ እርምጃ ዕቅድ" : "Today's Action Plan"}
          </h2>
          <p className="text-sm text-ink-muted">
            {new Date().toLocaleDateString(lang === "am" ? "am-ET" : "en-ET", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
            {plan ? ` · ${plan.total_minutes} min` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="rounded-lg border border-warm-border px-3 py-1.5 text-xs text-ink-muted dark:border-gray-600"
        >
          {refreshing ? "..." : "↻"}
        </button>
      </header>

      {plan?.status_summary && (
        <div className="rounded-2xl border-l-4 border-teal bg-teal-light/60 px-4 py-3 text-sm dark:bg-teal-950/40">
          {plan.status_summary}
        </div>
      )}

      {total > 0 && (
        <div>
          <div className="mb-1 flex justify-between text-xs text-ink-muted">
            <span>{lang === "am" ? "የዛሬ እድገት" : "Today's progress"}</span>
            <span className="font-medium text-teal">
              {completed}/{total}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-teal transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-3">
        {plan?.actions.map((action) => (
          <ActionCard
            key={action.id}
            action={action}
            onComplete={handleComplete}
            lang={lang}
          />
        ))}
      </div>

      {plan?.vitals_snapshot && (
        <div className="rounded-xl border border-warm-border bg-white/50 p-3 text-xs dark:border-gray-700 dark:bg-gray-900">
          <p className="mb-1 font-medium text-ink-muted">
            {lang === "am" ? "በዚህ ዕቅድ ላይ የተመሰረተ" : "Plan based on vitals"}
          </p>
          <div className="flex flex-wrap gap-4">
            <span>❤️ HR: {plan.vitals_snapshot.heart_rate} bpm</span>
            <span>🧠 Stress: {plan.vitals_snapshot.stress_level}/100</span>
            <span>🫁 SpO₂: {plan.vitals_snapshot.spo2}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
