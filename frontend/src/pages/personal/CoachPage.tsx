import { useEffect, useState } from "react";
import { BreathingGuide } from "../../components/dashboard/BreathingGuide";
import { VitalityChat } from "../../components/vitality/VitalityChat";
import { useWellnessStore } from "../../store/wellnessStore";

export function CoachPage() {
  const startPolling = useWellnessStore((s) => s.startPolling);
  const stopPolling = useWellnessStore((s) => s.stopPolling);
  const latest = useWellnessStore((s) => s.latest);
  const [autoBreathing, setAutoBreathing] = useState(false);

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  useEffect(() => {
    if ((latest?.stress_level ?? 0) > 70) {
      setAutoBreathing(true);
    }
  }, [latest?.stress_level]);

  return (
    <>
      <VitalityChat />
      {autoBreathing && (
        <BreathingGuide onClose={() => setAutoBreathing(false)} />
      )}
    </>
  );
}
