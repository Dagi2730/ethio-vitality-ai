import { useEffect, useState } from "react";
import { useWellnessStore } from "../../store/wellnessStore";

type Phase = "inhale" | "hold" | "exhale" | "idle";

const CYCLE = [
  { phase: "inhale" as Phase, seconds: 4 },
  { phase: "hold" as Phase, seconds: 4 },
  { phase: "exhale" as Phase, seconds: 6 },
];

type Props = {
  guideText?: string;
  supportResources?: Array<{ name: string; note: string; contact: string }>;
  onClose: () => void;
};

export function BreathingGuide({ guideText, supportResources, onClose }: Props) {
  const lang = useWellnessStore((s) => s.lang);
  const [phase, setPhase] = useState<Phase>("idle");
  const [count, setCount] = useState(4);
  const [cycle, setCycle] = useState(0);
  const [active, setActive] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!active) return;
    if (phase === "inhale") setScale(1.12);
    else if (phase === "hold") setScale(1.12);
    else if (phase === "exhale") setScale(0.92);
    else setScale(1);
  }, [active, phase]);

  useEffect(() => {
    if (!active) return;
    if (count <= 0) {
      const idx = CYCLE.findIndex((s) => s.phase === phase);
      const next = CYCLE[(idx + 1) % CYCLE.length];
      if (next.phase === "inhale") {
        const newCycle = cycle + 1;
        setCycle(newCycle);
        if (newCycle >= 4) {
          setActive(false);
          setPhase("idle");
          setScale(1);
          return;
        }
      }
      setPhase(next.phase);
      setCount(next.seconds);
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [active, phase, count, cycle]);

  const labels: Record<Phase, { en: string; am: string }> = {
    inhale: { en: "Breathe in", am: "ይጨሱ" },
    hold: { en: "Hold", am: "ይያዙ" },
    exhale: { en: "Breathe out", am: "ይውጡ" },
    idle: { en: "Ready", am: "ዝግጁ" },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-warm-surface p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-medium text-ink">
            {lang === "am" ? "4-4-6 የማስታገሻ እስትንፋስ" : "4-4-6 Calming Breath"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-muted hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="my-8 flex flex-col items-center">
          <div
            className="flex h-32 w-32 items-center justify-center rounded-full border-[3px] border-teal bg-teal-light"
            style={{
              transform: `scale(${scale})`,
              transition: "transform 1s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <span className="text-4xl font-normal text-teal">{active ? count : "·"}</span>
          </div>
          <p className="mt-4 text-sm font-medium text-ink">
            {labels[phase][lang === "am" ? "am" : "en"]}
          </p>
          {active && (
            <p className="text-xs text-ink-muted">
              {lang === "am" ? `ዑደል ${cycle + 1} / 4` : `Cycle ${cycle + 1} / 4`}
            </p>
          )}
        </div>

        {!active ? (
          <button type="button" onClick={() => {
              setActive(true);
              setPhase("inhale");
              setCount(4);
              setCycle(0);
            }} className="btn-primary w-full py-3 text-sm">
            {lang === "am" ? "ጀምር" : "Start"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setActive(false);
              setPhase("idle");
              setScale(1);
            }}
            className="w-full rounded-xl border border-warm-border py-3 text-sm text-ink-muted"
          >
            {lang === "am" ? "አቁም" : "Stop"}
          </button>
        )}

        {guideText && (
          <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-warm-bg p-3 text-xs leading-relaxed text-ink-muted">
            {guideText}
          </pre>
        )}

        {supportResources && supportResources.length > 0 && (
          <div className="mt-4 border-t border-warm-border pt-4">
            <p className="mb-2 text-xs font-medium uppercase text-ink-muted">
              {lang === "am" ? "የኢትዮጵያ ድጋፍ" : "Ethiopia support"}
            </p>
            <ul className="space-y-2 text-xs text-ink">
              {supportResources.map((r) => (
                <li key={r.name}>
                  <strong>{r.name}</strong> — {r.note}
                  <br />
                  <span className="text-teal">{r.contact}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
