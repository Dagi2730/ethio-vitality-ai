import { useWellnessStore } from "../../store/wellnessStore";

type Props = { compact?: boolean; immersive?: boolean };

export function LanguageToggle({ compact, immersive }: Props) {
  const { lang, setLang } = useWellnessStore();

  if (compact) {
    return (
      <div
        className={`flex text-sm font-medium ${
          immersive ? "text-white/70" : "text-ink-muted"
        }`}
      >
        <button
          type="button"
          onClick={() => setLang("en")}
          className={`px-2 py-1 transition ${
            lang === "en"
              ? immersive
                ? "text-white"
                : "text-teal"
              : immersive
                ? "hover:text-white"
                : "hover:text-ink"
          }`}
        >
          EN
        </button>
        <span className={immersive ? "text-white/30" : "text-warm-border"}>|</span>
        <button
          type="button"
          onClick={() => setLang("am")}
          className={`px-2 py-1 transition ${
            lang === "am"
              ? immersive
                ? "text-white"
                : "text-teal"
              : immersive
                ? "hover:text-white"
                : "hover:text-ink"
          }`}
        >
          አማ
        </button>
      </div>
    );
  }

  return (
    <div className="flex rounded-lg border border-warm-border bg-warm-surface p-0.5 text-sm">
      {(["en", "am"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          className={`rounded-md px-3 py-1.5 font-medium transition duration-300 ${
            lang === code ? "bg-teal-light text-teal" : "text-ink-muted hover:text-ink"
          }`}
        >
          {code === "en" ? "EN" : "አማ"}
        </button>
      ))}
    </div>
  );
}
