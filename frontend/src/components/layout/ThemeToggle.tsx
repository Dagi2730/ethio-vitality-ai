import { useThemeStore } from "../../store/themeStore";
import { useWellnessStore } from "../../store/wellnessStore";

type Props = { compact?: boolean; immersive?: boolean };

export function ThemeToggle({ compact, immersive }: Props) {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const lang = useWellnessStore((s) => s.lang);
  const isDark = theme === "dark";

  const label = isDark
    ? lang === "am"
      ? "ብርሃን"
      : "Light"
    : lang === "am"
      ? "ጨለማ"
      : "Dark";

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`rounded-lg px-2 py-1 text-sm transition ${
          immersive ? "text-white/70 hover:text-white" : "text-ink-muted hover:text-ink"
        }`}
        aria-label={label}
        title={label}
      >
        {isDark ? "☀️" : "🌙"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex items-center gap-1.5 rounded-lg border border-warm-border bg-warm-surface px-3 py-1.5 text-sm font-medium text-ink-muted transition hover:text-ink dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
      aria-label={label}
    >
      <span>{isDark ? "☀️" : "🌙"}</span>
      <span>{label}</span>
    </button>
  );
}
