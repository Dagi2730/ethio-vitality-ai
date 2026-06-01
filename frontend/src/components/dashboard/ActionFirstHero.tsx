import { Link } from "react-router-dom";
import { useWellnessStore } from "../../store/wellnessStore";

type Props = {
  onLogMood: () => void;
  onCalmDown: () => void;
};

export function ActionFirstHero({ onLogMood, onCalmDown }: Props) {
  const lang = useWellnessStore((s) => s.lang);
  const latest = useWellnessStore((s) => s.latest);
  const stress = latest?.stress_level ?? 0;

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-vitality-100 bg-white p-1 shadow-sm">
        <p className="px-4 pt-3 text-center text-xs text-calm-500">
          {lang === "am" ? "አሁን ምን ይፈልጋሉ?" : "What do you need right now?"}
        </p>
        <div className="grid gap-2 p-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCalmDown}
            className="flex min-h-[88px] flex-col items-center justify-center rounded-xl bg-vitality-600 px-4 py-5 text-white shadow-md transition hover:bg-vitality-700 active:scale-[0.98]"
          >
            <span className="text-2xl" aria-hidden>
              🌬️
            </span>
            <span className="mt-2 text-base font-semibold">
              {lang === "am" ? "አጽናን" : "Calm Down"}
            </span>
            <span className="mt-0.5 text-xs text-teal-light">
              {lang === "am" ? "Vitality ጋር ይነጋገሩ" : "Talk with Vitality"}
            </span>
          </button>
          <button
            type="button"
            onClick={onLogMood}
            className="flex min-h-[88px] flex-col items-center justify-center rounded-xl border-2 border-vitality-200 bg-vitality-50 px-4 py-5 text-vitality-800 transition hover:border-vitality-300 hover:bg-vitality-100 active:scale-[0.98]"
          >
            <span className="text-2xl" aria-hidden>
              💭
            </span>
            <span className="mt-2 text-base font-semibold">
              {lang === "am" ? "ስሜት መዝግብ" : "Log Mood"}
            </span>
            <span className="mt-0.5 text-xs text-calm-500">1-tap check-in</span>
          </button>
        </div>
      </div>

      {stress >= 70 && (
        <Link
          to="/personal/coach"
          className="block rounded-xl border border-amber-alert/20 bg-amber-wash px-4 py-3 text-center text-sm text-ink"
        >
          {lang === "am"
            ? "ጭንቀት ከፍ ነው — Vitality እዚህ ነው"
            : "Stress is elevated — Vitality is here when you are ready"}
        </Link>
      )}
    </section>
  );
}
