import { useWellnessStore } from "../../store/wellnessStore";

type Props = { onAskPsychologist: (prompt: string) => void };

export function AnomalyBanner({ onAskPsychologist }: Props) {
  const prompt = useWellnessStore((s) => s.latestAnomalyPrompt);
  const lang = useWellnessStore((s) => s.lang);

  if (!prompt) return null;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
        <p className="text-sm text-rose-900">{prompt}</p>
      </div>
      <button
        type="button"
        onClick={() => onAskPsychologist(prompt)}
        className="shrink-0 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
      >
        {lang === "am" ? "አስተውሉኝ" : "Talk about it"}
      </button>
    </div>
  );
}
