import { useWellnessStore } from "../../store/wellnessStore";

function Ring({ pct, color }: { pct: number; color: string }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width="44" height="44" className="shrink-0" aria-hidden>
      <circle cx="22" cy="22" r={r} fill="none" stroke="#E8E6E1" strokeWidth="4" />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 22 22)"
      />
    </svg>
  );
}

export function StressInsightCards() {
  const lang = useWellnessStore((s) => s.lang);
  const stress = useWellnessStore((s) => s.latest?.stress_level) ?? 0;

  if (stress < 50) return null;

  const emotional = Math.min(99, Math.round(stress * 0.85));
  const physical = Math.min(99, Math.round(stress * 0.65));
  const environmental = Math.min(99, Math.round(stress * 0.4));

  const items = [
    {
      key: "emotional",
      pct: emotional,
      color: "#C9954A",
      titleEn: "Emotional load",
      titleAm: "ስሜታዊ ጫን",
      descEn: "Anxiety and mental fatigue may be building.",
      descAm: "ጭንቀት እና ድካም ሊታይ ይችላል።",
    },
    {
      key: "physical",
      pct: physical,
      color: "#5A8FAF",
      titleEn: "Physical signals",
      titleAm: "የሰውነት ምልክት",
      descEn: "Tension in body — rest and breath help.",
      descAm: "የሰውነት ጭንቀት — እረፍት ይሞክሩ።",
    },
    {
      key: "environment",
      pct: environmental,
      color: "#E8B84A",
      titleEn: "Environment",
      titleAm: "አካባቢ",
      descEn: "Noise, screens, or pace may be adding load.",
      descAm: "ሽክርክር ወይም ፍጥነት ሊጨምር ይችላል።",
    },
  ];

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 rounded-2xl bg-amber-wash/90 px-4 py-2.5 text-sm text-ink backdrop-blur-sm">
        <span aria-hidden>◐</span>
        <span>
          {lang === "am"
            ? `ጭንቀት: ከፍ (${stress}%)`
            : `Stress level: elevated (${stress}%)`}
        </span>
      </div>
      {items.map((item) => (
        <article key={item.key} className="glass-card-soft flex gap-4">
          <Ring pct={item.pct} color={item.color} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-medium text-ink">
                {lang === "am" ? item.titleAm : item.titleEn}
              </h3>
              <span className="text-sm font-medium text-ink-muted">{item.pct}%</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              {lang === "am" ? item.descAm : item.descEn}
            </p>
          </div>
        </article>
      ))}
    </section>
  );
}
