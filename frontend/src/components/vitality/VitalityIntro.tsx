import { useWellnessStore } from "../../store/wellnessStore";

const QUICK_START = [
  { en: "Anxious", am: "ጭንቀት", seed: "I feel anxious right now" },
  { en: "Overwhelmed", am: "ከባድ", seed: "Everything feels overwhelming" },
  { en: "Stressed", am: "ጭንቀት ስራ", seed: "Work stress is hitting me hard" },
  { en: "Tired", am: "ደክ", seed: "I am exhausted and low on energy" },
  { en: "Frustrated", am: "ቁጣ", seed: "I feel frustrated and stuck" },
  { en: "Just talk", am: "መነጋገር", seed: "I just need someone to listen" },
];

type Props = {
  onStart: (seed?: string) => void;
};

export function VitalityIntro({ onStart }: Props) {
  const lang = useWellnessStore((s) => s.lang);

  return (
    <div className="animate-fade-in px-4 py-6">
      <div className="mx-auto max-w-md overflow-hidden rounded-4xl border border-white/50 bg-white/90 p-6 shadow-sanctuary-lg backdrop-blur-md">
        <div className="flex flex-col items-center text-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-full bg-gradient-to-br from-sanctuary-sky via-teal-light to-sanctuary-lavender shadow-glow ring-4 ring-white">
            <div className="flex h-full w-full items-center justify-center text-4xl" aria-hidden>
              🌿
            </div>
            <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-teal" />
          </div>
          <h2 className="mt-4 font-display text-xl font-medium text-ink">
            {lang === "am" ? "እኔ Vitality ነኝ" : "Hi, I'm Vitality"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            {lang === "am"
              ? "በፍጥነትዎ እንወያይ። አንድ ጥያቄ በአንድ ጊዜ — ያለ ፍርድ።"
              : "I can help you now. We'll move at your pace — one question at a time."}
          </p>
        </div>

        <p className="mt-6 text-center text-xs font-medium uppercase tracking-wider text-ink-muted">
          {lang === "am" ? "ከዚህ ይጀምሩ" : "Start here"}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {QUICK_START.map((q) => (
            <button
              key={q.en}
              type="button"
              onClick={() => onStart(q.seed)}
              className="rounded-2xl border border-warm-border bg-warm-bg/80 px-3 py-3 text-sm font-medium text-ink transition hover:border-teal/30 hover:bg-teal-light/50 active:scale-[0.98]"
            >
              {lang === "am" ? q.am : q.en}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onStart()}
          className="btn-primary mt-5 w-full py-3.5 text-sm"
        >
          {lang === "am" ? "ውይይት ይጀምሩ" : "Talk now"}
        </button>
      </div>
    </div>
  );
}
