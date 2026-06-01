import { useEffect } from "react";
import { BurnoutRiskDashboard } from "../../components/b2b/BurnoutRiskDashboard";
import { InsightsOverview } from "../../components/b2b/InsightsOverview";
import { DepartmentStressChart } from "../../components/charts/DepartmentStressChart";
import { useWellnessStore } from "../../store/wellnessStore";
import { useAuthStore } from "../../store/authStore";

export function OverviewPage() {
  const insights = useWellnessStore((s) => s.insights);
  const fetchInsights = useWellnessStore((s) => s.fetchInsights);
  const error = useWellnessStore((s) => s.error);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;
    fetchInsights();
    const id = setInterval(fetchInsights, 15000);
    return () => clearInterval(id);
  }, [fetchInsights, token]);

  if (!insights) {
    return <p className="py-16 text-center text-calm-400">Loading organizational analytics…</p>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-calm-900">HR / Doctor Overview</h1>
        <p className="text-sm text-calm-500">{insights.privacy_notice}</p>
      </header>
      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error.includes("403")
            ? "Access denied — set role to HR or Doctor in the header."
            : error}
        </p>
      )}
      <InsightsOverview org={insights.organization} />
      <div className="grid gap-6 xl:grid-cols-2">
        <DepartmentStressChart departments={insights.departments} />
        <BurnoutRiskDashboard departments={insights.departments} alerts={insights.alerts} />
      </div>
    </div>
  );
}
