"use client";

import { useEffect, useRef, useState } from "react";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  // Always start true (render nothing) to match server HTML and avoid hydration mismatch
  const [isTouch, setIsTouch] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    setIsTouch(!mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsTouch(!e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (isTouch) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mx = 0;
    let my = 0;
    let rx = 0;
    let ry = 0;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.left = `${mx}px`;
      dot.style.top = `${my}px`;
    };

    const animateRing = () => {
      rx += (mx - rx) * 0.35;
      ry += (my - ry) * 0.35;
      ring.style.left = `${rx}px`;
      ring.style.top = `${ry}px`;
      rafId = requestAnimationFrame(animateRing);
    };

    // Hover expand on interactive elements
    const onEnter = () => {
      dot.style.width = "12px";
      dot.style.height = "12px";
      ring.style.width = "44px";
      ring.style.height = "44px";
    };

    const onLeave = () => {
      dot.style.width = "6px";
      dot.style.height = "6px";
      ring.style.width = "28px";
      ring.style.height = "28px";
    };

    document.addEventListener("mousemove", onMouseMove);
    rafId = requestAnimationFrame(animateRing);

    // Observe all clickable elements
    const interactives = document.querySelectorAll("a, button, [role='button']");
    interactives.forEach((el) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(rafId);
      interactives.forEach((el) => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
    };
  }, [isTouch]);

  if (isTouch) return null;

  return (
    <>
      <div
        ref={dotRef}
        className="fixed z-[9999] pointer-events-none"
        style={{
          width: 6,
          height: 6,
          background: "var(--mk-accent)",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          transition: "width 0.15s, height 0.15s",
          mixBlendMode: "screen",
        }}
      />
      <div
        ref={ringRef}
        className="fixed z-[9998] pointer-events-none"
        style={{
          width: 28,
          height: 28,
          border: "1px solid rgba(184, 151, 58, 0.3)",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          transition: "width 0.15s, height 0.15s",
        }}
      />
    </>
  );
}
