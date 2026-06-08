import { useEffect, useRef, useState } from "react";

export function useCountUp(target: number | undefined, duration = 900): number {
  const [value, setValue] = useState(0);
  const prevTarget = useRef<number | undefined>(undefined);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (target === undefined) return;
    if (target === prevTarget.current) return;
    prevTarget.current = target;

    const start = Date.now();
    const from = value;

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      }
    };

    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(tick);

    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [target, duration]);

  return value;
}
