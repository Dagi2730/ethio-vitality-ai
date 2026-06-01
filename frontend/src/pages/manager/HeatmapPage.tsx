import { useEffect, useState } from "react";
import { BurnoutHeatmap } from "../../components/b2b/BurnoutHeatmap";
import { fetchHeatmap } from "../../api/client";
import type { BusinessInsights } from "../../api/client";

export function HeatmapPage() {
  const [data, setData] = useState<BusinessInsights["burnout_heatmap"] | null>(null);

  useEffect(() => {
    fetchHeatmap()
      .then((r) => setData(r.burnout_heatmap))
      .catch(() => {});
  }, []);

  if (!data) {
    return <p className="py-12 text-center text-calm-400">Loading heatmap…</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-calm-900">Burnout Heatmap</h2>
      <BurnoutHeatmap heatmap={data} />
    </div>
  );
}
