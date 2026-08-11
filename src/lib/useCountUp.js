import { useEffect, useRef, useState } from "react";

export function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const startRef = useRef(null);

  useEffect(() => {
    const from = fromRef.current;
    startRef.current = null;
    let raf;

    function step(ts) {
      if (startRef.current === null) startRef.current = ts;
      const progress = Math.min(1, (ts - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = from + (target - from) * eased;
      setValue(next);
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      } else {
        fromRef.current = target;
      }
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return value;
}
