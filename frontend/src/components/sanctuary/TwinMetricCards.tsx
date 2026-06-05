import type { ReactNode } from "react";
import { useCountUp } from "../../hooks/useCountUp";
import { useWellnessStore } from "../../store/wellnessStore";

function MetricRing({
  pct,
  color,
  children,
}: {
  pct: number;
  color: string;
  children: ReactNode;
}) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative flex items-center justify-center">
      <svg width="72" height="72" className="absolute" aria-hidden>
        <circle cx="36" cy="36" r={r} fill="none" stroke="#E8E6E1" strokeWidth="5" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
          className="transition-all duration-700"
        />
      </svg>
      <div className="relative z-10 text-center">{children}</div>
    </div>
  );
}

export function TwinMetricCards() {
  const latest = useWellnessStore((s) => s.latest);
  const lang = useWellnessStore((s) => s.lang);
  const hrRaw = latest?.heart_rate;
  const stressRaw = latest?.stress_level ?? 0;
  const hr = useCountUp(typeof hrRaw === "number" ? hrRaw : 0, 800, typeof hrRaw === "number");
  const stress = useCountUp(stressRaw, 800, true);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
      <article className="glass-card flex items-center gap-4">
        <MetricRing pct={Math.min(100, (typeof hrRaw === "number" ? hrRaw : 72) / 1.2)} color="#1D9E75">
          <span className="text-xl font-medium text-ink">{typeof hrRaw === "number" ? hr : "—"}</span>
          <span className="block text-[10px] text-ink-muted">BPM</span>
        </MetricRing>
        <div>
          <p className="text-sm text-ink-muted">
            {lang === "am" ? "ልብ ምት" : "Heart rate"}
          </p>
          <p className="text-xs text-ink-muted/80">Digital Twin</p>
        </div>
      </article>
      <article className={`glass-card flex items-center gap-4 ${stressRaw >= 55 ? "bg-amber-wash/40" : ""}`}>
        <MetricRing pct={stressRaw} color={stressRaw >= 70 ? "#C9954A" : "#1D9E75"}>
          <span className="text-xl font-medium text-ink">{stress}</span>
          <span className="block text-[10px] text-ink-muted">%</span>
        </MetricRing>
        <div>
          <p className="text-sm text-ink-muted">
            {lang === "am" ? "ጭንቀት" : "Stress"}
          </p>
          <p className="text-xs text-ink-muted/80">Digital Twin</p>
        </div>
      </article>
    </div>
  );
}
