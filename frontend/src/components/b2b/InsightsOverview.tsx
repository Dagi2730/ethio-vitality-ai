import type { BusinessInsights } from "../../api/client";

export function InsightsOverview({ org }: { org: BusinessInsights["organization"] }) {
  const cards = [
    { label: "Org Avg Stress", value: `${org.average_stress}%` },
    { label: "Classification", value: org.classification },
    { label: "Departments", value: String(org.departments_monitored) },
    { label: "Active Alerts", value: String(org.active_alerts) },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="card text-center sm:text-left">
          <p className="text-xs font-medium uppercase tracking-wide text-calm-500">
            {c.label}
          </p>
          <p className="mt-1 text-2xl font-semibold text-vitality-800">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
