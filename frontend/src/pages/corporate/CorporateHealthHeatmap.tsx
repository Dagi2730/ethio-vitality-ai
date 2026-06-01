import { useEffect, useState } from "react";
import { BurnoutHeatmap } from "../../components/b2b/BurnoutHeatmap";
import { DepartmentStressChart } from "../../components/charts/DepartmentStressChart";
import { fetchBusinessInsights } from "../../api/client";
import type { BusinessInsights } from "../../api/client";

/** HR home — aggregate department burnout heatmap. */
export function CorporateHealthHeatmap() {
  const [insights, setInsights] = useState<BusinessInsights | null>(null);

  useEffect(() => {
    fetchBusinessInsights().then(setInsights).catch(() => {});
    const id = setInterval(
      () => fetchBusinessInsights().then(setInsights).catch(() => {}),
      20000
    );
    return () => clearInterval(id);
  }, []);

  if (!insights) {
    return <p className="py-12 text-center text-calm-400">Loading corporate view…</p>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-calm-900">Corporate Health Heatmap</h1>
        <p className="text-sm text-calm-500">{insights.privacy_notice}</p>
      </header>
      <BurnoutHeatmap heatmap={insights.burnout_heatmap} />
      <DepartmentStressChart departments={insights.departments} />
    </div>
  );
}
