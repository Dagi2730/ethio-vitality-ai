/** Abstract calming wave — immersive chat centerpiece */
type Props = { active?: boolean; className?: string };

export function CalmWaveVisual({ active, className = "" }: Props) {
  return (
    <div
      className={`pointer-events-none flex items-center justify-center ${className}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 320 140"
        className={`h-28 w-full max-w-xs transition-opacity duration-500 ${
          active ? "opacity-90" : "opacity-70"
        }`}
      >
        <defs>
          <linearGradient id="waveA" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7EC8E3" />
            <stop offset="50%" stopColor="#B8A9E8" />
            <stop offset="100%" stopColor="#F5C6A5" />
          </linearGradient>
          <linearGradient id="waveB" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1D9E75" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#5A8FAF" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <path
          d="M0 80 Q40 40 80 70 T160 65 T240 75 T320 55 L320 140 L0 140 Z"
          fill="url(#waveA)"
          opacity="0.85"
          className={active ? "animate-[float_6s_ease-in-out_infinite]" : ""}
        />
        <path
          d="M0 95 Q60 55 120 85 T240 80 T320 70 L320 140 L0 140 Z"
          fill="url(#waveB)"
          opacity="0.5"
        />
        <path
          d="M20 72 Q100 30 180 68 T300 58"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeOpacity="0.35"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
