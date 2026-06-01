import { FormEvent, useEffect, useRef, useState } from "react";
import { useSpeech } from "../../hooks/useSpeech";
import { useWellnessStore } from "../../store/wellnessStore";

type Props = {
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  initialText?: string;
  onSubmit: (text: string, source: "text" | "voice") => Promise<void>;
  loading: boolean;
};

export function JournalComposer({
  expanded,
  onExpand,
  onCollapse,
  initialText = "",
  onSubmit,
  loading,
}: Props) {
  const lang = useWellnessStore((s) => s.lang);
  const [text, setText] = useState(initialText);
  const [savedFlash, setSavedFlash] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { supported, listening, startListening, stopListening } = useSpeech(lang);

  useEffect(() => {
    if (initialText) {
      setText(initialText);
      textareaRef.current?.focus();
    }
  }, [initialText]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t || loading) return;
    await onSubmit(t, listening ? "voice" : "text");
    setText("");
    setSavedFlash(true);
    setTimeout(() => {
      setSavedFlash(false);
      onCollapse();
    }, 900);
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={onExpand}
        className="journal-composer-collapsed"
      >
        <span className="text-lg text-teal">+</span>
        <span className="text-sm text-ink-muted">
          {lang === "am" ? "አዲስ መጽሐፍ መዝግብ…" : "New journal entry…"}
        </span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="journal-composer-expanded animate-fade-in">
      {savedFlash ? (
        <p className="mb-3 text-center text-sm font-medium text-teal" aria-live="polite">
          ✓ {lang === "am" ? "ተቀምጧል" : "Saved — Vitality read the feeling"}
        </p>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-ink">
              {lang === "am" ? "መጽሐፍዎ" : "Your entry"}
            </span>
            <button
              type="button"
              onClick={onCollapse}
              className="text-xs text-ink-muted hover:text-ink"
            >
              {lang === "am" ? "ሰብር" : "Minimize"}
            </button>
          </div>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder={
              lang === "am"
                ? "ዛሬ ምን ተሰማዎት… አንድ ነገር በአንድ ጊዜ"
                : "What happened today… write freely"
            }
            className="w-full resize-none rounded-2xl border-0 bg-warm-bg/80 p-4 text-sm leading-relaxed text-ink outline-none ring-1 ring-warm-border focus:ring-teal/30"
          />
          <div className="mt-3 flex gap-2">
            {supported && (
              <button
                type="button"
                onClick={() => {
                  if (listening) stopListening();
                  else
                    startListening((transcript) =>
                      setText((prev) => (prev ? `${prev} ` : "") + transcript)
                    );
                }}
                className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
                  listening
                    ? "bg-coral-wash text-ink ring-2 ring-coral-wash"
                    : "bg-teal-light text-teal hover:bg-teal/20"
                }`}
                aria-pressed={listening}
              >
                🎤
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="btn-primary flex-1 py-3 text-sm disabled:opacity-50"
            >
              {loading
                ? "…"
                : lang === "am"
                  ? "አስቀምጥ እና ትንተን"
                  : "Save & reflect"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
