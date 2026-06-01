import { useEffect, useState } from "react";
import { fetchDashboard } from "../../api/client";
import type { DashboardPayload } from "../../api/client";
import { NarrativeBanner } from "../../components/dashboard/NarrativeBanner";
import { FeatureGrid } from "../../components/sanctuary/FeatureGrid";
import { GreetingHeader } from "../../components/sanctuary/GreetingHeader";
import { MoodCheckIn } from "../../components/sanctuary/MoodCheckIn";
import { SanctuaryHero } from "../../components/sanctuary/SanctuaryHero";
import { StressInsightCards } from "../../components/sanctuary/StressInsightCards";
import { TwinMetricCards } from "../../components/sanctuary/TwinMetricCards";
import { WellnessArc } from "../../components/sanctuary/WellnessArc";
import { useWellnessStore } from "../../store/wellnessStore";

export function DashboardPage() {
  const startPolling = useWellnessStore((s) => s.startPolling);
  const stopPolling = useWellnessStore((s) => s.stopPolling);
  const error = useWellnessStore((s) => s.error);
  const [dash, setDash] = useState<DashboardPayload | null>(null);

  useEffect(() => {
    startPolling();
    const load = () =>
      fetchDashboard()
        .then(setDash)
        .catch(() => setDash(null));
    load();
    const id = setInterval(load, 8000);
    return () => {
      stopPolling();
      clearInterval(id);
    };
  }, [startPolling, stopPolling]);

  return (
    <div className="animate-fade-in space-y-6 pb-8">
      <GreetingHeader />

      {dash?.narrative && <NarrativeBanner narrative={dash.narrative} />}
      {error && (
        <p className="rounded-2xl bg-coral-wash/90 px-4 py-3 text-sm text-ink backdrop-blur-sm">
          {error}
        </p>
      )}

      <SanctuaryHero />
      <MoodCheckIn />
      <FeatureGrid />
      <TwinMetricCards />
      <StressInsightCards />
      <WellnessArc />
    </div>
  );
}
