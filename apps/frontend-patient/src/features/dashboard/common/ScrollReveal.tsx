"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article" | "aside";
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const setRef = (node: HTMLElement | null) => {
    ref.current = node;
  };
  const revealProps = {
    ref: setRef,
    style: { "--reveal-delay": `${delay}ms` } as CSSProperties,
    className: joinClasses(
      "patient-reveal",
      visible && "patient-reveal-visible",
      className,
    ),
    children,
  };

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "80px 0px", threshold: 0.08 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (as === "section") return <section {...revealProps} />;
  if (as === "article") return <article {...revealProps} />;
  if (as === "aside") return <aside {...revealProps} />;
  return <div {...revealProps} />;
}

export function ScrollRevealProvider({ children }: { children: ReactNode }) {
  return <div className="patient-scroll-reveal-root">{children}</div>;
}
