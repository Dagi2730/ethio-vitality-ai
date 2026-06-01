import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo } from "react";
import { useWellnessStore } from "../../store/wellnessStore";

function buildAnomalyBands(
  data: { time: string; isAnomaly?: boolean }[]
): { x1: string; x2: string }[] {
  const bands: { x1: string; x2: string }[] = [];
  let start: string | null = null;

  for (let i = 0; i < data.length; i++) {
    if (data[i].isAnomaly) {
      if (!start) start = data[i].time;
    } else if (start) {
      bands.push({ x1: start, x2: data[i - 1]?.time ?? start });
      start = null;
    }
  }
  if (start && data.length) {
    bands.push({ x1: start, x2: data[data.length - 1].time });
  }
  return bands;
}

export function StressTrendChart() {
  const history = useWellnessStore((s) => s.history);
  const lang = useWellnessStore((s) => s.lang);
  const bands = useMemo(() => buildAnomalyBands(history), [history]);

  if (history.length === 0) {
    return (
      <div className="card flex h-64 items-center justify-center text-calm-400">
        {lang === "am" ? "ዳታ በመሰብሰብ ላይ…" : "Collecting Digital Twin data…"}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-sm font-semibold text-vitality-800">
          {lang === "am" ? "የጭንቀት እና የልብ ምት አዝማሚ" : "Stress & Heart Rate Trends"}
        </h2>
        {bands.length > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-rose-600">
            <span className="h-2 w-4 rounded bg-rose-200" />
            {lang === "am" ? "አንደበት ጭማሪ" : "Spike detected"}
          </span>
        )}
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8f1f8" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#8f8678" />
            <YAxis yAxisId="stress" domain={[0, 100]} stroke="#4a8fbf" />
            <YAxis
              yAxisId="hr"
              orientation="right"
              domain={[60, 120]}
              stroke="#a8a093"
            />
            {bands.map((b, i) => (
              <ReferenceArea
                key={i}
                x1={b.x1}
                x2={b.x2}
                yAxisId="stress"
                strokeOpacity={0}
                fill="#fecaca"
                fillOpacity={0.45}
              />
            ))}
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #c5dceb",
                fontSize: 12,
              }}
            />
            <Line
              yAxisId="stress"
              type="monotone"
              dataKey="stress"
              name="Stress %"
              stroke="#4a8fbf"
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (!payload?.isAnomaly) return <g key={`${cx}-${cy}`} />;
                return (
                  <circle
                    key={`${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill="#e11d48"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                );
              }}
            />
            <Line
              yAxisId="hr"
              type="monotone"
              dataKey="heartRate"
              name="HR BPM"
              stroke="#a8a093"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
