import { useCountUp } from "../../hooks/useCountUp";
import { useWellnessStore } from "../../store/wellnessStore";

/** Semi-circular wellness gauge inspired by mood-journey UIs */
export function WellnessArc() {
  const lang = useWellnessStore((s) => s.lang);
  const latest = useWellnessStore((s) => s.latest);
  const stress = latest?.stress_level ?? 45;
  const wellness = Math.max(12, Math.min(98, 100 - stress));
  const display = useCountUp(wellness, 900);

  const r = 72;
  const cx = 100;
  const cy = 95;
  const startAngle = Math.PI;
  const endAngle = 0;
  const valueAngle = startAngle - (display / 100) * Math.PI;

  const arc = (angle: number) => {
    const x = cx + r * Math.cos(angle);
    const y = cy - r * Math.sin(angle);
    return `${x},${y}`;
  };

  const bgPath = `M ${arc(startAngle)} A ${r} ${r} 0 0 1 ${arc(endAngle)}`;
  const fgPath = `M ${arc(startAngle)} A ${r} ${r} 0 0 1 ${arc(valueAngle)}`;

  return (
    <section className="glass-card">
      <h2 className="mb-2 text-base font-medium text-ink">
        {lang === "am" ? "የሳምንቱ ውህደት" : "Your week at a glance"}
      </h2>
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 200 110" className="h-32 w-full max-w-[220px]" aria-hidden>
          <defs>
            <linearGradient id="wellnessGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1D9E75" />
              <stop offset="100%" stopColor="#9FD4BF" />
            </linearGradient>
          </defs>
          <path
            d={bgPath}
            fill="none"
            stroke="#E8E6E1"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d={fgPath}
            fill="none"
            stroke="url(#wellnessGrad)"
            strokeWidth="14"
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <p className="-mt-2 text-center">
          <span className="font-display text-3xl font-medium text-teal">{display}%</span>
          <span className="mt-1 block text-sm text-ink-muted">
            {lang === "am" ? "የእርስዎ ውህደት ነጥብ" : "Wellness balance"}
          </span>
        </p>
      </div>
    </section>
  );
}
