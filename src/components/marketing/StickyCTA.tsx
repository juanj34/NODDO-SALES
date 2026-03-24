"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useBooking } from "./BookingProvider";
import { Star, Clock, Shield } from "lucide-react";
import { useTranslation } from "@/i18n";

export function StickyCTA() {
  const { openBooking } = useBooking();
  const { t } = useTranslation("marketing");
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
      className="fixed z-[200]"
      style={{
        bottom: "max(16px, calc(env(safe-area-inset-bottom, 0px) + 12px))",
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? 0 : 100}px)`,
        opacity: visible ? 1 : 0,
        background: "linear-gradient(135deg, rgba(22,22,24,0.98) 0%, rgba(18,18,18,0.97) 100%)",
        border: "1px solid rgba(184,151,58,0.35)",
        borderRadius: "14px",
        padding: "12px 16px",
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        boxShadow: "0 0 0 1px rgba(184,151,58,0.08) inset, 0 24px 64px rgba(0,0,0,0.7), 0 0 40px rgba(184,151,58,0.15)",
        transition: "transform 0.6s cubic-bezier(0.22,1,0.36,1), opacity 0.6s ease, box-shadow 0.3s ease",
        maxWidth: "calc(100vw - 32px)",
        willChange: "transform",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 0 0 1px rgba(184,151,58,0.12) inset, 0 28px 72px rgba(0,0,0,0.8), 0 0 60px rgba(184,151,58,0.25)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 0 0 1px rgba(184,151,58,0.08) inset, 0 24px 64px rgba(0,0,0,0.7), 0 0 40px rgba(184,151,58,0.15)";
      }}
    >
      {/* Mobile Layout */}
      <div className="flex md:hidden items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          {/* Stars + Rating */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                size={11}
                fill="#b8973a"
                stroke="#b8973a"
                strokeWidth={1.5}
              />
            ))}
            <span style={{ fontSize: 9, color: "rgba(244,240,232,0.7)", marginLeft: 2, fontWeight: 500 }}>
              5.0
            </span>
          </div>

          {/* Social proof text with live dot */}
          <div className="flex items-center gap-1.5" style={{ fontSize: 10, color: "rgba(244,240,232,0.5)", letterSpacing: "0.02em" }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#4ade80",
                boxShadow: "0 0 8px rgba(74,222,128,0.6)",
                flexShrink: 0,
              }}
            />
            <span>
              <strong style={{ color: "var(--mk-text-primary)", fontWeight: 500 }}>100+</strong> {t("stickyCta.projectsLive")}
            </span>
          </div>
        </div>

        <div className="relative">
          {/* Pulsing glow ring */}
          <div
            className="absolute inset-0 rounded-[12px]"
            style={{
              background: "transparent",
              boxShadow: "0 0 0 0 rgba(184,151,58,0.7)",
              animation: "pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          />

          <button
            onClick={openBooking}
            className="btn-mk-primary flex-shrink-0 relative"
            style={{ fontSize: 10, padding: "10px 18px", whiteSpace: "nowrap", fontWeight: 700, zIndex: 1 }}
          >
            {t("stickyCta.bookCall")}
          </button>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center gap-6">
        {/* Left: Avatar Stack */}
        <div className="flex items-center gap-3">
          {/* Stacked avatars */}
          <div className="flex items-center" style={{ marginLeft: -4 }}>
            {[
              "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces",
              "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces",
              "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces",
            ].map((photoUrl, i) => (
              <div
                key={i}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "2px solid rgba(18,18,18,0.9)",
                  marginLeft: i === 0 ? 0 : -10,
                  position: "relative",
                  zIndex: 4 - i,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(184,151,58,0.2)",
                  overflow: "hidden",
                }}
              >
                <Image
                  src={photoUrl}
                  alt=""
                  width={32}
                  height={32}
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          {/* Social proof text with stars + live dot */}
          <div className="flex flex-col" style={{ gap: 2 }}>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={12}
                  fill="#b8973a"
                  stroke="#b8973a"
                  strokeWidth={1.5}
                />
              ))}
              <span style={{ fontSize: 10, color: "rgba(244,240,232,0.8)", marginLeft: 3, fontWeight: 600 }}>
                5.0
              </span>
            </div>
            <div className="flex items-center gap-1.5" style={{ fontSize: 10, color: "rgba(244,240,232,0.45)", letterSpacing: "0.02em" }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#4ade80",
                  boxShadow: "0 0 8px rgba(74,222,128,0.6)",
                  flexShrink: 0,
                }}
              />
              <span>
                <strong style={{ color: "var(--mk-text-primary)", fontWeight: 500 }}>100+</strong> {t("stickyCta.projectsLive")}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 36, background: "rgba(255,255,255,0.06)" }} />

        {/* Center: Key benefits */}
        <div className="flex items-center gap-6">
          {/* Benefit 1 */}
          <div className="flex items-center gap-2">
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "6px",
                background: "rgba(184,151,58,0.08)",
                border: "1px solid rgba(184,151,58,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Clock size={13} stroke="#b8973a" strokeWidth={2} />
            </div>
            <div style={{ fontSize: 11, color: "rgba(244,240,232,0.85)", fontWeight: 500, whiteSpace: "nowrap" }}>
              {t("stickyCta.publishedIn24h")}
            </div>
          </div>

          {/* Benefit 2 */}
          <div className="flex items-center gap-2">
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "6px",
                background: "rgba(184,151,58,0.08)",
                border: "1px solid rgba(184,151,58,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Shield size={13} stroke="#b8973a" strokeWidth={2} />
            </div>
            <div style={{ fontSize: 11, color: "rgba(244,240,232,0.85)", fontWeight: 500, whiteSpace: "nowrap" }}>
              {t("stickyCta.noCommitment")}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 36, background: "rgba(255,255,255,0.06)" }} />

        {/* Right: CTA */}
        <div className="relative">
          {/* Pulsing glow ring */}
          <div
            className="absolute inset-0 rounded-[12px]"
            style={{
              background: "transparent",
              boxShadow: "0 0 0 0 rgba(184,151,58,0.7)",
              animation: "pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          />

          <button
            onClick={openBooking}
            className="btn-mk-primary relative overflow-hidden group"
            style={{
              fontSize: 10,
              padding: "12px 28px",
              whiteSpace: "nowrap",
              fontWeight: 700,
              letterSpacing: "0.06em",
              position: "relative",
              zIndex: 1,
            }}
          >
            <span className="relative z-10">{t("stickyCta.bookCallDesktop")}</span>

            {/* Animated shine effect */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
                animation: "shine 2s infinite",
              }}
            />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }

        @keyframes pulse-ring {
          0% {
            box-shadow: 0 0 0 0 rgba(184,151,58,0.7);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(184,151,58,0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(184,151,58,0);
          }
        }
      `}</style>
    </div>
  );
}
