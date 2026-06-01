import type { JournalEntry } from "../../api/client";
import { useWellnessStore } from "../../store/wellnessStore";

const EMOTION_COLORS: Record<string, string> = {
  anxious: "bg-sanctuary-peach/60 text-ink",
  sad: "bg-sanctuary-lavender/50 text-ink",
  calm: "bg-teal-light text-teal",
  hopeful: "bg-teal-muted text-ink",
  stressed: "bg-amber-wash text-ink",
  overwhelmed: "bg-coral-wash text-ink",
};

function formatDate(iso: string, lang: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(lang === "am" ? "am-ET" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Props = {
  entries: JournalEntry[];
  onSelect?: (entry: JournalEntry) => void;
};

export function JournalFeed({ entries, onSelect }: Props) {
  const lang = useWellnessStore((s) => s.lang);

  if (entries.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-warm-border bg-white/50 px-6 py-10 text-center backdrop-blur-sm">
        <p className="text-3xl" aria-hidden>
          📔
        </p>
        <p className="mt-3 text-sm text-ink-muted">
          {lang === "am"
            ? "መጀመሪያዎን መዝገብ ከታች ይጻፉ"
            : "Your journal entries will appear here"}
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {entries.map((e) => {
        const chip =
          EMOTION_COLORS[e.extracted_emotion?.toLowerCase()] ??
          "bg-sanctuary-sky/40 text-ink";
        return (
          <li key={e.id}>
            <button
              type="button"
              onClick={() => onSelect?.(e)}
              className="journal-entry-card w-full text-left"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-ink line-clamp-1">
                  {e.summary_one_line || e.text_preview.slice(0, 48)}
                </h3>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${chip}`}>
                  {e.extracted_emotion}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-muted">{formatDate(e.timestamp, lang)}</p>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-muted">
                {e.text_preview}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
