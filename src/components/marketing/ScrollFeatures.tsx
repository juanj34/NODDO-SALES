"use client";

import { useRef, useEffect } from "react";

// ── Step data ──────────────────────────────────────────────────────
interface StepData {
  num: string;
  label: string;
  title: string;
  titleEm: string;
  body: string;
  tag: string;
}

const STEPS: StepData[] = [
  {
    num: "01 / 06",
    label: "Planos interactivos",
    title: "Todo empieza\ncon el ",
    titleEm: "plano.",
    body: "Sube tus planos en PDF o imagen y Noddo los vincula directamente a cada unidad. El comprador ve el plano exacto del piso que le interesa — sin pedírselo al asesor.",
    tag: "Planos por tipología y piso",
  },
  {
    num: "02 / 06",
    label: "Noddo Grid",
    title: "La fachada\n",
    titleEm: "habla sola.",
    body: "El comprador hace clic directamente en el edificio. Ve qué unidad es, qué precio tiene, si está disponible y cómo se ve desde arriba. Sin llamadas, sin esperas.",
    tag: "Fachada 100% interactiva",
  },
  {
    num: "03 / 06",
    label: "Renders 360°",
    title: "Muestra el\nproyecto como ",
    titleEm: "es.",
    body: "Integra renders, tours virtuales y vistas de áreas comunes en la sala. El comprador recorre el proyecto antes de pisar una oficina.",
    tag: "Renders, tours y galerías",
  },
  {
    num: "04 / 06",
    label: "Disponibilidad",
    title: "Inventario en\n",
    titleEm: "tiempo real.",
    body: "Cada unidad tiene estado propio — disponible, reservada o vendida. Cuando tu equipo cierra una venta, el Grid se actualiza al instante.",
    tag: "Se actualiza tú mismo",
  },
  {
    num: "05 / 06",
    label: "Captura de leads",
    title: "El lead llega\n",
    titleEm: "cualificado.",
    body: "Cada lead incluye nombre, correo, WhatsApp, la unidad exacta que exploró y la fuente de tráfico. Tu equipo sabe exactamente a quién llamar y sobre qué.",
    tag: "Lead con piso y tipología",
  },
  {
    num: "06 / 06",
    label: "Avance de obra",
    title: "La confianza\nse ",
    titleEm: "construye.",
    body: "Actualiza el avance de obra en el edificio. El comprador ve el progreso real del proyecto en cada visita. Transparencia que convierte dudas en contratos.",
    tag: "Actualización mensual",
  },
];

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
  const sectionRef = useRef<HTMLElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const scrollbarFillRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLElement>(null);

  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const layerRefs = useRef<(SVGSVGElement | null)[]>([]);

  // Orbit angle state (time-based, not scroll)
  const orbState = useRef({ angle1: 0, angle2: 180, lastTs: 0 });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Collect layer-specific elements by ID from the DOM subtree
    const $ = (id: string) => section.querySelector<SVGElement | HTMLElement>(`#${id}`);

    let rafId: number;

    function render(ts: number) {
      rafId = requestAnimationFrame(render);

      const rect = section!.getBoundingClientRect();
      const total = section!.offsetHeight - window.innerHeight;
      const scrolled = clamp(-rect.top, 0, total);
      const p = total > 0 ? scrolled / total : 0;

      const N = 6;
      const STEP = 1 / N;
      const stepIdx = clamp(Math.floor(p * N), 0, N - 1);
      const stepLocal = p * N - stepIdx;
      const sLocal = smooth(clamp(stepLocal, 0, 1));

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

      // Dots
      dotRefs.current.forEach((d, i) => {
        if (!d) return;
        if (i === stepIdx) {
          d.style.background = "var(--mk-accent)";
          d.style.transform = "scale(1.5)";
          d.style.boxShadow = "0 0 8px rgba(184,151,58,.5)";
        } else {
          d.style.background = "rgba(255,255,255,.1)";
          d.style.transform = "scale(1)";
          d.style.boxShadow = "none";
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

      // ── Layer 0: PLANOS — sheets fly in ──
      {
        const lp = clamp(p / STEP, 0, 1);
        const s0 = smooth(clamp(lp * 2, 0, 1));
        const s1 = smooth(clamp(lp * 2 - 1, 0, 1));

        const p1 = $("sfPlan1");
        const p2 = $("sfPlan2");
        if (p1) {
          (p1 as SVGElement).style.opacity = String(s0);
          (p1 as SVGElement).style.transform = `translate(${(1 - s0) * -52}px,${(1 - s0) * -36}px) rotate(${(1 - s0) * -7}deg)`;
          (p1 as SVGElement).style.transformOrigin = "48px 200px";
        }
        if (p2) {
          (p2 as SVGElement).style.opacity = String(s1);
          (p2 as SVGElement).style.transform = `translate(${(1 - s1) * -52}px,${(1 - s1) * -36}px) rotate(${(1 - s1) * -7}deg)`;
          (p2 as SVGElement).style.transformOrigin = "70px 270px";
        }
        const lineS = smooth(clamp(lp * 2 - 0.8, 0, 1));
        const ll1 = $("sfPlanLine1");
        const ll2 = $("sfPlanLine2");
        if (ll1) ll1.setAttribute("stroke-dashoffset", String(60 * (1 - lineS)));
        if (ll2) ll2.setAttribute("stroke-dashoffset", String(60 * (1 - lineS)));
        const dotS = smooth(clamp(lp * 2 - 1.2, 0, 1));
        const d1 = $("sfPlanDot1");
        const d2 = $("sfPlanDot2");
        if (d1) (d1 as SVGElement).style.transform = `scale(${dotS})`;
        if (d2) (d2 as SVGElement).style.transform = `scale(${dotS * 0.85})`;
        const pl = $("sfPlanLabel");
        if (pl) (pl as SVGElement).style.opacity = String(smooth(clamp(lp * 2 - 1.4, 0, 1)));
      }

      // ── Layer 1: GRID — units pop in staggered ──
      {
        const lp = clamp((p - STEP) / STEP, 0, 1);
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

      // ── Layer 2: RENDERS — orbit (time-based) + badge (scroll) ──
      {
        const lp = clamp((p - 2 * STEP) / STEP, 0, 1);
        const dt = ts - orbState.current.lastTs;
        orbState.current.lastTs = ts;
        const speed = 0.04;
        orbState.current.angle1 = (orbState.current.angle1 + dt * speed) % 360;
        orbState.current.angle2 = (orbState.current.angle2 + dt * speed) % 360;

        const o1 = $("sfOrb1");
        const o2 = $("sfOrb2");
        if (o1) (o1 as SVGElement).style.transform = `rotate(${orbState.current.angle1}deg)`;
        if (o2) (o2 as SVGElement).style.transform = `rotate(${orbState.current.angle2}deg)`;

        const glow = $("sfRenderGlow");
        if (glow) (glow as SVGElement).style.opacity = String(0.35 + 0.45 * Math.sin(ts / 2000));

        const badge = $("sfRenderBadge");
        const lbl = $("sfRenderLabel");
        if (badge) (badge as SVGElement).style.opacity = String(smooth(clamp(lp * 2, 0, 1)));
        if (lbl) (lbl as SVGElement).style.opacity = String(smooth(clamp(lp * 2 - 1.2, 0, 1)));
      }

      // ── Layer 3: DISPONIBILIDAD — dots pop in staggered ──
      {
        const lp = clamp((p - 3 * STEP) / STEP, 0, 1);
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

      // ── Layer 4: LEADS — cards fly up from below ──
      {
        const lp = clamp((p - 4 * STEP) / STEP, 0, 1);
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

      // ── Layer 5: AVANCE DE OBRA — fill rises ──
      {
        const lp = clamp((p - 5 * STEP) / STEP, 0, 1);
        const fillT = smooth(clamp(lp * 1.5, 0, 1));
        const lineT = smooth(clamp(lp * 2 - 0.3, 0, 1));
        const badgeT = smooth(clamp(lp * 2 - 0.9, 0, 1));
        const timeT = smooth(clamp(lp * 2 - 1.2, 0, 1));
        const lblT = smooth(clamp(lp * 2 - 1.5, 0, 1));

        const pL = $("sfProgL");
        const pR = $("sfProgR");
        if (pL) (pL as SVGElement).style.transform = `scaleY(${fillT})`;
        if (pR) (pR as SVGElement).style.transform = `scaleY(${fillT * 0.95})`;

        const wL = $("sfWaterL");
        const wR = $("sfWaterR");
        if (wL) wL.setAttribute("stroke-dashoffset", String(240 * (1 - lineT)));
        if (wR) wR.setAttribute("stroke-dashoffset", String(240 * (1 - lineT * 0.9)));

        const progBadge = $("sfProgBadge");
        if (progBadge) (progBadge as SVGElement).style.opacity = String(badgeT);
        const progTimeline = $("sfProgTimeline");
        if (progTimeline) (progTimeline as SVGElement).style.opacity = String(timeT);
        const progLabel = $("sfProgLabel");
        if (progLabel) (progLabel as SVGElement).style.opacity = String(lblT);
      }
    }

    // Kick off loop
    rafId = requestAnimationFrame((ts) => {
      orbState.current.lastTs = ts;
      render(ts);
    });

    return () => cancelAnimationFrame(rafId);
  }, []);

  // Dot click handler — scroll to step
  function handleDotClick(i: number) {
    const section = sectionRef.current;
    if (!section) return;
    const top = window.scrollY + section.getBoundingClientRect().top;
    const total = section.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (i / 6) * total + 10, behavior: "smooth" });
  }

  return (
    <section
      ref={sectionRef}
      style={{
        position: "relative",
        zIndex: 1,
        height: "700vh",
        borderTop: "1px solid rgba(255,255,255,.04)",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "grid",
          gridTemplateColumns: "55% 45%",
          overflow: "hidden",
        }}
      >
        {/* ── LEFT: Building + Layers ── */}
        <div
          style={{
            display: "flex",
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
              background: "radial-gradient(ellipse 70% 60% at 50% 55%, rgba(184,151,58,.06) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Building wrapper */}
          <div
            style={{
              position: "relative",
              width: "min(480px, 85%)",
              aspectRatio: "480/560",
              filter: "drop-shadow(0 60px 80px rgba(0,0,0,.8))",
            }}
          >
            {/* Base building SVG */}
            <svg
              viewBox="0 0 480 560"
              fill="none"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            >
              <defs>
                <linearGradient id="sfFL" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#2a2a2a" />
                  <stop offset="100%" stopColor="#1e1e1e" />
                </linearGradient>
                <linearGradient id="sfFR" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0c0c0c" />
                  <stop offset="100%" stopColor="#181818" />
                </linearGradient>
                <linearGradient id="sfEd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d4b05a" stopOpacity=".9" />
                  <stop offset="100%" stopColor="#b8973a" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Shadow */}
              <ellipse cx="240" cy="528" rx="155" ry="16" fill="rgba(0,0,0,.55)" />
              {/* Left face */}
              <polygon points="20,508 20,108 240,52 240,452" fill="url(#sfFL)" />
              {/* Right face */}
              <polygon points="240,452 240,52 460,108 460,508" fill="url(#sfFR)" />
              {/* Floor lines L */}
              {[148, 188, 228, 268, 308, 348, 388, 428, 468].map((y, i) => (
                <line key={`fl-${i}`} x1="20" y1={y} x2="240" y2={y - 56} stroke="rgba(184,151,58,.07)" strokeWidth=".8" />
              ))}
              {/* Floor lines R */}
              {[92, 132, 172, 212, 252, 292, 332, 372, 412].map((y, i) => (
                <line key={`fr-${i}`} x1="240" y1={y} x2="460" y2={y + 56} stroke="rgba(110,140,180,.05)" strokeWidth=".8" />
              ))}
              {/* Windows L — representative selection */}
              {[
                [44, 466, 80, 457, 80, 476, 44, 485, ".14"],
                [96, 453, 132, 444, 132, 463, 96, 472, ".14"],
                [148, 440, 184, 431, 184, 450, 148, 459, ".2"],
                [200, 427, 236, 418, 236, 437, 200, 446, ".14"],
                [44, 426, 80, 417, 80, 436, 44, 445, ".2"],
                [96, 413, 132, 404, 132, 423, 96, 432, ".14"],
                [148, 400, 184, 391, 184, 410, 148, 419, ".14"],
                [200, 387, 236, 378, 236, 397, 200, 406, ".2"],
                [44, 386, 80, 377, 80, 396, 44, 405, ".14"],
                [96, 373, 132, 364, 132, 383, 96, 392, ".2"],
                [148, 360, 184, 351, 184, 370, 148, 379, ".14"],
                [200, 347, 236, 338, 236, 357, 200, 366, ".14"],
                [44, 346, 80, 337, 80, 356, 44, 365, ".14"],
                [96, 333, 132, 324, 132, 343, 96, 352, ".14"],
                [148, 320, 184, 311, 184, 330, 148, 339, ".2"],
                [200, 307, 236, 298, 236, 317, 200, 326, ".14"],
                [44, 306, 80, 297, 80, 316, 44, 325, ".2"],
                [96, 293, 132, 284, 132, 303, 96, 312, ".14"],
                [148, 280, 184, 271, 184, 290, 148, 299, ".14"],
                [200, 267, 236, 258, 236, 277, 200, 286, ".2"],
                [44, 266, 80, 257, 80, 276, 44, 285, ".14"],
                [96, 253, 132, 244, 132, 263, 96, 272, ".2"],
                [148, 240, 184, 231, 184, 250, 148, 259, ".14"],
                [200, 227, 236, 218, 236, 237, 200, 246, ".14"],
                [44, 226, 80, 217, 80, 236, 44, 245, ".14"],
                [148, 200, 184, 191, 184, 210, 148, 219, ".2"],
                [200, 187, 236, 178, 236, 197, 200, 206, ".14"],
                [44, 186, 80, 177, 80, 196, 44, 205, ".2"],
                [96, 173, 132, 164, 132, 183, 96, 192, ".14"],
                [148, 160, 184, 151, 184, 170, 148, 179, ".14"],
                [200, 147, 236, 138, 236, 157, 200, 166, ".2"],
                [44, 110, 92, 99, 92, 122, 44, 133, ".28"],
                [100, 97, 148, 86, 148, 109, 100, 120, ".22"],
                [156, 84, 204, 73, 204, 96, 156, 107, ".28"],
              ].map(([x1, y1, x2, y2, x3, y3, x4, y4, op], i) => (
                <polygon
                  key={`wl-${i}`}
                  points={`${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`}
                  fill={`rgba(184,151,58,${op})`}
                />
              ))}
              {/* Windows R — representative selection */}
              {[
                [260, 444, 296, 453, 296, 472, 260, 463, ".12"],
                [308, 457, 344, 466, 344, 485, 308, 476, ".16"],
                [356, 470, 392, 479, 392, 498, 356, 489, ".12"],
                [260, 404, 296, 413, 296, 432, 260, 423, ".16"],
                [308, 417, 344, 426, 344, 445, 308, 436, ".12"],
                [260, 364, 296, 373, 296, 392, 260, 383, ".12"],
                [308, 377, 344, 386, 344, 405, 308, 396, ".12"],
                [356, 390, 392, 399, 392, 418, 356, 409, ".16"],
                [260, 324, 296, 333, 296, 352, 260, 343, ".16"],
                [308, 337, 344, 346, 344, 365, 308, 356, ".12"],
                [260, 284, 296, 293, 296, 312, 260, 303, ".12"],
                [308, 297, 344, 306, 344, 325, 308, 316, ".16"],
                [260, 244, 296, 253, 296, 272, 260, 263, ".12"],
                [308, 257, 344, 266, 344, 285, 308, 276, ".12"],
                [260, 204, 296, 213, 296, 232, 260, 223, ".16"],
                [308, 217, 344, 226, 344, 245, 308, 236, ".12"],
                [260, 112, 308, 124, 308, 147, 260, 135, ".2"],
                [316, 128, 364, 140, 364, 163, 316, 151, ".16"],
              ].map(([x1, y1, x2, y2, x3, y3, x4, y4, op], i) => (
                <polygon
                  key={`wr-${i}`}
                  points={`${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`}
                  fill={`rgba(110,160,210,${op})`}
                />
              ))}
              {/* Roof */}
              <polygon points="20,108 240,52 460,108 240,102" fill="#1e1e1e" stroke="rgba(184,151,58,.12)" strokeWidth=".6" />
              {/* Edges */}
              <line x1="20" y1="108" x2="20" y2="508" stroke="url(#sfEd)" strokeWidth="1" />
              <line x1="240" y1="52" x2="240" y2="452" stroke="url(#sfEd)" strokeWidth="2.5" />
              <line x1="460" y1="108" x2="460" y2="508" stroke="rgba(184,151,58,.14)" strokeWidth=".8" />
              <line x1="20" y1="108" x2="240" y2="52" stroke="rgba(184,151,58,.6)" strokeWidth="1.4" />
              <line x1="460" y1="108" x2="240" y2="52" stroke="rgba(184,151,58,.35)" strokeWidth="1" />
            </svg>

            {/* ── Layer 0: PLANOS ── */}
            <svg
              ref={(el) => { layerRefs.current[0] = el; }}
              viewBox="0 0 480 560"
              fill="none"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, pointerEvents: "none", willChange: "opacity,transform" }}
            >
              <defs>
                <linearGradient id="bpG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3a6fa0" stopOpacity=".92" />
                  <stop offset="100%" stopColor="#1e4870" stopOpacity=".78" />
                </linearGradient>
              </defs>
              {/* Sheet 1 */}
              <g id="sfPlan1">
                <polygon points="48,200 200,160 200,224 48,264" fill="url(#bpG)" opacity=".88" />
                <line x1="58" y1="212" x2="190" y2="176" stroke="rgba(160,210,255,.4)" strokeWidth=".7" />
                <line x1="58" y1="224" x2="190" y2="188" stroke="rgba(160,210,255,.4)" strokeWidth=".7" />
                <line x1="58" y1="236" x2="190" y2="200" stroke="rgba(160,210,255,.4)" strokeWidth=".7" />
                <line x1="58" y1="248" x2="190" y2="212" stroke="rgba(160,210,255,.35)" strokeWidth=".7" />
                <line x1="96" y1="167" x2="96" y2="257" stroke="rgba(160,210,255,.28)" strokeWidth=".7" />
                <line x1="132" y1="158" x2="132" y2="248" stroke="rgba(160,210,255,.28)" strokeWidth=".7" />
                <line x1="168" y1="149" x2="168" y2="239" stroke="rgba(160,210,255,.28)" strokeWidth=".7" />
                <polygon points="60,203 90,195 90,215 60,223" fill="rgba(160,210,255,.22)" />
                <polygon points="98,193 128,185 128,205 98,213" fill="rgba(160,210,255,.14)" />
                <polygon points="48,200 200,160 200,163 48,203" fill="rgba(160,210,255,.45)" />
              </g>
              {/* Sheet 2 */}
              <g id="sfPlan2">
                <polygon points="70,270 222,230 222,290 70,330" fill="url(#bpG)" opacity=".72" />
                <line x1="80" y1="281" x2="212" y2="245" stroke="rgba(160,210,255,.35)" strokeWidth=".7" />
                <line x1="80" y1="295" x2="212" y2="259" stroke="rgba(160,210,255,.35)" strokeWidth=".7" />
                <line x1="80" y1="309" x2="212" y2="273" stroke="rgba(160,210,255,.3)" strokeWidth=".7" />
                <line x1="118" y1="237" x2="118" y2="323" stroke="rgba(160,210,255,.22)" strokeWidth=".7" />
                <line x1="158" y1="227" x2="158" y2="313" stroke="rgba(160,210,255,.22)" strokeWidth=".7" />
                <polygon points="70,270 222,230 222,233 70,273" fill="rgba(160,210,255,.38)" />
              </g>
              {/* Connecting lines */}
              <line id="sfPlanLine1" x1="200" y1="192" x2="240" y2="212" stroke="rgba(74,127,181,.5)" strokeWidth="1" strokeDasharray="5 4" strokeDashoffset="60" />
              <line id="sfPlanLine2" x1="222" y1="260" x2="240" y2="292" stroke="rgba(74,127,181,.4)" strokeWidth="1" strokeDasharray="5 4" strokeDashoffset="60" />
              <circle id="sfPlanDot1" cx="240" cy="212" r="4" fill="#4a7fb5" style={{ transformOrigin: "240px 212px", transform: "scale(0)" }} />
              <circle id="sfPlanDot2" cx="240" cy="292" r="4" fill="#4a7fb5" opacity=".7" style={{ transformOrigin: "240px 292px", transform: "scale(0)" }} />
              <g id="sfPlanLabel" opacity="0">
                <rect x="28" y="60" width="108" height="22" fill="rgba(58,111,160,.15)" stroke="rgba(58,111,160,.5)" strokeWidth=".8" />
                <text x="82" y="75" textAnchor="middle" fontFamily="Syne,sans-serif" fontSize="8" fill="rgba(160,210,255,.9)" letterSpacing="2.5" fontWeight="700">PLANOS</text>
              </g>
            </svg>

            {/* ── Layer 1: NODDO GRID ── */}
            <svg
              ref={(el) => { layerRefs.current[1] = el; }}
              viewBox="0 0 480 560"
              fill="none"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, pointerEvents: "none", willChange: "opacity,transform" }}
            >
              {/* Unit polygons — JS drives individual opacity via data-unit */}
              {([
                { pts: "44,466 80,457 80,476 44,485", fill: "rgba(74,158,107,.75)", stroke: "rgba(74,158,107,.95)", sw: "1.2", ox: "62px", oy: "471px" },
                { pts: "96,453 132,444 132,463 96,472", fill: "rgba(184,151,58,.85)", stroke: "#d4b05a", sw: "1.5", ox: "114px", oy: "458px" },
                { pts: "148,440 184,431 184,450 148,459", fill: "rgba(100,100,100,.6)", stroke: "rgba(130,130,130,.7)", sw: "1", ox: "166px", oy: "445px" },
                { pts: "200,427 236,418 236,437 200,446", fill: "rgba(74,158,107,.65)", stroke: "rgba(74,158,107,.85)", sw: "1.1", ox: "218px", oy: "432px" },
                { pts: "44,426 80,417 80,436 44,445", fill: "rgba(196,133,58,.7)", stroke: "rgba(196,133,58,.88)", sw: "1.2", ox: "62px", oy: "431px" },
                { pts: "96,413 132,404 132,423 96,432", fill: "rgba(184,151,58,.8)", stroke: "#b8973a", sw: "1.3", ox: "114px", oy: "418px" },
                { pts: "44,306 80,297 80,316 44,325", fill: "rgba(74,158,107,.7)", stroke: "rgba(74,158,107,.9)", sw: "1.1", ox: "62px", oy: "311px" },
                { pts: "96,293 132,284 132,303 96,312", fill: "rgba(100,100,100,.55)", stroke: "rgba(130,130,130,.65)", sw: "1", ox: "114px", oy: "298px" },
                { pts: "148,280 184,271 184,290 148,299", fill: "rgba(74,158,107,.72)", stroke: "rgba(74,158,107,.92)", sw: "1.2", ox: "166px", oy: "285px" },
                { pts: "44,186 80,177 80,196 44,205", fill: "rgba(184,151,58,.75)", stroke: "#d4b05a", sw: "1.4", ox: "62px", oy: "191px" },
                { pts: "260,364 296,373 296,392 260,383", fill: "rgba(184,151,58,.75)", stroke: "#b8973a", sw: "1.3", ox: "278px", oy: "378px" },
                { pts: "308,377 344,386 344,405 308,396", fill: "rgba(74,158,107,.65)", stroke: "rgba(74,158,107,.85)", sw: "1.1", ox: "326px", oy: "391px" },
                { pts: "260,284 296,293 296,312 260,303", fill: "rgba(100,100,100,.55)", stroke: "rgba(130,130,130,.65)", sw: "1", ox: "278px", oy: "298px" },
                { pts: "260,204 296,213 296,232 260,223", fill: "rgba(184,151,58,.8)", stroke: "#d4b05a", sw: "1.4", ox: "278px", oy: "218px" },
              ] as const).map((u, i) => (
                <polygon
                  key={i}
                  data-unit={i}
                  points={u.pts}
                  fill={u.fill}
                  stroke={u.stroke}
                  strokeWidth={u.sw}
                  opacity="0"
                  style={{ transformOrigin: `${u.ox} ${u.oy}` }}
                />
              ))}
              <g id="sfGridLabel" opacity="0">
                <rect x="28" y="60" width="136" height="22" fill="rgba(184,151,58,.1)" stroke="rgba(184,151,58,.45)" strokeWidth=".8" />
                <text x="96" y="75" textAnchor="middle" fontFamily="Syne,sans-serif" fontSize="8" fill="rgba(212,176,90,.95)" letterSpacing="2.5" fontWeight="700">NODDO GRID</text>
              </g>
              <g id="sfGridLegend" opacity="0">
                <circle cx="36" cy="98" r="4" fill="rgba(74,158,107,.8)" />
                <text x="46" y="102" fontFamily="DM Mono,monospace" fontSize="9" fill="rgba(244,240,232,.35)">Disponible</text>
                <circle cx="36" cy="116" r="4" fill="rgba(196,133,58,.8)" />
                <text x="46" y="120" fontFamily="DM Mono,monospace" fontSize="9" fill="rgba(244,240,232,.35)">Reservado</text>
                <circle cx="36" cy="134" r="4" fill="rgba(100,100,100,.8)" />
                <text x="46" y="138" fontFamily="DM Mono,monospace" fontSize="9" fill="rgba(244,240,232,.35)">Vendido</text>
              </g>
            </svg>

            {/* ── Layer 2: RENDERS 360 ── */}
            <svg
              ref={(el) => { layerRefs.current[2] = el; }}
              viewBox="0 0 480 560"
              fill="none"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, pointerEvents: "none", willChange: "opacity,transform" }}
            >
              <defs>
                <radialGradient id="rGlw" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#d4b05a" stopOpacity=".2" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              </defs>
              <ellipse cx="240" cy="280" rx="185" ry="185" fill="url(#rGlw)" id="sfRenderGlow" />
              <ellipse cx="240" cy="280" rx="205" ry="70" stroke="rgba(184,151,58,.18)" strokeWidth="1.2" strokeDasharray="7 5" />
              {/* Orbiting thumbnail 1 */}
              <g id="sfOrb1" style={{ transformOrigin: "240px 280px" }}>
                <rect x="17" y="268" width="38" height="26" fill="#131313" stroke="rgba(184,151,58,.6)" strokeWidth="1" />
                <line x1="21" y1="275" x2="51" y2="275" stroke="rgba(184,151,58,.3)" strokeWidth=".7" />
                <line x1="21" y1="281" x2="50" y2="281" stroke="rgba(184,151,58,.22)" strokeWidth=".7" />
                <line x1="21" y1="287" x2="49" y2="287" stroke="rgba(184,151,58,.18)" strokeWidth=".7" />
              </g>
              {/* Orbiting thumbnail 2 */}
              <g id="sfOrb2" style={{ transformOrigin: "240px 280px" }}>
                <rect x="17" y="268" width="38" height="26" fill="#131313" stroke="rgba(184,151,58,.45)" strokeWidth="1" />
                <line x1="21" y1="275" x2="51" y2="275" stroke="rgba(184,151,58,.25)" strokeWidth=".7" />
                <line x1="21" y1="281" x2="50" y2="281" stroke="rgba(184,151,58,.18)" strokeWidth=".7" />
              </g>
              {/* 360 badge */}
              <g id="sfRenderBadge" opacity="0">
                <circle cx="240" cy="148" r="40" fill="rgba(184,151,58,.07)" stroke="rgba(184,151,58,.32)" strokeWidth="1.2" />
                <text x="240" y="144" textAnchor="middle" fontFamily="Syne,sans-serif" fontSize="17" fill="#d4b05a" fontWeight="800">360°</text>
                <text x="240" y="162" textAnchor="middle" fontFamily="DM Mono,monospace" fontSize="7.5" fill="rgba(244,240,232,.35)" letterSpacing="2.5">RENDER</text>
              </g>
              <g id="sfRenderLabel" opacity="0">
                <rect x="28" y="60" width="128" height="22" fill="rgba(184,151,58,.07)" stroke="rgba(184,151,58,.38)" strokeWidth=".8" />
                <text x="92" y="75" textAnchor="middle" fontFamily="Syne,sans-serif" fontSize="8" fill="rgba(212,176,90,.9)" letterSpacing="2.5" fontWeight="700">RENDERS 360°</text>
              </g>
            </svg>

            {/* ── Layer 3: DISPONIBILIDAD ── */}
            <svg
              ref={(el) => { layerRefs.current[3] = el; }}
              viewBox="0 0 480 560"
              fill="none"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, pointerEvents: "none", willChange: "opacity,transform" }}
            >
              {/* Availability dots */}
              {([
                [62, 103, "#4a9e6b"], [114, 90, "#c4853a"], [166, 77, "#4a9e6b"], [218, 64, "#666"],
                [62, 143, "#666"], [114, 130, "#4a9e6b"], [166, 117, "#c4853a"], [218, 104, "#4a9e6b"],
                [62, 183, "#4a9e6b"], [114, 170, "#4a9e6b"], [166, 157, "#666"], [218, 144, "#c4853a"],
                [62, 223, "#c4853a"], [114, 210, "#4a9e6b"], [166, 197, "#4a9e6b"], [218, 184, "#666"],
                [62, 263, "#4a9e6b"], [114, 250, "#666"], [166, 237, "#4a9e6b"], [218, 224, "#c4853a"],
              ] as const).map(([cx, cy, color], i) => (
                <circle
                  key={i}
                  data-dot={i}
                  cx={cx}
                  cy={cy}
                  r="5.5"
                  fill={color}
                  opacity="0"
                  style={{ transformOrigin: `${cx}px ${cy}px` }}
                />
              ))}
              {/* Availability card */}
              <g id="sfAvailCard" opacity="0" transform="translate(20,0)">
                <rect x="268" y="170" width="148" height="80" fill="#0c0c0c" stroke="rgba(74,158,107,.42)" strokeWidth=".8" />
                <text x="282" y="191" fontFamily="Syne,sans-serif" fontSize="7.5" fill="rgba(244,240,232,.28)" letterSpacing="2.2" fontWeight="700">DISPONIBILIDAD</text>
                <text x="282" y="218" fontFamily="Cormorant Garamond,serif" fontSize="26" fontWeight="300" fill="#4a9e6b">68%</text>
                <text x="282" y="234" fontFamily="DM Mono,monospace" fontSize="9" fill="rgba(244,240,232,.28)">unidades libres</text>
              </g>
              <g id="sfAvailLabel" opacity="0">
                <rect x="28" y="60" width="158" height="22" fill="rgba(74,158,107,.07)" stroke="rgba(74,158,107,.35)" strokeWidth=".8" />
                <text x="107" y="75" textAnchor="middle" fontFamily="Syne,sans-serif" fontSize="8" fill="rgba(100,210,140,.88)" letterSpacing="2.5" fontWeight="700">DISPONIBILIDAD</text>
              </g>
            </svg>

            {/* ── Layer 4: LEADS ── */}
            <svg
              ref={(el) => { layerRefs.current[4] = el; }}
              viewBox="0 0 480 560"
              fill="none"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, pointerEvents: "none", willChange: "opacity,transform" }}
            >
              {/* Lead card 1 */}
              <g id="sfLead1" opacity="0" style={{ transform: "translateY(44px)" }}>
                <rect x="16" y="340" width="158" height="58" fill="#0c0c0c" stroke="rgba(184,151,58,.3)" strokeWidth=".8" />
                <circle cx="34" cy="361" r="10" fill="rgba(184,151,58,.12)" stroke="rgba(184,151,58,.32)" strokeWidth=".8" />
                <text x="34" y="365" textAnchor="middle" fontFamily="Cormorant Garamond,serif" fontSize="11" fill="#d4b05a">MG</text>
                <text x="52" y="357" fontFamily="Syne,sans-serif" fontSize="9" fontWeight="700" fill="rgba(244,240,232,.82)">María García</text>
                <text x="52" y="370" fontFamily="DM Mono,monospace" fontSize="8" fill="rgba(244,240,232,.32)">Piso 6 · Tipo B</text>
                <rect x="52" y="376" width="56" height="12" fill="rgba(74,158,107,.1)" stroke="rgba(74,158,107,.32)" strokeWidth=".5" />
                <text x="80" y="386" textAnchor="middle" fontFamily="DM Mono,monospace" fontSize="7.5" fill="rgba(74,200,120,.72)" letterSpacing="1">Instagram</text>
              </g>
              {/* Lead card 2 */}
              <g id="sfLead2" opacity="0" style={{ transform: "translateY(44px)" }}>
                <rect x="310" y="380" width="158" height="58" fill="#0c0c0c" stroke="rgba(184,151,58,.3)" strokeWidth=".8" />
                <circle cx="328" cy="401" r="10" fill="rgba(184,151,58,.12)" stroke="rgba(184,151,58,.32)" strokeWidth=".8" />
                <text x="328" y="405" textAnchor="middle" fontFamily="Cormorant Garamond,serif" fontSize="11" fill="#d4b05a">CR</text>
                <text x="346" y="397" fontFamily="Syne,sans-serif" fontSize="9" fontWeight="700" fill="rgba(244,240,232,.82)">Carlos R.</text>
                <text x="346" y="410" fontFamily="DM Mono,monospace" fontSize="8" fill="rgba(244,240,232,.32)">Piso 9 · Tipo D</text>
                <rect x="346" y="416" width="48" height="12" fill="rgba(74,158,107,.1)" stroke="rgba(74,158,107,.32)" strokeWidth=".5" />
                <text x="370" y="426" textAnchor="middle" fontFamily="DM Mono,monospace" fontSize="7.5" fill="rgba(74,200,120,.72)" letterSpacing="1">Google</text>
              </g>
              {/* Lead card 3 */}
              <g id="sfLead3" opacity="0" style={{ transform: "translateY(44px)" }}>
                <rect x="155" y="430" width="158" height="58" fill="#0c0c0c" stroke="rgba(184,151,58,.3)" strokeWidth=".8" />
                <circle cx="173" cy="451" r="10" fill="rgba(184,151,58,.12)" stroke="rgba(184,151,58,.32)" strokeWidth=".8" />
                <text x="173" y="455" textAnchor="middle" fontFamily="Cormorant Garamond,serif" fontSize="11" fill="#d4b05a">LV</text>
                <text x="191" y="447" fontFamily="Syne,sans-serif" fontSize="9" fontWeight="700" fill="rgba(244,240,232,.82)">Luisa V.</text>
                <text x="191" y="460" fontFamily="DM Mono,monospace" fontSize="8" fill="rgba(244,240,232,.32)">Piso 10 · Tipo C</text>
                <rect x="191" y="466" width="52" height="12" fill="rgba(74,158,107,.1)" stroke="rgba(74,158,107,.32)" strokeWidth=".5" />
                <text x="217" y="476" textAnchor="middle" fontFamily="DM Mono,monospace" fontSize="7.5" fill="rgba(74,200,120,.72)" letterSpacing="1">Referido</text>
              </g>
              {/* Connecting dashed lines */}
              <line id="sfLeadLine1" x1="100" y1="340" x2="170" y2="272" stroke="rgba(184,151,58,.28)" strokeWidth=".9" strokeDasharray="4 3" strokeDashoffset="100" />
              <line id="sfLeadLine2" x1="389" y1="380" x2="310" y2="310" stroke="rgba(184,151,58,.22)" strokeWidth=".9" strokeDasharray="4 3" strokeDashoffset="100" />
              <g id="sfLeadLabel" opacity="0">
                <rect x="28" y="60" width="90" height="22" fill="rgba(184,151,58,.07)" stroke="rgba(184,151,58,.38)" strokeWidth=".8" />
                <text x="73" y="75" textAnchor="middle" fontFamily="Syne,sans-serif" fontSize="8" fill="rgba(212,176,90,.9)" letterSpacing="2.5" fontWeight="700">LEADS</text>
              </g>
            </svg>

            {/* ── Layer 5: AVANCE DE OBRA ── */}
            <svg
              ref={(el) => { layerRefs.current[5] = el; }}
              viewBox="0 0 480 560"
              fill="none"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, pointerEvents: "none", willChange: "opacity,transform" }}
            >
              <defs>
                <linearGradient id="sfPFG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#b8973a" stopOpacity=".45" />
                  <stop offset="100%" stopColor="#b8973a" stopOpacity=".06" />
                </linearGradient>
                <clipPath id="sfLFC">
                  <polygon points="20,508 20,108 240,52 240,452" />
                </clipPath>
                <clipPath id="sfRFC">
                  <polygon points="240,452 240,52 460,108 460,508" />
                </clipPath>
              </defs>
              {/* Fill rectangles — JS sets scaleY */}
              <rect id="sfProgL" x="20" y="52" width="220" height="456" fill="url(#sfPFG)" clipPath="url(#sfLFC)" style={{ transformOrigin: "20px 508px", transform: "scaleY(0)" }} />
              <rect id="sfProgR" x="240" y="52" width="220" height="456" fill="url(#sfPFG)" clipPath="url(#sfRFC)" style={{ transformOrigin: "240px 508px", transform: "scaleY(0)" }} />
              {/* Waterline */}
              <line id="sfWaterL" x1="20" y1="255" x2="240" y2="199" stroke="rgba(184,151,58,.65)" strokeWidth="1.8" strokeDasharray="240" strokeDashoffset="240" strokeLinecap="round" />
              <line id="sfWaterR" x1="240" y1="199" x2="460" y2="255" stroke="rgba(184,151,58,.4)" strokeWidth="1.4" strokeDasharray="240" strokeDashoffset="240" strokeLinecap="round" />
              {/* Progress badge */}
              <g id="sfProgBadge" opacity="0">
                <rect x="178" y="162" width="124" height="52" fill="#0c0c0c" stroke="rgba(184,151,58,.45)" strokeWidth=".8" />
                <text x="240" y="186" textAnchor="middle" fontFamily="Cormorant Garamond,serif" fontSize="28" fontWeight="300" fill="#d4b05a">65%</text>
                <text x="240" y="204" textAnchor="middle" fontFamily="DM Mono,monospace" fontSize="8" fill="rgba(244,240,232,.3)" letterSpacing="2">CONSTRUIDO</text>
              </g>
              {/* Timeline */}
              <g id="sfProgTimeline" opacity="0">
                <line x1="10" y1="508" x2="10" y2="255" stroke="rgba(184,151,58,.2)" strokeWidth=".8" />
                <circle cx="10" cy="508" r="3" fill="rgba(184,151,58,.45)" />
                <circle cx="10" cy="424" r="3" fill="rgba(184,151,58,.45)" />
                <circle cx="10" cy="340" r="3" fill="rgba(184,151,58,.45)" />
                <circle cx="10" cy="255" r="3" fill="rgba(184,151,58,.75)" />
                <text x="0" y="512" fontFamily="DM Mono,monospace" fontSize="6.5" fill="rgba(244,240,232,.2)" textAnchor="middle">Ene</text>
                <text x="0" y="428" fontFamily="DM Mono,monospace" fontSize="6.5" fill="rgba(244,240,232,.2)" textAnchor="middle">Abr</text>
                <text x="0" y="344" fontFamily="DM Mono,monospace" fontSize="6.5" fill="rgba(244,240,232,.2)" textAnchor="middle">Jul</text>
                <text x="0" y="259" fontFamily="DM Mono,monospace" fontSize="6.5" fill="rgba(244,240,232,.55)" textAnchor="middle">Oct</text>
              </g>
              <g id="sfProgLabel" opacity="0">
                <rect x="28" y="60" width="138" height="22" fill="rgba(184,151,58,.07)" stroke="rgba(184,151,58,.38)" strokeWidth=".8" />
                <text x="97" y="75" textAnchor="middle" fontFamily="Syne,sans-serif" fontSize="8" fill="rgba(212,176,90,.9)" letterSpacing="2.5" fontWeight="700">AVANCE OBRA</text>
              </g>
            </svg>
          </div>
        </div>

        {/* ── RIGHT: Cards + Progress UI ── */}
        <div style={{ position: "relative", overflow: "hidden" }}>
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

          {/* Counter */}
          <div
            style={{
              position: "absolute",
              top: 40,
              right: 48,
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: 11,
              fontWeight: 300,
              letterSpacing: ".1em",
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
            de 06
          </div>

          {/* Cards viewport */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              padding: "60px 72px 60px 56px",
            }}
          >
            {STEPS.map((step, i) => (
              <div
                key={i}
                ref={(el) => { stepRefs.current[i] = el; }}
                style={{
                  position: "absolute",
                  width: "calc(100% - 128px)",
                  left: 56,
                  opacity: i === 0 ? 1 : 0,
                  willChange: "opacity, transform",
                  pointerEvents: "none",
                }}
              >
                {/* Step number + label */}
                <div
                  style={{
                    fontSize: 9,
                    letterSpacing: ".35em",
                    textTransform: "uppercase" as const,
                    color: "var(--mk-accent)",
                    marginBottom: 24,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span style={{ width: 24, height: 1, background: "var(--mk-accent)", display: "inline-block" }} />
                  {step.num} — {step.label}
                </div>

                {/* Title — Cormorant Garamond */}
                <h2
                  className="font-heading"
                  style={{
                    fontSize: "clamp(36px,3.8vw,56px)",
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
                  style={{
                    fontSize: 13,
                    lineHeight: 1.9,
                    color: "rgba(244,240,232,.42)",
                    maxWidth: 380,
                    marginBottom: 32,
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
                    fontSize: 9,
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
            {STEPS.map((_, i) => (
              <div
                key={i}
                ref={(el) => { dotRefs.current[i] = el; }}
                onClick={() => handleDotClick(i)}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: i === 0 ? "var(--mk-accent)" : "rgba(255,255,255,.1)",
                  willChange: "background, transform, box-shadow",
                  cursor: "pointer",
                }}
              />
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
