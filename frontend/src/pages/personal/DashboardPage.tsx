import { useEffect, useState } from "react";
import { fetchDashboard } from "../../api/client";
import type { DashboardPayload } from "../../api/client";
import { NarrativeBanner } from "../../components/dashboard/NarrativeBanner";
import { FeatureGrid } from "../../components/sanctuary/FeatureGrid";
import { GreetingHeader } from "../../components/sanctuary/GreetingHeader";
import { MoodCheckIn } from "../../components/sanctuary/MoodCheckIn";
import { SanctuaryHero } from "../../components/sanctuary/SanctuaryHero";
import { StressInsightCards } from "../../components/sanctuary/StressInsightCards";
import { SpO2Card } from "../../components/sanctuary/SpO2Card";
import { ThemeToggle } from "../../components/layout/ThemeToggle";
import { TwinMetricCards } from "../../components/sanctuary/TwinMetricCards";
import { WellnessArc } from "../../components/sanctuary/WellnessArc";
import { useWellnessStore } from "../../store/wellnessStore";

export function DashboardPage() {
  const startPolling = useWellnessStore((s) => s.startPolling);
  const stopPolling = useWellnessStore((s) => s.stopPolling);
  const hydrateMood = useWellnessStore((s) => s.hydrateMood);
  const lang = useWellnessStore((s) => s.lang);
  const error = useWellnessStore((s) => s.error);
  const [dash, setDash] = useState<DashboardPayload | null>(null);

  useEffect(() => {
    startPolling();
    const load = () =>
      fetchDashboard()
        .then((data) => {
          setDash(data);
          if (data.mood) {
            hydrateMood({
              sentiment: data.mood.sentiment as import("../../api/client").MoodSentiment,
              emoji: data.mood.emoji,
              timestamp: data.mood.timestamp,
            });
          }
        })
        .catch(() => setDash(null));
    load();
    const id = setInterval(load, 8000);
    return () => {
      stopPolling();
      clearInterval(id);
    };
  }, [startPolling, stopPolling, hydrateMood]);

  return (
    <div className="animate-fade-in space-y-6 pb-8">
      <div className="flex items-start justify-between gap-3">
        <GreetingHeader />
        <ThemeToggle compact />
      </div>

      {dash?.wellness_score != null && (
        <div className="glass-card flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-muted">
              {lang === "am" ? "የዛሬ ደህንነት ነጥብ" : "Daily Wellness Score"}
            </p>
            <p className="text-3xl font-bold text-teal">{dash.wellness_score}</p>
          </div>
          <div className="text-right text-xs text-ink-muted">
            <p>{lang === "am" ? "ከ 100" : "out of 100"}</p>
            {dash.vitals?.source === "proteus" && (
              <span className="mt-1 inline-block rounded-full bg-teal/10 px-2 py-0.5 text-teal">
                Proteus Live
              </span>
            )}
          </div>
        </div>
      )}

      {dash?.alerts && dash.alerts.length > 0 && (
        <div className="space-y-2">
          {dash.alerts.map((alert) => (
            <p
              key={alert}
              className={`rounded-2xl px-4 py-3 text-sm ${
                alert.includes("CRITICAL")
                  ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
                  : "bg-amber-wash text-ink dark:bg-amber-950 dark:text-amber-100"
              }`}
            >
              {alert}
            </p>
          ))}
        </div>
      )}

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
      <SpO2Card />
      <StressInsightCards />
      <WellnessArc />
    </div>
  );
}
