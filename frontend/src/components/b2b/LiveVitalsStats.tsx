import type { BusinessInsights } from "../../api/client";

type Props = Pick<
  BusinessInsights,
  | "readings_count"
  | "data_source"
  | "burnout_risk_percent"
  | "low_oxygen_episodes"
  | "heart_rate"
  | "stress_level"
  | "spo2"
  | "alert_summary"
>;

export function LiveVitalsStats({
  readings_count,
  data_source,
  burnout_risk_percent,
  low_oxygen_episodes,
  heart_rate,
  stress_level,
  spo2,
  alert_summary,
}: Props) {
  const cards = [
    {
      label: "Live Readings",
      value: readings_count != null ? String(readings_count) : "—",
      sub: data_source === "live_vitals" ? "From opted-in users" : "",
    },
    {
      label: "Avg Heart Rate",
      value: heart_rate?.avg != null ? `${heart_rate.avg} bpm` : "—",
      sub: heart_rate?.latest != null ? `Latest: ${heart_rate.latest}` : "",
    },
    {
      label: "Avg Stress",
      value: stress_level?.avg != null ? `${stress_level.avg}%` : "—",
      sub: stress_level?.max != null ? `Peak: ${stress_level.max}%` : "",
    },
    {
      label: "Avg SpO₂",
      value: spo2?.avg != null ? `${spo2.avg}%` : "—",
      sub: low_oxygen_episodes != null ? `${low_oxygen_episodes} low-O₂ episodes` : "",
    },
    {
      label: "Burnout Risk",
      value: burnout_risk_percent != null ? `${burnout_risk_percent}%` : "—",
      sub: "High stress + elevated HR",
    },
    {
      label: "Critical Alerts",
      value: alert_summary?.critical_spo2_readings != null
        ? String(alert_summary.critical_spo2_readings)
        : "0",
      sub: "SpO₂ below 90%",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="card">
          <p className="text-xs font-medium uppercase tracking-wide text-calm-500">{c.label}</p>
          <p className="mt-1 text-2xl font-semibold text-vitality-800">{c.value}</p>
          {c.sub && <p className="mt-0.5 text-xs text-calm-500">{c.sub}</p>}
        </div>
      ))}
    </div>
  );
}
