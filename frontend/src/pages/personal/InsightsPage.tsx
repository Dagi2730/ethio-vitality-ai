import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchPersonalInsights, type PersonalInsights } from "../../api/client";
import { useWellnessStore } from "../../store/wellnessStore";

export function InsightsPage() {
  const lang = useWellnessStore((s) => s.lang);
  const [data, setData] = useState<PersonalInsights | null>(null);

  useEffect(() => {
    fetchPersonalInsights().then(setData).catch(() => {});
    const id = setInterval(() => fetchPersonalInsights().then(setData).catch(() => {}), 20000);
    return () => clearInterval(id);
  }, []);

  if (!data) {
    return <p className="py-12 text-center text-calm-400">Loading insights…</p>;
  }

  const chartData = data.predictions.map((p) => ({
    name: p.factor,
    confidence: Math.round(p.confidence * 100),
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-calm-900">
          {lang === "am" ? "ትንተና ሞተር" : "Insight Engine"}
        </h1>
        <p className="text-sm text-calm-500">
          {lang === "am"
            ? "እንቅልፍ · ልማድ · ስሜት ትንበያ"
            : "Sleep · habits · mood predictions"}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-data text-center">
          <p className="text-xs text-calm-500">Avg stress</p>
          <p className="text-2xl font-semibold text-vitality-800">
            {String(data.summary.avg_stress)}%
          </p>
        </div>
        <div className="card-data text-center">
          <p className="text-xs text-calm-500">7d burnout risk</p>
          <p className="text-2xl font-semibold text-amber-700">
            {Math.round(data.risk_forecast.burnout_7d_probability * 100)}%
          </p>
        </div>
        <div className="card-data text-center">
          <p className="text-xs text-calm-500">Trend</p>
          <p className="text-2xl font-semibold capitalize text-calm-700">
            {data.risk_forecast.trend}
          </p>
        </div>
      </div>

      {data.predictions.length > 0 && (
        <div className="card-data">
          <h3 className="mb-3 text-sm font-semibold text-vitality-800">
            {lang === "am" ? "ትንበያዎች" : "Predictions"}
          </h3>
          <ul className="space-y-3">
            {data.predictions.map((p) => (
              <li
                key={p.factor}
                className="rounded-lg bg-vitality-50/60 px-3 py-2 text-sm text-calm-800"
              >
                {lang === "am" ? p.insight_am : p.insight_en}
              </li>
            ))}
          </ul>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="card h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8f1f8" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="confidence" fill="#4a8fbf" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
