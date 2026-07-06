"use client";

import { useRef, useEffect } from "react";
import { useTranslation } from "@/i18n";

// ── Step data ──────────────────────────────────────────────────────
interface StepData {
  num: string;
  label: string;
  title: string;
  titleEm: string;
  body: string;
  tag: string;
}


// ── Utilities ──────────────────────────────────────────────────────
function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}
function smooth(t: number): number {
  return t * t * (3 - 2 * t); // smoothstep
}
function pad(n: number): string {
  return n < 10 ? "0" + n : "" + n;
}

// ── Component ──────────────────────────────────────────────────────
export function ScrollFeatures() {
  const { t } = useTranslation("marketing");

  const STEPS: StepData[] = [
    {
      num: t("scrollFeatures.steps.s0num"),
      label: t("scrollFeatures.steps.s0label"),
      title: t("scrollFeatures.steps.s0title"),
      titleEm: t("scrollFeatures.steps.s0titleEm"),
      body: t("scrollFeatures.steps.s0body"),
      tag: t("scrollFeatures.steps.s0tag"),
    },
    {
      num: t("scrollFeatures.steps.s1num"),
      label: t("scrollFeatures.steps.s1label"),
      title: t("scrollFeatures.steps.s1title"),
      titleEm: t("scrollFeatures.steps.s1titleEm"),
      body: t("scrollFeatures.steps.s1body"),
      tag: t("scrollFeatures.steps.s1tag"),
    },
    {
      num: t("scrollFeatures.steps.s2num"),
      label: t("scrollFeatures.steps.s2label"),
      title: t("scrollFeatures.steps.s2title"),
      titleEm: t("scrollFeatures.steps.s2titleEm"),
      body: t("scrollFeatures.steps.s2body"),
      tag: t("scrollFeatures.steps.s2tag"),
    },
  ];

  const sectionRef = useRef<HTMLElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const scrollbarFillRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLElement>(null);

  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const layerRefs = useRef<(SVGSVGElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Collect layer-specific elements by ID from the DOM subtree
    const $ = (id: string) => section.querySelector<SVGElement | HTMLElement>(`#${id}`);

    const prefersReduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let rafId: number;

    function render() {
      rafId = requestAnimationFrame(render);

      const rect = section!.getBoundingClientRect();
      const total = section!.offsetHeight - window.innerHeight;
      const scrolled = clamp(-rect.top, 0, total);
      const p = total > 0 ? scrolled / total : 0;

      const N = 3;
      const STEP = 1 / N;
      const stepIdx = clamp(Math.floor(p * N), 0, N - 1);

      // ── Progress UI ──
      if (progressFillRef.current) {
        progressFillRef.current.style.height = p * 100 + "%";
      }
      if (scrollbarFillRef.current) {
        scrollbarFillRef.current.style.width = p * 100 + "%";
      }
      if (counterRef.current) {
        counterRef.current.textContent = pad(stepIdx + 1);
      }

      // Dots — target inner <span> for visual styling
      dotRefs.current.forEach((d, i) => {
        if (!d) return;
        const dot = d.querySelector("span") as HTMLElement | null;
        if (!dot) return;
        if (i === stepIdx) {
          dot.style.background = "var(--mk-accent)";
          dot.style.transform = "scale(1.5)";
          dot.style.boxShadow = "0 0 8px rgba(184,151,58,.5)";
        } else {
          dot.style.background = "rgba(255,255,255,.1)";
          dot.style.transform = "scale(1)";
          dot.style.boxShadow = "none";
        }
      });

      // ── Cards ──
      const CARD_FADE = 0.18;
      stepRefs.current.forEach((s, i) => {
        if (!s) return;
        const zoneStart = i / N;
        const zoneEnd = (i + 1) / N;
        const fadeIn = zoneStart + CARD_FADE * STEP;
        const fadeOut = zoneEnd - CARD_FADE * STEP;

        let op: number, ty: number;
        if (p < zoneStart) {
          op = 0; ty = 55;
        } else if (p < fadeIn) {
          const t = smooth((p - zoneStart) / (CARD_FADE * STEP));
          op = t; ty = (1 - t) * 55;
        } else if (p < fadeOut) {
          op = 1; ty = 0;
        } else if (p < zoneEnd) {
          const t = smooth((p - fadeOut) / (CARD_FADE * STEP));
          op = 1 - t; ty = t * -45;
        } else {
          op = 0; ty = -45;
        }
        s.style.opacity = String(op);
        s.style.transform = `translateY(${ty}px)`;
      });

      // ── Layers (opacity envelope) ──
      const LAYER_FADE = 0.14;
      layerRefs.current.forEach((l, i) => {
        if (!l) return;
        const zoneStart = i / N;
        const zoneEnd = (i + 1) / N;
        const fadeIn = zoneStart + LAYER_FADE * STEP;
        const fadeOut = zoneEnd - LAYER_FADE * STEP;

        let op: number;
        if (p < zoneStart) op = 0;
        else if (p < fadeIn) op = smooth((p - zoneStart) / (LAYER_FADE * STEP));
        else if (p < fadeOut) op = 1;
        else if (p < zoneEnd) op = 1 - smooth((p - fadeOut) / (LAYER_FADE * STEP));
        else op = 0;
        l.style.opacity = String(op);
      });

      // Skip heavy per-element animations if user prefers reduced motion
      if (prefersReduced) return;

      // ── Layer 0: GRID — units pop in staggered ──
      {
        const lp = clamp(p / STEP, 0, 1);
        const units = section!.querySelectorAll<SVGElement>("[data-unit]");
        units.forEach((u, i) => {
          const threshold = i / units.length;
          const unitP = smooth(clamp((lp - threshold * 0.6) * 3.5, 0, 1));
          u.style.opacity = String(unitP);
          u.style.transform = `scale(${unitP > 0 ? 0.7 + 0.3 * unitP : 0})`;
        });
        const label = $("sfGridLabel");
        const legend = $("sfGridLegend");
        if (label) (label as SVGElement).style.opacity = String(smooth(clamp(lp * 2 - 1.2, 0, 1)));
        if (legend) (legend as SVGElement).style.opacity = String(smooth(clamp(lp * 2 - 1.5, 0, 1)));
      }

      // ── Layer 1: DISPONIBILIDAD — dots pop in staggered ──
      {
        const lp = clamp((p - STEP) / STEP, 0, 1);
        const dots = section!.querySelectorAll<SVGElement>("[data-dot]");
        dots.forEach((d, i) => {
          const t = smooth(clamp((lp - i * 0.03) * 4, 0, 1));
          d.style.opacity = String(t);
          d.style.transform = `scale(${t > 0 ? 0.5 + 0.5 * t : 0})`;
        });
        const card = $("sfAvailCard");
        if (card) {
          const cp = smooth(clamp(lp * 2 - 0.8, 0, 1));
          (card as SVGElement).style.opacity = String(cp);
          (card as SVGElement).style.transform = `translateX(${(1 - cp) * 20}px)`;
        }
        const lbl = $("sfAvailLabel");
        if (lbl) (lbl as SVGElement).style.opacity = String(smooth(clamp(lp * 2 - 1.3, 0, 1)));
      }

      // ── Layer 2: LEADS — cards fly up from below ──
      {
        const lp = clamp((p - 2 * STEP) / STEP, 0, 1);
        const leads: [string, number][] = [["sfLead1", 0], ["sfLead2", 0.25], ["sfLead3", 0.5]];
        const lines: [string, number][] = [["sfLeadLine1", 100], ["sfLeadLine2", 100]];
        leads.forEach(([id, offset]) => {
          const el = $(id);
          if (!el) return;
          const t = smooth(clamp((lp - offset) * 2.2, 0, 1));
          (el as SVGElement).style.opacity = String(t);
          (el as SVGElement).style.transform = `translateY(${(1 - t) * 44}px)`;
        });
        lines.forEach(([id, len]) => {
          const el = $(id);
          if (!el) return;
          const t = smooth(clamp(lp * 2.5 - 0.4, 0, 1));
          el.setAttribute("stroke-dashoffset", String(len * (1 - t)));
        });
        const lbl = $("sfLeadLabel");
        if (lbl) (lbl as SVGElement).style.opacity = String(smooth(clamp(lp * 2 - 1.4, 0, 1)));
      }
    }

    // Kick off loop
    rafId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(rafId);
  }, []);

  // Dot click handler — scroll to step
  function handleDotClick(i: number) {
    const section = sectionRef.current;
    if (!section) return;
    const top = window.scrollY + section.getBoundingClientRect().top;
    const total = section.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (i / 3) * total + 10, behavior: "smooth" });
  }

  return (
    <section
      ref={sectionRef}
      className="relative z-[1] h-[250vh] lg:h-[420vh]"
      style={{
        borderTop: "1px solid rgba(255,255,255,.04)",
      }}
    >
      <div
        className="grid grid-cols-1 lg:grid-cols-[55%_45%]"
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* ── LEFT: Building + Layers (desktop only — mobile gets inline SVGs per card) ── */}
        <div
          className="hidden lg:flex"
          style={{
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            background: "#0f0f0f",
            borderRight: "1px solid rgba(255,255,255,.05)",
          }}
        >
          {/* Gold glow backdrop */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse 70% 60% at 50% 55%, rgba(184,151,58,.05) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Dashboard wrapper */}
          <div
            style={{
              position: "relative",
              width: "min(480px, 85%)",
              aspectRatio: "480/560",
              filter: "drop-shadow(0 60px 80px rgba(0,0,0,.8))",
            }}
          >
            {/* Base dashboard frame SVG */}
            <svg
              viewBox="0 0 480 560"
              fill="none"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            >
              <defs>
                <clipPath id="sfBrowserClip">
                  <rect x="8" y="8" width="464" height="544" rx="12" />
                </clipPath>
              </defs>
              {/* Browser outer frame */}
              <rect x="8" y="8" width="464" height="544" rx="12" fill="#0c0c0c" stroke="rgba(255,255,255,.08)" strokeWidth="1" />
              {/* Browser chrome bar */}
              <rect x="8" y="8" width="464" height="32" rx="12" fill="#161616" />
              <rect x="8" y="28" width="464" height="12" fill="#161616" />
              {/* Traffic light dots */}
              <circle cx="26" cy="24" r="4.5" fill="rgba(255,95,87,.5)" />
              <circle cx="40" cy="24" r="4.5" fill="rgba(255,189,46,.5)" />
              <circle cx="54" cy="24" r="4.5" fill="rgba(39,201,63,.5)" />
              {/* URL bar */}
              <rect x="110" y="16" width="200" height="16" rx="4" fill="rgba(255,255,255,.04)" />
              <text x="210" y="27" textAnchor="middle" fontFamily="DM Mono,monospace" fontSize="7.5" fill="rgba(244,240,232,.25)">dashboard.noddo.io</text>

              {/* Left sidebar */}
              <rect x="8" y="40" width="82" height="512" fill="#111" />
              {/* Sidebar bottom round corners (cover) */}
              <rect x="8" y="540" width="10" height="12" rx="0" fill="#111" />
              <path d="M8,544 L8,552 Q8,552 8,552 L20,552 L20,544 Z" fill="#0c0c0c" />
              {/* NODDO logo placeholder — 2 gold lines */}
              <rect x="22" y="52" width="24" height="2.5" rx="1" fill="rgba(184,151,58,.7)" />
              <rect x="22" y="58" width="16" height="2.5" rx="1" fill="rgba(184,151,58,.4)" />
              {/* Nav items */}
              {/* Active item */}
              <rect x="14" y="78" width="70" height="24" rx="5" fill="rgba(184,151,58,.1)" />
              <rect x="14" y="78" width="2.5" height="24" rx="1" fill="#b8973a" />
              <rect x="24" y="85" width="10" height="10" rx="2" fill="rgba(184,151,58,.3)" />
              <text x="40" y="94" fontFamily="Syne,sans-serif" fontSize="7" fill="rgba(184,151,58,.9)" fontWeight="700" letterSpacing="0.5">Grid</text>
              {/* Inactive items */}
              {([112, 142, 172, 202, 232] as const).map((y, i) => (
                <g key={`nav-${i}`}>
                  <rect x="24" y={y + 7} width="10" height="10" rx="2" fill="rgba(255,255,255,.06)" />
                  <rect x="40" y={y + 10} width={[28, 22, 32, 26, 20][i]} height="4" rx="1.5" fill="rgba(255,255,255,.08)" />
                </g>
              ))}

              {/* Sidebar / content separator */}
              <line x1="90" y1="40" x2="90" y2="552" stroke="rgba(255,255,255,.06)" strokeWidth="1" />

              {/* Content area header */}
              <text x="106" y="66" fontFamily="Syne,sans-serif" fontSize="11" fill="rgba(244,240,232,.85)" fontWeight="700" letterSpacing="1.2">TORRE RESIDENCIAL</text>
              {/* Tab bar */}
              <text x="106" y="84" fontFamily="Syne,sans-serif" fontSize="7.5" fill="rgba(184,151,58,.85)" fontWeight="700" letterSpacing="1">GENERAL</text>
              <line x1="106" y1="87" x2="140" y2="87" stroke="#b8973a" strokeWidth="1.5" />
              <text x="152" y="84" fontFamily="Syne,sans-serif" fontSize="7.5" fill="rgba(244,240,232,.25)" fontWeight="600" letterSpacing="1">GRID</text>
              <text x="182" y="84" fontFamily="Syne,sans-serif" fontSize="7.5" fill="rgba(244,240,232,.25)" fontWeight="600" letterSpacing="1">INVENTARIO</text>
              <text x="230" y="84" fontFamily="Syne,sans-serif" fontSize="7.5" fill="rgba(244,240,232,.25)" fontWeight="600" letterSpacing="1">LEADS</text>
              {/* Tab bar divider */}
              <line x1="90" y1="92" x2="472" y2="92" stroke="rgba(255,255,255,.05)" strokeWidth="1" />

              {/* Faint horizontal grid lines in content area */}
              {[140, 190, 240, 290, 340, 390, 440, 490].map((y, i) => (
                <line key={`gl-${i}`} x1="90" y1={y} x2="472" y2={y} stroke="rgba(255,255,255,.025)" strokeWidth=".5" />
              ))}
            </svg>

            {/* ── Layer 0: NODDO GRID (Fachada) ── */}
            <svg
              ref={(el) => { layerRefs.current[0] = el; }}
              viewBox="0 0 480 560"
              fill="none"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, pointerEvents: "none", willChange: "opacity,transform" }}
            >
              {/* Simplified 2D building elevation on left side of content */}
              <rect x="106" y="110" width="140" height="380" rx="2" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth=".8" />
              {/* Floor dividers */}
              {[148, 186, 224, 262, 300, 338, 376, 414, 452].map((y, i) => (
                <line key={`fd-${i}`} x1="106" y1={y} x2="246" y2={y} stroke="rgba(255,255,255,.05)" strokeWidth=".5" />
              ))}
              {/* Column dividers */}
              <line x1="141" y1="110" x2="141" y2="490" stroke="rgba(255,255,255,.04)" strokeWidth=".5" />
              <line x1="176" y1="110" x2="176" y2="490" stroke="rgba(255,255,255,.04)" strokeWidth=".5" />
              <line x1="211" y1="110" x2="211" y2="490" stroke="rgba(255,255,255,.04)" strokeWidth=".5" />

              {/* Unit cells — colored rects with data-unit */}
              {([
                { x: 107, y: 453, w: 33, h: 36, fill: "rgba(74,158,107,.65)", stroke: "rgba(74,158,107,.8)" },
                { x: 142, y: 453, w: 33, h: 36, fill: "rgba(184,151,58,.7)", stroke: "rgba(184,151,58,.85)" },
                { x: 177, y: 453, w: 33, h: 36, fill: "rgba(100,100,100,.5)", stroke: "rgba(130,130,130,.6)" },
                { x: 212, y: 453, w: 33, h: 36, fill: "rgba(74,158,107,.6)", stroke: "rgba(74,158,107,.75)" },
                { x: 107, y: 415, w: 33, h: 36, fill: "rgba(196,133,58,.6)", stroke: "rgba(196,133,58,.75)" },
                { x: 142, y: 415, w: 33, h: 36, fill: "rgba(74,158,107,.65)", stroke: "rgba(74,158,107,.8)" },
                { x: 177, y: 415, w: 33, h: 36, fill: "rgba(74,158,107,.55)", stroke: "rgba(74,158,107,.7)" },
                { x: 212, y: 415, w: 33, h: 36, fill: "rgba(100,100,100,.5)", stroke: "rgba(130,130,130,.6)" },
                { x: 107, y: 377, w: 33, h: 36, fill: "rgba(184,151,58,.65)", stroke: "rgba(184,151,58,.8)" },
                { x: 142, y: 377, w: 33, h: 36, fill: "rgba(100,100,100,.5)", stroke: "rgba(130,130,130,.6)" },
                { x: 177, y: 377, w: 33, h: 36, fill: "rgba(74,158,107,.7)", stroke: "rgba(74,158,107,.85)" },
                { x: 212, y: 377, w: 33, h: 36, fill: "rgba(196,133,58,.6)", stroke: "rgba(196,133,58,.75)" },
                { x: 107, y: 339, w: 33, h: 36, fill: "rgba(74,158,107,.6)", stroke: "rgba(74,158,107,.75)" },
                { x: 142, y: 339, w: 33, h: 36, fill: "rgba(184,151,58,.7)", stroke: "rgba(184,151,58,.85)" },
              ] as const).map((u, i) => (
                <rect
                  key={i}
                  data-unit={i}
                  x={u.x}
                  y={u.y}
                  width={u.w}
                  height={u.h}
                  rx="2"
                  fill={u.fill}
                  stroke={u.stroke}
                  strokeWidth=".8"
                  opacity="0"
                  style={{ transformOrigin: `${u.x + u.w / 2}px ${u.y + u.h / 2}px` }}
                />
              ))}

              {/* Unit detail card (right side of content area) */}
              <g id="sfGridLabel" opacity="0">
                <rect x="268" y="130" width="185" height="120" rx="6" fill="#0e0e0e" stroke="rgba(184,151,58,.2)" strokeWidth=".8" />
                <text x="282" y="150" fontFamily="Syne,sans-serif" fontSize="7.5" fill="rgba(184,151,58,.9)" letterSpacing="2" fontWeight="700">UNIDAD 6B</text>
                <line x1="282" y1="158" x2="438" y2="158" stroke="rgba(255,255,255,.06)" strokeWidth=".5" />
                <text x="282" y="174" fontFamily="DM Mono,monospace" fontSize="8" fill="rgba(244,240,232,.35)">Piso</text>
                <text x="380" y="174" fontFamily="DM Mono,monospace" fontSize="8" fill="rgba(244,240,232,.65)" textAnchor="end">6</text>
                <text x="282" y="190" fontFamily="DM Mono,monospace" fontSize="8" fill="rgba(244,240,232,.35)">Tipo</text>
                <text x="380" y="190" fontFamily="DM Mono,monospace" fontSize="8" fill="rgba(244,240,232,.65)" textAnchor="end">B - 72m2</text>
                <text x="282" y="206" fontFamily="DM Mono,monospace" fontSize="8" fill="rgba(244,240,232,.35)">Precio</text>
                <text x="380" y="206" fontFamily="DM Mono,monospace" fontSize="8" fill="rgba(244,240,232,.65)" textAnchor="end">$385.000.000</text>
                <text x="282" y="222" fontFamily="DM Mono,monospace" fontSize="8" fill="rgba(244,240,232,.35)">Estado</text>
                <rect x="348" y="215" width="48" height="12" rx="3" fill="rgba(74,158,107,.12)" />
                <text x="372" y="224" textAnchor="middle" fontFamily="DM Mono,monospace" fontSize="7" fill="rgba(74,158,107,.85)">Disponible</text>
                <text x="282" y="242" fontFamily="DM Mono,monospace" fontSize="8" fill="rgba(244,240,232,.35)">Vista</text>
                <text x="380" y="242" fontFamily="DM Mono,monospace" fontSize="8" fill="rgba(244,240,232,.65)" textAnchor="end">Interior</text>
              </g>

              {/* Color legend */}
              <g id="sfGridLegend" opacity="0">
                <rect x="268" y="270" width="185" height="50" rx="6" fill="#0e0e0e" stroke="rgba(255,255,255,.06)" strokeWidth=".5" />
                <circle cx="284" cy="288" r="4" fill="rgba(74,158,107,.8)" />
                <text x="294" y="291" fontFamily="DM Mono,monospace" fontSize="7.5" fill="rgba(244,240,232,.35)">Disponible</text>
                <circle cx="356" cy="288" r="4" fill="rgba(196,133,58,.8)" />
                <text x="366" y="291" fontFamily="DM Mono,monospace" fontSize="7.5" fill="rgba(244,240,232,.35)">Reservado</text>
                <circle cx="284" cy="306" r="4" fill="rgba(100,100,100,.8)" />
                <text x="294" y="309" fontFamily="DM Mono,monospace" fontSize="7.5" fill="rgba(244,240,232,.35)">Vendido</text>
                <circle cx="356" cy="306" r="4" fill="rgba(184,151,58,.8)" />
                <text x="366" y="309" fontFamily="DM Mono,monospace" fontSize="7.5" fill="rgba(244,240,232,.35)">Separado</text>
              </g>
            </svg>

            {/* ── Layer 1: DISPONIBILIDAD ── */}
            <svg
              ref={(el) => { layerRefs.current[1] = el; }}
              viewBox="0 0 480 560"
              fill="none"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, pointerEvents: "none", willChange: "opacity,transform" }}
            >
              {/* 3 KPI stat cards at top */}
              {/* Disponibles */}
              <rect x="100" y="104" width="118" height="52" rx="6" fill="#0e0e0e" stroke="rgba(74,158,107,.25)" strokeWidth=".8" />
              <text x="114" y="122" fontFamily="Syne,sans-serif" fontSize="6.5" fill="rgba(244,240,232,.3)" letterSpacing="1.5" fontWeight="700">DISPONIBLES</text>
              <text x="114" y="146" fontFamily="Cormorant Garamond,serif" fontSize="24" fontWeight="300" fill="#4a9e6b">24</text>
              <circle cx="200" cy="140" r="3" fill="rgba(74,158,107,.6)" />
              {/* Reservados */}
              <rect x="226" y="104" width="118" height="52" rx="6" fill="#0e0e0e" stroke="rgba(196,133,58,.25)" strokeWidth=".8" />
              <text x="240" y="122" fontFamily="Syne,sans-serif" fontSize="6.5" fill="rgba(244,240,232,.3)" letterSpacing="1.5" fontWeight="700">RESERVADOS</text>
              <text x="240" y="146" fontFamily="Cormorant Garamond,serif" fontSize="24" fontWeight="300" fill="#c4853a">8</text>
              <circle cx="326" cy="140" r="3" fill="rgba(196,133,58,.6)" />
              {/* Vendidos */}
              <rect x="352" y="104" width="118" height="52" rx="6" fill="#0e0e0e" stroke="rgba(100,100,100,.25)" strokeWidth=".8" />
              <text x="366" y="122" fontFamily="Syne,sans-serif" fontSize="6.5" fill="rgba(244,240,232,.3)" letterSpacing="1.5" fontWeight="700">VENDIDOS</text>
              <text x="366" y="146" fontFamily="Cormorant Garamond,serif" fontSize="24" fontWeight="300" fill="#888">8</text>
              <circle cx="452" cy="140" r="3" fill="rgba(100,100,100,.6)" />

              {/* Dot grid — 10x2 (20 dots) */}
              {([
                [120, 186, "#4a9e6b"], [148, 186, "#4a9e6b"], [176, 186, "#c4853a"], [204, 186, "#4a9e6b"], [232, 186, "#888"],
                [260, 186, "#4a9e6b"], [288, 186, "#4a9e6b"], [316, 186, "#c4853a"], [344, 186, "#888"], [372, 186, "#4a9e6b"],
                [120, 214, "#4a9e6b"], [148, 214, "#888"], [176, 214, "#4a9e6b"], [204, 214, "#c4853a"], [232, 214, "#4a9e6b"],
                [260, 214, "#4a9e6b"], [288, 214, "#888"], [316, 214, "#4a9e6b"], [344, 214, "#c4853a"], [372, 214, "#4a9e6b"],
              ] as const).map(([cx, cy, color], i) => (
                <circle
                  key={i}
                  data-dot={i}
                  cx={cx}
                  cy={cy}
                  r="8"
                  fill={color}
                  opacity="0"
                  style={{ transformOrigin: `${cx}px ${cy}px` }}
                />
              ))}

              {/* Availability progress card */}
              <g id="sfAvailCard" opacity="0">
                <rect x="108" y="250" width="352" height="60" rx="6" fill="#0e0e0e" stroke="rgba(74,158,107,.2)" strokeWidth=".8" />
                <text x="124" y="270" fontFamily="Syne,sans-serif" fontSize="7" fill="rgba(244,240,232,.3)" letterSpacing="2" fontWeight="700">OCUPACION DEL PROYECTO</text>
                <text x="124" y="294" fontFamily="Cormorant Garamond,serif" fontSize="22" fontWeight="300" fill="#4a9e6b">60%</text>
                {/* Progress bar background */}
                <rect x="180" y="282" width="260" height="8" rx="4" fill="rgba(255,255,255,.04)" />
                {/* Progress bar fill */}
                <rect x="180" y="282" width="156" height="8" rx="4" fill="rgba(74,158,107,.5)" />
                <rect x="180" y="282" width="96" height="8" rx="4" fill="rgba(184,151,58,.5)" />
                <rect x="180" y="282" width="48" height="8" rx="4" fill="rgba(100,100,100,.5)" />
              </g>

              {/* Availability label */}
              <g id="sfAvailLabel" opacity="0">
                <rect x="108" y="330" width="352" height="44" rx="6" fill="#0e0e0e" stroke="rgba(255,255,255,.05)" strokeWidth=".5" />
                <text x="124" y="348" fontFamily="DM Mono,monospace" fontSize="8" fill="rgba(244,240,232,.35)">Unidades totales:</text>
                <text x="236" y="348" fontFamily="DM Mono,monospace" fontSize="8" fill="rgba(244,240,232,.65)">40</text>
                <text x="270" y="348" fontFamily="DM Mono,monospace" fontSize="8" fill="rgba(244,240,232,.35)">Precio promedio:</text>
                <text x="400" y="348" fontFamily="DM Mono,monospace" fontSize="8" fill="rgba(244,240,232,.65)">$392M</text>
                <text x="124" y="364" fontFamily="DM Mono,monospace" fontSize="8" fill="rgba(244,240,232,.35)">Ventas este mes:</text>
                <text x="236" y="364" fontFamily="DM Mono,monospace" fontSize="8" fill="rgba(74,158,107,.75)">+3</text>
                <text x="270" y="364" fontFamily="DM Mono,monospace" fontSize="8" fill="rgba(244,240,232,.35)">Reservas activas:</text>
                <text x="400" y="364" fontFamily="DM Mono,monospace" fontSize="8" fill="rgba(196,133,58,.75)">5</text>
              </g>
            </svg>

            {/* ── Layer 2: LEADS ── */}
            <svg
              ref={(el) => { layerRefs.current[2] = el; }}
              viewBox="0 0 480 560"
              fill="none"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, pointerEvents: "none", willChange: "opacity,transform" }}
            >
              {/* Lead table header */}
              <rect x="100" y="104" width="368" height="28" rx="4" fill="rgba(255,255,255,.03)" />
              <text x="126" y="122" fontFamily="Syne,sans-serif" fontSize="7" fill="rgba(244,240,232,.3)" letterSpacing="1.2" fontWeight="700">NOMBRE</text>
              <text x="220" y="122" fontFamily="Syne,sans-serif" fontSize="7" fill="rgba(244,240,232,.3)" letterSpacing="1.2" fontWeight="700">CORREO</text>
              <text x="336" y="122" fontFamily="Syne,sans-serif" fontSize="7" fill="rgba(244,240,232,.3)" letterSpacing="1.2" fontWeight="700">UNIDAD</text>
              <text x="400" y="122" fontFamily="Syne,sans-serif" fontSize="7" fill="rgba(244,240,232,.3)" letterSpacing="1.2" fontWeight="700">FUENTE</text>

              {/* Lead row 1 */}
              <g id="sfLead1" opacity="0" style={{ transform: "translateY(44px)" }}>
                <rect x="100" y="140" width="368" height="52" rx="6" fill="#0e0e0e" stroke="rgba(184,151,58,.15)" strokeWidth=".8" />
                <circle cx="120" cy="166" r="14" fill="rgba(184,151,58,.1)" stroke="rgba(184,151,58,.25)" strokeWidth=".8" />
                <text x="120" y="170" textAnchor="middle" fontFamily="Cormorant Garamond,serif" fontSize="11" fill="#d4b05a">MG</text>
                <text x="142" y="160" fontFamily="Syne,sans-serif" fontSize="8.5" fontWeight="700" fill="rgba(244,240,232,.82)">Maria Garcia</text>
                <text x="142" y="174" fontFamily="DM Mono,monospace" fontSize="7" fill="rgba(244,240,232,.28)">+57 310 456 7890</text>
                <text x="220" y="164" fontFamily="DM Mono,monospace" fontSize="7.5" fill="rgba(244,240,232,.4)">maria.g@</text>
                <text x="220" y="176" fontFamily="DM Mono,monospace" fontSize="7.5" fill="rgba(244,240,232,.4)">gmail.com</text>
                <text x="336" y="168" fontFamily="DM Mono,monospace" fontSize="8" fill="rgba(244,240,232,.55)">6B</text>
                <rect x="394" y="158" width="56" height="16" rx="4" fill="rgba(74,158,107,.1)" stroke="rgba(74,158,107,.25)" strokeWidth=".5" />
                <text x="422" y="170" textAnchor="middle" fontFamily="DM Mono,monospace" fontSize="7" fill="rgba(74,200,120,.72)" letterSpacing=".8">Instagram</text>
              </g>

              {/* Lead row 2 */}
              <g id="sfLead2" opacity="0" style={{ transform: "translateY(44px)" }}>
                <rect x="100" y="200" width="368" height="52" rx="6" fill="#0e0e0e" stroke="rgba(184,151,58,.15)" strokeWidth=".8" />
                <circle cx="120" cy="226" r="14" fill="rgba(184,151,58,.1)" stroke="rgba(184,151,58,.25)" strokeWidth=".8" />
                <text x="120" y="230" textAnchor="middle" fontFamily="Cormorant Garamond,serif" fontSize="11" fill="#d4b05a">CR</text>
                <text x="142" y="220" fontFamily="Syne,sans-serif" fontSize="8.5" fontWeight="700" fill="rgba(244,240,232,.82)">Carlos Rojas</text>
                <text x="142" y="234" fontFamily="DM Mono,monospace" fontSize="7" fill="rgba(244,240,232,.28)">+57 315 678 1234</text>
                <text x="220" y="224" fontFamily="DM Mono,monospace" fontSize="7.5" fill="rgba(244,240,232,.4)">carlos.r@</text>
                <text x="220" y="236" fontFamily="DM Mono,monospace" fontSize="7.5" fill="rgba(244,240,232,.4)">outlook.com</text>
                <text x="336" y="228" fontFamily="DM Mono,monospace" fontSize="8" fill="rgba(244,240,232,.55)">9D</text>
                <rect x="394" y="218" width="56" height="16" rx="4" fill="rgba(74,158,107,.1)" stroke="rgba(74,158,107,.25)" strokeWidth=".5" />
                <text x="422" y="230" textAnchor="middle" fontFamily="DM Mono,monospace" fontSize="7" fill="rgba(74,200,120,.72)" letterSpacing=".8">Google</text>
              </g>

              {/* Lead row 3 */}
              <g id="sfLead3" opacity="0" style={{ transform: "translateY(44px)" }}>
                <rect x="100" y="260" width="368" height="52" rx="6" fill="#0e0e0e" stroke="rgba(184,151,58,.15)" strokeWidth=".8" />
                <circle cx="120" cy="286" r="14" fill="rgba(184,151,58,.1)" stroke="rgba(184,151,58,.25)" strokeWidth=".8" />
                <text x="120" y="290" textAnchor="middle" fontFamily="Cormorant Garamond,serif" fontSize="11" fill="#d4b05a">LV</text>
                <text x="142" y="280" fontFamily="Syne,sans-serif" fontSize="8.5" fontWeight="700" fill="rgba(244,240,232,.82)">Luisa Vargas</text>
                <text x="142" y="294" fontFamily="DM Mono,monospace" fontSize="7" fill="rgba(244,240,232,.28)">+57 300 123 4567</text>
                <text x="220" y="284" fontFamily="DM Mono,monospace" fontSize="7.5" fill="rgba(244,240,232,.4)">luisa.v@</text>
                <text x="220" y="296" fontFamily="DM Mono,monospace" fontSize="7.5" fill="rgba(244,240,232,.4)">yahoo.com</text>
                <text x="336" y="288" fontFamily="DM Mono,monospace" fontSize="8" fill="rgba(244,240,232,.55)">10C</text>
                <rect x="394" y="278" width="56" height="16" rx="4" fill="rgba(184,151,58,.1)" stroke="rgba(184,151,58,.25)" strokeWidth=".5" />
                <text x="422" y="290" textAnchor="middle" fontFamily="DM Mono,monospace" fontSize="7" fill="rgba(184,151,58,.72)" letterSpacing=".8">Referido</text>
              </g>

              {/* Invisible connecting lines — kept for JS compatibility */}
              <line id="sfLeadLine1" x1="120" y1="192" x2="120" y2="200" stroke="rgba(184,151,58,.2)" strokeWidth=".8" strokeDasharray="4 3" strokeDashoffset="100" />
              <line id="sfLeadLine2" x1="120" y1="252" x2="120" y2="260" stroke="rgba(184,151,58,.2)" strokeWidth=".8" strokeDasharray="4 3" strokeDashoffset="100" />

              {/* Lead label */}
              <g id="sfLeadLabel" opacity="0">
                <rect x="100" y="326" width="368" height="40" rx="6" fill="#0e0e0e" stroke="rgba(255,255,255,.05)" strokeWidth=".5" />
                <text x="116" y="342" fontFamily="DM Mono,monospace" fontSize="8" fill="rgba(244,240,232,.35)">Total leads esta semana:</text>
                <text x="276" y="342" fontFamily="Cormorant Garamond,serif" fontSize="14" fontWeight="300" fill="#d4b05a">12</text>
                <text x="300" y="342" fontFamily="DM Mono,monospace" fontSize="8" fill="rgba(74,158,107,.65)">+4 vs anterior</text>
                <text x="116" y="358" fontFamily="DM Mono,monospace" fontSize="7.5" fill="rgba(244,240,232,.25)">Tasa de conversion:</text>
                <text x="248" y="358" fontFamily="DM Mono,monospace" fontSize="7.5" fill="rgba(184,151,58,.7)">18.5%</text>
                <text x="300" y="358" fontFamily="DM Mono,monospace" fontSize="7.5" fill="rgba(244,240,232,.25)">Fuente top:</text>
                <text x="378" y="358" fontFamily="DM Mono,monospace" fontSize="7.5" fill="rgba(244,240,232,.55)">Instagram</text>
              </g>
            </svg>
          </div>
        </div>

        {/* ── RIGHT: Cards + Progress UI ── */}
        <div className="relative overflow-hidden">
          {/* Vertical progress bar */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 2,
              background: "rgba(255,255,255,.04)",
              zIndex: 2,
            }}
          >
            <div
              ref={progressFillRef}
              style={{
                width: "100%",
                background: "linear-gradient(to bottom,var(--mk-accent-light),var(--mk-accent))",
                height: "0%",
                willChange: "height",
              }}
            />
          </div>

          {/* Section header — persistent */}
          <div
            className="px-6 lg:px-14"
            style={{
              position: "absolute",
              top: 24,
              left: 0,
              right: 0,
              zIndex: 5,
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <span
                  className="font-ui"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: ".3em",
                    textTransform: "uppercase" as const,
                    color: "var(--mk-accent)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Funcionalidades
                </span>
                <h2
                  className="font-heading"
                  style={{
                    fontSize: "clamp(18px, 2.5vw, 22px)",
                    fontWeight: 300,
                    lineHeight: 1.15,
                    letterSpacing: "-.02em",
                    color: "var(--mk-text-primary)",
                  }}
                >
                  Todo en un solo{" "}
                  <em style={{ fontStyle: "italic", color: "var(--mk-accent-light)" }}>
                    micrositio.
                  </em>
                </h2>
              </div>

              {/* Counter */}
              <div
                className="font-heading font-light text-[11px] tracking-[0.1em] text-right flex-shrink-0 ml-6"
                style={{
                  color: "rgba(244,240,232,.2)",
                }}
              >
                <strong
                  ref={counterRef}
                  style={{
                    fontSize: 28,
                    lineHeight: 1,
                    fontWeight: 300,
                    color: "rgba(184,151,58,.35)",
                    display: "block",
                  }}
                >
                  01
                </strong>
                de 03
              </div>
            </div>
          </div>

          {/* Cards viewport */}
          <div
            className="absolute inset-0"
          >
            {STEPS.map((step, i) => (
              <div
                key={i}
                ref={(el) => { stepRefs.current[i] = el; }}
                className="absolute inset-0 flex items-center"
                style={{
                  opacity: i === 0 ? 1 : 0,
                  willChange: "opacity, transform",
                  pointerEvents: "none",
                }}
              >
              <div className="w-full px-6 lg:px-14 lg:pr-[72px]">
                {/* Step number + label */}
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: ".35em",
                    textTransform: "uppercase" as const,
                    color: "var(--mk-accent)",
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span style={{ width: 24, height: 1, background: "var(--mk-accent)", display: "inline-block" }} />
                  {step.num} — {step.label}
                </div>

                {/* Mobile mini-visual — inline SVG per step */}
                <div className="lg:hidden mb-6" style={{ padding: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 10 }}>
                  {i === 0 && (
                    <svg viewBox="0 0 160 48" fill="none" style={{ width: "100%", maxWidth: 280 }}>
                      <rect x="0" y="0" width="160" height="48" rx="4" fill="rgba(255,255,255,.02)" stroke="rgba(184,151,58,.15)" strokeWidth=".5" />
                      {[0,1,2,3].map(col => [0,1,2].map(row => {
                        const colors = ["#4a9e6b","#c4853a","#888","#4a9e6b","#4a9e6b","#c4853a","#4a9e6b","#888","#4a9e6b","#4a9e6b","#4a9e6b","#888"];
                        return <rect key={`${col}-${row}`} x={12 + col * 20} y={8 + row * 12} width={16} height={9} rx={1.5} fill={colors[col * 3 + row]} opacity={0.6} />;
                      }))}
                      <rect x="100" y="8" width="52" height="14" rx="2" fill="rgba(255,255,255,.03)" stroke="rgba(184,151,58,.12)" strokeWidth=".4" />
                      <text x="108" y="18" fontFamily="DM Mono,monospace" fontSize="6" fill="rgba(244,240,232,.4)">6B — 72m²</text>
                      <rect x="100" y="26" width="52" height="14" rx="2" fill="rgba(255,255,255,.03)" stroke="rgba(74,158,107,.15)" strokeWidth=".4" />
                      <text x="108" y="36" fontFamily="DM Mono,monospace" fontSize="6" fill="rgba(74,158,107,.7)">Disponible</text>
                    </svg>
                  )}
                  {i === 1 && (
                    <svg viewBox="0 0 160 48" fill="none" style={{ width: "100%", maxWidth: 280 }}>
                      <rect x="0" y="0" width="160" height="48" rx="4" fill="rgba(255,255,255,.02)" stroke="rgba(74,158,107,.15)" strokeWidth=".5" />
                      <text x="10" y="16" fontFamily="Syne,sans-serif" fontSize="5" fill="rgba(244,240,232,.3)" letterSpacing="1" fontWeight="700">DISPONIBLES</text>
                      <text x="10" y="36" fontFamily="Cormorant Garamond,serif" fontSize="18" fontWeight="300" fill="#4a9e6b">24</text>
                      <rect x="60" y="6" width="40" height="18" rx="3" fill="rgba(255,255,255,.02)" stroke="rgba(196,133,58,.15)" strokeWidth=".4" />
                      <text x="68" y="16" fontFamily="Syne,sans-serif" fontSize="4.5" fill="rgba(244,240,232,.3)" letterSpacing="1" fontWeight="700">RESERVADOS</text>
                      <text x="68" y="22" fontFamily="Cormorant Garamond,serif" fontSize="6" fontWeight="300" fill="#c4853a">8</text>
                      <rect x="108" y="6" width="44" height="18" rx="3" fill="rgba(255,255,255,.02)" stroke="rgba(100,100,100,.15)" strokeWidth=".4" />
                      <text x="116" y="16" fontFamily="Syne,sans-serif" fontSize="4.5" fill="rgba(244,240,232,.3)" letterSpacing="1" fontWeight="700">VENDIDOS</text>
                      <text x="116" y="22" fontFamily="Cormorant Garamond,serif" fontSize="6" fontWeight="300" fill="#888">8</text>
                      <rect x="60" y="28" width="92" height="6" rx="3" fill="rgba(255,255,255,.04)" />
                      <rect x="60" y="28" width="55" height="6" rx="3" fill="rgba(74,158,107,.4)" />
                      <rect x="60" y="28" width="34" height="6" rx="3" fill="rgba(184,151,58,.4)" />
                      <text x="60" y="42" fontFamily="DM Mono,monospace" fontSize="5" fill="rgba(244,240,232,.35)">60% ocupación</text>
                    </svg>
                  )}
                  {i === 2 && (
                    <svg viewBox="0 0 160 48" fill="none" style={{ width: "100%", maxWidth: 280 }}>
                      <rect x="0" y="0" width="160" height="48" rx="4" fill="rgba(255,255,255,.02)" stroke="rgba(184,151,58,.15)" strokeWidth=".5" />
                      <circle cx="16" cy="18" r="8" fill="rgba(184,151,58,.08)" stroke="rgba(184,151,58,.2)" strokeWidth=".5" />
                      <text x="16" y="21" textAnchor="middle" fontFamily="Cormorant Garamond,serif" fontSize="8" fill="#d4b05a">MG</text>
                      <text x="30" y="15" fontFamily="Syne,sans-serif" fontSize="6" fontWeight="700" fill="rgba(244,240,232,.8)">Maria Garcia</text>
                      <text x="30" y="22" fontFamily="DM Mono,monospace" fontSize="5" fill="rgba(244,240,232,.3)">+57 310 456 7890</text>
                      <rect x="110" y="10" width="38" height="12" rx="3" fill="rgba(74,158,107,.08)" stroke="rgba(74,158,107,.2)" strokeWidth=".4" />
                      <text x="129" y="19" textAnchor="middle" fontFamily="DM Mono,monospace" fontSize="5" fill="rgba(74,200,120,.7)">Instagram</text>
                      <line x1="8" y1="32" x2="152" y2="32" stroke="rgba(255,255,255,.04)" strokeWidth=".5" />
                      <text x="10" y="42" fontFamily="DM Mono,monospace" fontSize="5" fill="rgba(244,240,232,.3)">12 leads esta semana</text>
                      <text x="90" y="42" fontFamily="DM Mono,monospace" fontSize="5" fill="rgba(74,158,107,.6)">+4 vs anterior</text>
                    </svg>
                  )}
                </div>

                {/* Title — Cormorant Garamond */}
                <h2
                  className="font-heading"
                  style={{
                    fontSize: "clamp(28px,5.5vw,68px)",
                    fontWeight: 300,
                    lineHeight: 1.08,
                    letterSpacing: "-.02em",
                    color: "var(--mk-text-primary)",
                    marginBottom: 24,
                    whiteSpace: "pre-line",
                  }}
                >
                  {step.title}
                  <em style={{ fontStyle: "italic", color: "var(--mk-accent-light)" }}>{step.titleEm}</em>
                </h2>

                {/* Body */}
                <p
                  className="text-[13px] lg:text-[15px]"
                  style={{
                    lineHeight: 1.75,
                    color: "rgba(244,240,232,.55)",
                    maxWidth: 420,
                    marginBottom: 24,
                  }}
                >
                  {step.body}
                </p>

                {/* Tag */}
                <span
                  className="font-ui"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: ".18em",
                    textTransform: "uppercase" as const,
                    color: "var(--mk-accent)",
                    padding: "8px 18px",
                    border: "1px solid rgba(184,151,58,.25)",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "var(--mk-accent)",
                      animation: "sfTagPulse 2s ease-in-out infinite",
                    }}
                  />
                  {step.tag}
                </span>
              </div>
              </div>
            ))}
          </div>

          {/* Dots navigation */}
          <div
            style={{
              position: "absolute",
              right: 24,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              flexDirection: "column" as const,
              gap: 12,
              zIndex: 10,
            }}
          >
            {STEPS.map((step, i) => (
              <button
                key={i}
                ref={(el) => { dotRefs.current[i] = el as unknown as HTMLDivElement; }}
                onClick={() => handleDotClick(i)}
                aria-label={`Ir al paso ${i + 1}: ${step.label}`}
                style={{
                  width: 24,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    display: "block",
                    background: i === 0 ? "var(--mk-accent)" : "rgba(255,255,255,.1)",
                    willChange: "background, transform, box-shadow",
                  }}
                />
              </button>
            ))}
          </div>

          {/* Bottom scrollbar */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 2,
              background: "rgba(255,255,255,.04)",
            }}
          >
            <div
              ref={scrollbarFillRef}
              style={{
                height: "100%",
                background: "var(--mk-accent)",
                width: "0%",
                willChange: "width",
              }}
            />
          </div>
        </div>
      </div>

      {/* Keyframes for tag pulse */}
      <style>{`
        @keyframes sfTagPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </section>
  );
}
