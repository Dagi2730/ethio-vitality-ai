import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BusinessInsights } from "../../api/client";

const riskColor: Record<string, string> = {
  healthy: "#6fa8cf",
  watch: "#9fc4de",
  elevated: "#d4a574",
  critical: "#c97b7b",
};

export function DepartmentStressChart({
  departments,
}: {
  departments: BusinessInsights["departments"];
}) {
  const data = departments.map((d) => ({
    name: d.department.replace(" ", "\n"),
    stress: d.average_stress,
    risk: d.burnout_risk,
  }));

  return (
    <div className="card">
      <h2 className="mb-4 text-sm font-semibold text-vitality-800">
        Average Stress by Department
      </h2>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8f1f8" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10 }}
              interval={0}
              stroke="#8f8678"
            />
            <YAxis domain={[0, 100]} stroke="#8f8678" />
            <Tooltip
              formatter={(v: number) => [`${v}%`, "Avg stress"]}
              contentStyle={{ borderRadius: 12, border: "1px solid #c5dceb" }}
            />
            <Bar dataKey="stress" radius={[6, 6, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={riskColor[entry.risk] ?? riskColor.healthy} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
