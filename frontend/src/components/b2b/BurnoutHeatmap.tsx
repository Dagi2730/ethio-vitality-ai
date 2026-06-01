import type { BusinessInsights } from "../../api/client";

function cellColor(value: number): string {
  if (value >= 72) return "bg-rose-500";
  if (value >= 58) return "bg-amber-400";
  if (value >= 45) return "bg-vitality-300";
  return "bg-emerald-300";
}

export function BurnoutHeatmap({
  heatmap,
}: {
  heatmap: BusinessInsights["burnout_heatmap"];
}) {
  const { days, departments, cells } = heatmap;

  const getCell = (dept: string, day: string) =>
    cells.find((c) => c.department === dept && c.day === day)?.stress_index ?? 0;

  return (
    <div className="card overflow-x-auto">
      <h2 className="mb-4 text-sm font-semibold text-calm-800">Burnout Heatmap</h2>
      <p className="mb-3 text-xs text-calm-500">
        Anonymized aggregate stress index by department × day. No individual data.
      </p>
      <table className="w-full min-w-[480px] border-collapse text-center text-xs">
        <thead>
          <tr>
            <th className="p-2 text-left text-calm-500" />
            {days.map((d) => (
              <th key={d} className="p-2 font-medium text-calm-600">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {departments.map((dept) => (
            <tr key={dept}>
              <td className="p-2 text-left text-calm-700">{dept}</td>
              {days.map((day) => {
                const v = getCell(dept, day);
                return (
                  <td key={day} className="p-1">
                    <div
                      className={`mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-[10px] font-medium text-white ${cellColor(v)}`}
                      title={`${dept} ${day}: ${v}`}
                    >
                      {v}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
