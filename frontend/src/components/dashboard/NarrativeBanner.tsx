import type { DashboardPayload } from "../../api/client";
import { useWellnessStore } from "../../store/wellnessStore";

const stageStyles: Record<string, string> = {
  thriving: "from-teal-muted/80 to-teal-light/60 border-teal/20",
  balance: "from-sanctuary-sky/40 to-teal-light/50 border-white/60",
  awareness: "from-amber-wash/80 to-sanctuary-peach/40 border-amber-alert/15",
  intervention: "from-coral-wash/90 to-sanctuary-rose/40 border-coral-wash",
};

export function NarrativeBanner({ narrative }: { narrative: DashboardPayload["narrative"] }) {
  const lang = useWellnessStore((s) => s.lang);
  const style = stageStyles[narrative.stage] ?? stageStyles.balance;

  return (
    <div
      className={`rounded-3xl border bg-gradient-to-r p-4 shadow-sanctuary backdrop-blur-sm ${style}`}
    >
      <p className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">
        {lang === "am" ? "የዛሬው ምልክት" : "Today's note"}
      </p>
      <p className="mt-1 text-sm font-medium leading-relaxed text-ink">
        {lang === "am" ? narrative.label_am : narrative.label_en}
      </p>
    </div>
  );
}
