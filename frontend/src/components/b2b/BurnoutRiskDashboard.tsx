import type { BusinessInsights } from "../../api/client";

const severityStyles: Record<string, string> = {
  critical: "bg-rose-100 text-rose-800 border-rose-200",
  elevated: "bg-amber-50 text-amber-800 border-amber-200",
  watch: "bg-vitality-100 text-vitality-800 border-vitality-200",
  healthy: "bg-emerald-50 text-emerald-800 border-emerald-200",
};

export function BurnoutRiskDashboard({
  departments,
  alerts,
}: {
  departments: BusinessInsights["departments"];
  alerts: BusinessInsights["alerts"];
}) {
  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="mb-3 text-sm font-semibold text-vitality-800">
          Burnout Risk by Department
        </h2>
        <ul className="space-y-2">
          {departments.map((d) => (
            <li
              key={d.department}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-calm-100 bg-calm-50/50 px-3 py-2"
            >
              <span className="font-medium text-calm-800">{d.department}</span>
              <span
                className={`badge-alert border ${severityStyles[d.burnout_risk] ?? severityStyles.watch}`}
              >
                {d.burnout_risk}
              </span>
              <span className="w-full text-xs text-calm-500 sm:w-auto">
                {d.average_stress}% avg · {d.classification}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {alerts.length > 0 && (
        <div className="card border-amber-200 bg-amber-50/40">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900">
            <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" />
            Active Alerts ({alerts.length})
          </h3>
          <ul className="space-y-2 text-sm text-amber-900/90">
            {alerts.map((a, i) => (
              <li key={i} className="rounded-lg bg-white/60 px-3 py-2">
                <span className="font-medium">{a.department}</span> — {a.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
