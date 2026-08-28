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
  const Component = as;

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

  return (
    <Component
      ref={ref as any}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
      className={joinClasses(
        "patient-reveal",
        visible && "patient-reveal-visible",
        className,
      )}
    >
      {children}
    </Component>
  );
}

export function ScrollRevealProvider({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const selector = [
      "[data-scroll-reveal]",
      "main > section",
      "main > div > section",
      "main aside > div",
      "main article",
    ].join(",");

    const revealNodes = () => {
      root.querySelectorAll<HTMLElement>(selector).forEach((node, index) => {
        if (node.dataset.revealReady === "true") return;
        if (node.dataset.noReveal === "true") {
          node.dataset.revealReady = "true";
          node.classList.add("patient-reveal-visible");
          return;
        }
        node.dataset.revealReady = "true";
        node.style.setProperty("--reveal-delay", `${Math.min(index, 8) * 45}ms`);
        node.classList.add("patient-reveal");

        const rect = node.getBoundingClientRect();
        if (rect.top < window.innerHeight + 100 && rect.bottom > -50) {
          node.classList.add("patient-reveal-visible");
        } else {
          observer.observe(node);
        }
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("patient-reveal-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "80px 0px", threshold: 0.08 },
    );

    const mutationObserver = new MutationObserver(revealNodes);
    revealNodes();
    mutationObserver.observe(root, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={rootRef} className="patient-scroll-reveal-root">
      {children}
    </div>
  );
}
