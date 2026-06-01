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

  const ws = data.wellness_score;
  const mp = data.mood_prediction;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-calm-900">
          {lang === "am" ? "ትንተና ሞተር" : "Insight Engine"}
        </h1>
        <p className="text-sm text-calm-500">
          {lang === "am"
            ? "የእንክብካቤ ነጥብ · ስሜት ትንበያ · ዕለታዊ ምክሮች"
            : "Wellness score · mood forecast · daily suggestions"}
        </p>
      </header>

      {ws && (
        <div className="card-data text-center">
          <p className="text-xs text-calm-500">Wellness score</p>
          <p className="text-4xl font-semibold text-vitality-800">{ws.score}</p>
          <p className="mt-1 capitalize text-sm text-calm-600">{ws.band.replace("_", " ")}</p>
          <div className="mt-4 flex justify-center gap-4 text-xs text-calm-500">
            <span>Stress {ws.components.stress}</span>
            <span>Mood {ws.components.mood}</span>
            <span>Activity {ws.components.activity}</span>
          </div>
        </div>
      )}

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
          <p className="text-xs text-calm-500">24h mood forecast</p>
          <p className="text-lg font-semibold capitalize text-calm-700">
            {mp?.predicted_sentiment ?? "—"}
          </p>
          {mp && (
            <p className="text-[10px] text-calm-400">
              {Math.round(mp.confidence * 100)}% confidence
            </p>
          )}
        </div>
      </div>

      {data.daily_suggestions && data.daily_suggestions.length > 0 && (
        <div className="card-data">
          <h3 className="mb-3 text-sm font-semibold text-vitality-800">
            {lang === "am" ? "የዛሬ ምክሮች" : "Today's suggestions"}
          </h3>
          <ul className="space-y-3">
            {data.daily_suggestions.map((s) => (
              <li
                key={s.id}
                className="rounded-lg border border-vitality-100 bg-vitality-50/40 px-3 py-2"
              >
                <p className="text-sm font-medium text-calm-900">
                  {lang === "am" ? s.title_am : s.title_en}
                </p>
                <p className="text-xs text-calm-600">
                  {lang === "am" ? s.body_am : s.body_en}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.predictions.length > 0 && (
        <div className="card-data">
          <h3 className="mb-3 text-sm font-semibold text-vitality-800">
            {lang === "am" ? "የስሜት ቅንጅቶች" : "Mood patterns"}
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
