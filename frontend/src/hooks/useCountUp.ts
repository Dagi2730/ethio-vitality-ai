import { useEffect, useState } from "react";

export function useCountUp(target: number, durationMs = 800, enabled = true) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled || target <= 0) {
      setValue(target);
      return;
    }
    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setValue(Math.round(target * t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    setValue(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, enabled]);

  return value;
}
