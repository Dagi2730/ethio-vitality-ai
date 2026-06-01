import { Link } from "react-router-dom";
import { useWellnessStore } from "../../store/wellnessStore";

export function SanctuaryHero() {
  const lang = useWellnessStore((s) => s.lang);

  return (
    <Link to="/personal/coach" className="hero-sanctuary group block">
      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
      <div className="relative">
        <p className="text-sm font-medium text-white/90">
          {lang === "am" ? "የእርስዎ አጋር" : "Your wellness companion"}
        </p>
        <h2 className="mt-1 font-display text-2xl font-medium leading-snug">
          {lang === "am" ? (
            <>
              ውስጥ ሰላም ይጨሱ፣
              <br />
              <span className="text-white/90">Vitality አጋርዎ ነው</span>
            </>
          ) : (
            <>
              Breathe in calm,
              <br />
              <span className="rounded-xl bg-white/20 px-2 py-0.5 text-white/95">
                Vitality
              </span>{" "}
              is with you
            </>
          )}
        </h2>
        <p className="mt-3 text-sm text-white/85">
          {lang === "am"
            ? "CBT · ድምጽ · የኢትዮጵያ ባህላዊ ድጋፍ"
            : "CBT · voice · culturally grounded support"}
        </p>
        <span className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-2 text-sm font-medium text-teal shadow-sanctuary transition group-hover:scale-[1.02]">
          {lang === "am" ? "ውይይት ይጀምሩ" : "Begin your journey"}
          <span aria-hidden>→</span>
        </span>
      </div>
      <div
        className="absolute bottom-4 right-4 text-5xl opacity-40 animate-float"
        aria-hidden
      >
        🌸
      </div>
    </Link>
  );
}
