import { Link } from "react-router-dom";
import { useWellnessStore } from "../../store/wellnessStore";

const features = [
  {
    to: "/personal/coach",
    icon: "🌿",
    en: "Vitality",
    am: "Vitality",
    descEn: "Talk & breathe",
    descAm: "ውይይት",
    gradient: "from-teal-light to-sanctuary-mint/60",
  },
  {
    to: "/personal/reflect",
    icon: "📔",
    en: "Journal",
    am: "መጽሐፍ",
    descEn: "Reflect",
    descAm: "መዝገብ",
    gradient: "from-sanctuary-lavender/50 to-sanctuary-rose/40",
  },
  {
    to: "/personal/insights",
    icon: "📊",
    en: "Insights",
    am: "ትንተና",
    descEn: "Your patterns",
    descAm: "ስርዓት",
    gradient: "from-sanctuary-sky/50 to-teal-light/50",
  },
  {
    to: "/personal/actions",
    icon: "✨",
    en: "Actions",
    am: "ተግባር",
    descEn: "Small steps",
    descAm: "ደረጃ",
    gradient: "from-sanctuary-peach/50 to-amber-wash/80",
  },
];

export function FeatureGrid() {
  const lang = useWellnessStore((s) => s.lang);

  return (
    <div className="grid grid-cols-2 gap-3">
      {features.map((f) => (
        <Link
          key={f.to}
          to={f.to}
          className={`feature-tile bg-gradient-to-br ${f.gradient}`}
        >
          <span className="text-3xl" aria-hidden>
            {f.icon}
          </span>
          <span className="text-sm font-medium text-ink">
            {lang === "am" ? f.am : f.en}
          </span>
          <span className="text-xs text-ink-muted">
            {lang === "am" ? f.descAm : f.descEn}
          </span>
        </Link>
      ))}
    </div>
  );
}
