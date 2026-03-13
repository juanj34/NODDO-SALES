"use client";

import { useEffect, useState } from "react";
import { useBooking } from "./BookingProvider";

export function StickyCTA() {
  const { openBooking } = useBooking();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 600);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="fixed z-[200] flex items-center gap-3 sm:gap-5"
      style={{
        bottom: "max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))",
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? 0 : 80}px)`,
        opacity: visible ? 1 : 0,
        background: "rgba(18,18,18,0.96)",
        border: "1px solid rgba(184,151,58,0.22)",
        padding: "12px 16px",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
        transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1), opacity 0.5s ease",
        maxWidth: "calc(100vw - 32px)",
      }}
    >
      <span className="hidden sm:inline" style={{ fontSize: 11, color: "rgba(244,240,232,0.5)", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
        <strong style={{ color: "var(--mk-text-primary)", fontWeight: 400 }}>Implementación asistida</strong>
        {" "}· Te acompañamos
      </span>
      <button
        onClick={openBooking}
        className="btn-mk-primary"
        style={{ fontSize: 9, padding: "10px 20px", whiteSpace: "nowrap" }}
      >
        Empezar ahora →
      </button>
    </div>
  );
}
