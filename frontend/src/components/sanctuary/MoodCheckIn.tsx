import { useState } from "react";
import type { MoodSentiment } from "../../api/client";
import { useWellnessStore } from "../../store/wellnessStore";

const MOODS: {
  sentiment: MoodSentiment;
  emoji: string;
  labelEn: string;
  labelAm: string;
  tint: string;
}[] = [
  { sentiment: "great", emoji: "😊", labelEn: "Great", labelAm: "በጣም ጥሩ", tint: "bg-sanctuary-gold/30" },
  { sentiment: "okay", emoji: "🙂", labelEn: "Okay", labelAm: "ጥሩ", tint: "bg-sanctuary-mint/40" },
  { sentiment: "low", emoji: "😴", labelEn: "Tired", labelAm: "ደክ", tint: "bg-sanctuary-sky/40" },
  { sentiment: "sad", emoji: "😔", labelEn: "Sad", labelAm: "ሀዘን", tint: "bg-sanctuary-lavender/50" },
  { sentiment: "anxious", emoji: "😰", labelEn: "Anxious", labelAm: "ጭንቀት", tint: "bg-sanctuary-peach/50" },
  { sentiment: "overwhelmed", emoji: "🫂", labelEn: "Heavy", labelAm: "ከባድ", tint: "bg-sanctuary-rose/50" },
];

type Props = { compact?: boolean };

export function MoodCheckIn({ compact }: Props) {
  const lang = useWellnessStore((s) => s.lang);
  const mood = useWellnessStore((s) => s.mood);
  const moodInsight = useWellnessStore((s) => s.moodInsight);
  const logMood = useWellnessStore((s) => s.logMood);
  const [savedFlash, setSavedFlash] = useState(false);

  async function pick(sentiment: MoodSentiment, emoji: string) {
    await logMood(sentiment, emoji);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  }

  return (
    <section className={compact ? "" : "glass-card"}>
      {!compact && (
        <h2 className="mb-4 text-base font-medium text-ink">
          {lang === "am" ? "ዛሬ እንዴት ይሰማዎታል?" : "How do you feel today?"}
        </h2>
      )}
      <div className="flex flex-wrap justify-between gap-2 sm:justify-start sm:gap-3">
        {MOODS.map((m) => (
          <button
            key={m.sentiment}
            type="button"
            onClick={() => pick(m.sentiment, m.emoji)}
            className={`mood-pill ${m.tint} ${
              mood?.sentiment === m.sentiment ? "mood-pill-active" : ""
            }`}
            aria-pressed={mood?.sentiment === m.sentiment}
          >
            <span className="text-2xl leading-none">{m.emoji}</span>
            {!compact && (
              <span className="mt-1 text-[10px] font-medium text-ink-muted">
                {lang === "am" ? m.labelAm : m.labelEn}
              </span>
            )}
          </button>
        ))}
      </div>
      {savedFlash && (
        <p className="mt-3 animate-fade-in text-center text-sm text-teal" aria-live="polite">
          ✓ {lang === "am" ? "ተመዝግቧል" : "Saved"}
        </p>
      )}
      {moodInsight && !savedFlash && (
        <p className="mt-4 rounded-2xl bg-teal-light/60 px-4 py-3 text-sm leading-relaxed text-ink">
          {moodInsight}
        </p>
      )}
    </section>
  );
}
