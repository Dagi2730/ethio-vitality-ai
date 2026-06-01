import { useWellnessStore } from "../../store/wellnessStore";
import { useCountUp } from "../../hooks/useCountUp";

function classify(stress: number): "Low" | "Medium" | "High" {
  if (stress < 40) return "Low";
  if (stress <= 70) return "Medium";
  return "High";
}

export function DigitalTwinCards() {
  const latest = useWellnessStore((s) => s.latest);
  const lang = useWellnessStore((s) => s.lang);
  const hrRaw = latest?.heart_rate;
  const stressRaw = latest?.stress_level ?? 0;
  const hr = useCountUp(typeof hrRaw === "number" ? hrRaw : 0, 800, typeof hrRaw === "number");
  const stress = useCountUp(stressRaw, 800, true);
  const band = classify(stressRaw);

  const stressCardClass =
    band === "High"
      ? "card-stress"
      : band === "Low"
        ? "card-calm"
        : "card";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <article className="card">
        <p className="text-sm font-medium text-ink-muted">
          {lang === "am" ? "ዲጂታል ቅንጣት · ልብ ምት" : "Digital Twin · Heart Rate"}
        </p>
        <p className="mt-2 text-[22px] font-medium text-ink">
          {typeof hrRaw === "number" ? hr : "—"}
          <span className="ml-1 text-base font-normal text-ink-muted">BPM</span>
        </p>
      </article>
      <article className={stressCardClass}>
        <p className="text-sm font-medium text-ink-muted">
          {lang === "am" ? "ዲጂታል ቅንጣት · ጭንቀት" : "Digital Twin · Stress"}
        </p>
        <p className="mt-2 text-[22px] font-medium text-ink">
          {stress}
          <span className="ml-1 text-base font-normal text-ink-muted">%</span>
        </p>
        <span
          className={`mt-3 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
            band === "High"
              ? "bg-amber-wash text-ink"
              : band === "Low"
                ? "bg-teal-muted text-teal"
                : "bg-teal-light text-ink-muted"
          }`}
        >
          {band} {lang === "am" ? "ጭንቀት" : "stress"}
        </span>
      </article>
    </div>
  );
}
