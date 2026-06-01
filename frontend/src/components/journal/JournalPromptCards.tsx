import { useWellnessStore } from "../../store/wellnessStore";

export type JournalPrompt = {
  id: string;
  titleEn: string;
  titleAm: string;
  descEn: string;
  descAm: string;
  seed: string;
  bg: string;
  dot: string;
};

export const JOURNAL_PROMPTS: JournalPrompt[] = [
  {
    id: "morning",
    titleEn: "Morning reflection",
    titleAm: "የጠዋት ማሰብ",
    descEn: "10 min",
    descAm: "10 ደቂቃ",
    seed: "This morning I notice…",
    bg: "from-[#2C3E50] to-[#3d5a73]",
    dot: "bg-sanctuary-gold",
  },
  {
    id: "work",
    titleEn: "Work stress",
    titleAm: "የስራ ጭንቀት",
    descEn: "Quick release",
    descAm: "ፈጣን",
    seed: "Work has been weighing on me because…",
    bg: "from-sanctuary-lavender/80 to-sanctuary-sky/70",
    dot: "bg-sanctuary-sky",
  },
  {
    id: "gratitude",
    titleEn: "Three good things",
    titleAm: "ሦስት ጥሩ ነገሮች",
    descEn: "5 min",
    descAm: "5 ደቂቃ",
    seed: "Three small things that went okay today:",
    bg: "from-teal/80 to-teal-muted",
    dot: "bg-teal-light",
  },
  {
    id: "unsent",
    titleEn: "Unsent letter",
    titleAm: "ያልተላከ ደብዳቤ",
    descEn: "Write freely",
    descAm: "ነጻ",
    seed: "Dear ___, I never said…",
    bg: "from-sanctuary-rose/70 to-sanctuary-peach/60",
    dot: "bg-sanctuary-peach",
  },
  {
    id: "family",
    titleEn: "Family & home",
    titleAm: "ቤተሰብ",
    descEn: "Ethiopian context",
    descAm: "ባህል",
    seed: "At home and with family, I've been feeling…",
    bg: "from-amber-wash to-sanctuary-gold/40",
    dot: "bg-amber-alert",
  },
  {
    id: "sleep",
    titleEn: "Before sleep",
    titleAm: "ከእንቅልፍ በፊት",
    descEn: "Wind down",
    descAm: "ማረፍ",
    seed: "As the day ends, my body and mind…",
    bg: "from-[#1a2744] to-[#2d4a6f]",
    dot: "bg-sanctuary-sky",
  },
];

type Props = {
  onSelect: (prompt: JournalPrompt) => void;
};

export function JournalDiscoverGrid({ onSelect }: Props) {
  const lang = useWellnessStore((s) => s.lang);

  return (
    <section>
      <h2 className="mb-3 text-lg font-medium text-ink">
        {lang === "am" ? "ግኝ" : "Discover"}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {JOURNAL_PROMPTS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p)}
            className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${p.bg} p-4 text-left shadow-sanctuary transition hover:-translate-y-0.5 hover:shadow-sanctuary-lg active:scale-[0.98]`}
          >
            <span
              className={`mb-8 inline-flex h-10 w-10 rounded-full ${p.dot} opacity-90 shadow-inner`}
            />
            <p className="text-sm font-medium text-white drop-shadow-sm">
              {lang === "am" ? p.titleAm : p.titleEn}
            </p>
            <p className="mt-0.5 text-xs text-white/75">
              {lang === "am" ? p.descAm : p.descEn}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}

export function JournalActivityStrip({ entryCount }: { entryCount: number }) {
  const lang = useWellnessStore((s) => s.lang);
  const activities = [
    { labelEn: "This week", labelAm: "ይህ ሳምንት", pct: Math.min(100, entryCount * 20), bg: "from-teal to-teal/70" },
    { labelEn: "Reflect", labelAm: "መዝገብ", pct: entryCount > 0 ? 60 : 10, bg: "from-[#5A8FAF] to-sanctuary-sky" },
    { labelEn: "Vitality", labelAm: "Vitality", pct: 40, bg: "from-sanctuary-lavender to-sanctuary-rose/80" },
  ];

  return (
    <section>
      <h2 className="mb-3 text-lg font-medium text-ink">
        {lang === "am" ? "ቀጥል…" : "Keep going…"}
      </h2>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 scrollbar-thin">
        {activities.map((a) => (
          <article
            key={a.labelEn}
            className={`min-w-[140px] shrink-0 rounded-3xl bg-gradient-to-br ${a.bg} p-4 text-white shadow-sanctuary`}
          >
            <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/25 text-lg">
              ✦
            </div>
            <p className="text-sm font-medium">{lang === "am" ? a.labelAm : a.labelEn}</p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-white/90 transition-all duration-700"
                style={{ width: `${a.pct}%` }}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function JournalFeaturedHero({ onNew }: { onNew: () => void }) {
  const lang = useWellnessStore((s) => s.lang);

  return (
    <button
      type="button"
      onClick={onNew}
      className="relative w-full overflow-hidden rounded-4xl bg-gradient-to-br from-[#1a2744] via-[#2d4a6f] to-[#3d5a73] p-6 text-left shadow-sanctuary-lg transition hover:shadow-glow"
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <p className="text-xs font-medium uppercase tracking-wider text-white/60">
        {lang === "am" ? "አዲስ" : "Featured"}
      </p>
      <h2 className="mt-1 font-display text-2xl font-medium text-white">
        {lang === "am" ? "የዛሬ መጽሐፍ" : "Today's reflection"}
      </h2>
      <p className="mt-2 max-w-[85%] text-sm text-white/80">
        {lang === "am"
          ? "አንድ ዓረፍተ ነገር — ምንም ትክክለኛ መልስ አያስፈልግም።"
          : "One honest paragraph. No perfect answer needed."}
      </p>
      <span className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
        + {lang === "am" ? "ጀምር" : "Start writing"}
      </span>
    </button>
  );
}
