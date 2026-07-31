"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CountUpProps = {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  start?: number;
};

function formatNumber(value: number, decimals: number) {
  if (decimals <= 0) {
    return Math.round(value).toLocaleString("en-US");
  }

  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function CountUp({
  value,
  duration = 1400,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
  start = 0,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [current, setCurrent] = useState(start);
  const [started, setStarted] = useState(false);

  const formatted = useMemo(() => {
    return `${prefix}${formatNumber(current, decimals)}${suffix}`;
  }, [current, decimals, prefix, suffix]);

  useEffect(() => {
    const node = ref.current;
    if (!node || started) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        setStarted(true);
        const begin = performance.now();
        const from = start;
        const to = value;

        const tick = (now: number) => {
          const progress = Math.min((now - begin) / duration, 1);
          const easeOut = 1 - Math.pow(1 - progress, 3);
          const next = from + (to - from) * easeOut;
          setCurrent(next);

          if (progress < 1) {
            requestAnimationFrame(tick);
          } else {
            setCurrent(to);
          }
        };

        requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.4, rootMargin: "40px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [duration, start, started, value]);

  return (
    <span ref={ref} className={className} aria-label={formatted}>
      {formatted}
    </span>
  );
}
