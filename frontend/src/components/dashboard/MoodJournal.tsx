import { useState } from "react";
import type { MoodSentiment } from "../../api/client";
import { useWellnessStore } from "../../store/wellnessStore";

const MOODS: { sentiment: MoodSentiment; emoji: string; labelEn: string; labelAm: string }[] = [
  { sentiment: "great", emoji: "😊", labelEn: "Great", labelAm: "በጣም ጥሩ" },
  { sentiment: "okay", emoji: "🙂", labelEn: "Okay", labelAm: "ጥሩ" },
  { sentiment: "low", emoji: "😐", labelEn: "Low", labelAm: "ዝቅተኛ" },
  { sentiment: "sad", emoji: "😔", labelEn: "Sad", labelAm: "ሀዘን" },
  { sentiment: "anxious", emoji: "😰", labelEn: "Anxious", labelAm: "ጭንቀት" },
  { sentiment: "overwhelmed", emoji: "😢", labelEn: "Overwhelmed", labelAm: "ከባድ" },
];

export function MoodJournal({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const lang = useWellnessStore((s) => s.lang);
  const mood = useWellnessStore((s) => s.mood);
  const moodInsight = useWellnessStore((s) => s.moodInsight);
  const logMood = useWellnessStore((s) => s.logMood);
  const [open, setOpen] = useState(defaultOpen);

  const title = lang === "am" ? "አሁን ስሜትዎ ምን ይመስላል?" : "How are you feeling right now?";

  return (
    <section className="card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <h2 className="text-sm font-semibold text-vitality-800">{title}</h2>
          {mood && (
            <p className="mt-1 text-xs text-calm-500">
              {lang === "am" ? "የመጨረሻ" : "Last"}: {mood.emoji}{" "}
              {MOODS.find((m) => m.sentiment === mood.sentiment)?.[
                lang === "am" ? "labelAm" : "labelEn"
              ]}
            </p>
          )}
        </div>
        <span className="text-calm-400">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="mt-4 flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m.sentiment}
              type="button"
              onClick={() => logMood(m.sentiment, m.emoji)}
              className={`flex flex-col items-center rounded-xl border px-4 py-3 text-sm transition ${
                mood?.sentiment === m.sentiment
                  ? "border-vitality-400 bg-vitality-50"
                  : "border-calm-100 bg-calm-50/50 hover:border-vitality-200"
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="mt-1 text-xs text-calm-600">
                {lang === "am" ? m.labelAm : m.labelEn}
              </span>
            </button>
          ))}
        </div>
      )}

      {moodInsight && (
        <p className="mt-3 rounded-lg bg-vitality-50/80 px-3 py-2 text-sm text-vitality-800">
          {moodInsight}
        </p>
      )}
    </section>
  );
}
