"use client";

import { useEffect, useRef, useState } from "react";

interface CounterData {
  target: number;
  suffix: string;
  label: string;
}

const counters: CounterData[] = [
  { target: 2847, suffix: "+", label: "Leads capturados este mes" },
  { target: 34, suffix: "", label: "Proyectos activos" },
  { target: 98, suffix: "%", label: "Tasa de conversión lead → cotización" },
  { target: 1, suffix: " día", label: "Promedio de publicación" },
];

function AnimatedCounter({ target, suffix, label, delay }: CounterData & { delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(0);
  const [visible, setVisible] = useState(false);
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            if (!counted.current) {
              counted.current = true;
              const start = performance.now();
              const duration = 2000;
              const animate = (now: number) => {
                const p = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - p, 3);
                setValue(Math.floor(eased * target));
                if (p < 1) requestAnimationFrame(animate);
              };
              setTimeout(() => requestAnimationFrame(animate), delay);
            }
          }
        });
      },
      { threshold: 0.3 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [target, delay]);

  return (
    <div
      ref={ref}
      className="text-center transition-all duration-600 ease-out"
      style={{
        background: "#111",
        padding: "48px 36px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      <div
        className="font-heading leading-none mb-2"
        style={{ fontSize: 56, fontWeight: 300, color: "var(--mk-accent-light)" }}
      >
        {value.toLocaleString("es-CO")}
        <span style={{ fontSize: 28, color: "rgba(184,151,58,0.5)" }}>{suffix}</span>
      </div>
      <div
        className="font-ui text-[9px] tracking-[0.22em] uppercase"
        style={{ color: "rgba(244,240,232,0.3)" }}
      >
        {label}
      </div>
    </div>
  );
}

export function CountersSection() {
  return (
    <section
      className="relative z-[1] border-t border-[var(--mk-border-rule)]"
      style={{ padding: "100px 24px", background: "#111" }}
    >
      <div
        className="grid grid-cols-2 lg:grid-cols-4 max-w-[1200px] mx-auto"
        style={{ gap: "1px", background: "rgba(255,255,255,0.04)" }}
      >
        {counters.map((c, i) => (
          <AnimatedCounter key={c.label} {...c} delay={i * 100} />
        ))}
      </div>
    </section>
  );
}
