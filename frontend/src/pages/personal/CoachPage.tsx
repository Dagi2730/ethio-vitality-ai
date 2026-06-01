import { useEffect } from "react";
import { VitalityChat } from "../../components/vitality/VitalityChat";
import { useWellnessStore } from "../../store/wellnessStore";

export function CoachPage() {
  const startPolling = useWellnessStore((s) => s.startPolling);
  const stopPolling = useWellnessStore((s) => s.stopPolling);

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  return <VitalityChat />;
}
