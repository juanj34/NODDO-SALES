"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Layers, MapPin } from "lucide-react";
import { useSiteProject } from "@/hooks/useSiteProject";
import { SectionTransition } from "@/components/site/SectionTransition";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { MobileBottomSheet } from "@/components/site/MobileBottomSheet";
import { cn } from "@/lib/utils";
import type { PlanoInteractivo, PlanoPunto } from "@/types";
import { useTranslation } from "@/i18n";

/* ── Component ───────────────────────────────────────────── */

export default function ImplantacionesPage() {
  const proyecto = useSiteProject();
  const { t } = useTranslation("site");

  /* ── Visible urbanismo planos (editor "Implantaciones") ── */
  const planos = useMemo<PlanoInteractivo[]>(
    () =>
      (proyecto.planos_interactivos ?? [])
        .filter((p) => p.tipo === "urbanismo" && p.visible)
        .sort((a, b) => a.orden - b.orden),
    [proyecto.planos_interactivos]
  );

  const [activePlanoIndex, setActivePlanoIndex] = useState(0);
  const activePlano = planos[activePlanoIndex] as PlanoInteractivo | undefined;

  /* ── Puntos for the active plano ─────────────────────── */
  const puntos = useMemo<PlanoPunto[]>(() => {
    if (!activePlano) return [];
    return (proyecto.plano_puntos ?? [])
      .filter((pt) => pt.plano_id === activePlano.id)
      .sort((a, b) => a.orden - b.orden);
  }, [proyecto.plano_puntos, activePlano]);

  /* ── Selection & hover state ────────────────────────── */
  const [selectedPuntoId, setSelectedPuntoId] = useState<string | null>(null);
  const [hoveredPuntoId, setHoveredPuntoId] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [sheetOpen, setSheetOpen] = useState(false);

  /* ── Render modal ───────────────────────────────────── */
  const [renderModalPunto, setRenderModalPunto] = useState<PlanoPunto | null>(null);

  /* ── Image ref (no JS measurement needed — CSS % positioning) */
  const planoImgRef = useRef<HTMLImageElement>(null);
  const [imageError, setImageError] = useState(false);

  /* ── Reset on plano change ──────────────────────────── */
  useEffect(() => {
    requestAnimationFrame(() => {
      setSelectedPuntoId(null);
      setImageLoaded(false);
      setImageError(false);
    });
  }, [activePlanoIndex]);

  /* ── Scroll to punto in list ────────────────────────── */
  const puntoListRef = useRef<HTMLDivElement>(null);

  const scrollToPunto = useCallback((puntoId: string) => {
    const el = puntoListRef.current?.querySelector(`[data-punto-id="${puntoId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  /* ── Handle hotspot click on plan image ─────────────── */
  const handleHotspotClick = useCallback((punto: PlanoPunto) => {
    setSelectedPuntoId(punto.id);
    scrollToPunto(punto.id);
    if (isMobile) setSheetOpen(true);
    // If render or image exists, open modal
    if (punto.render_url || punto.imagen_url) {
      setRenderModalPunto(punto);
    }
  }, [scrollToPunto, isMobile]);

  /* ── Handle hotspot click in list ───────────────────── */
  const handleListItemClick = useCallback((punto: PlanoPunto) => {
    setSelectedPuntoId(punto.id);
    if (punto.render_url || punto.imagen_url) {
      setRenderModalPunto(punto);
    }
  }, []);

  /* ── Keyboard navigation ────────────────────────────── */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Escape") {
        if (renderModalPunto) {
          setRenderModalPunto(null);
        } else if (selectedPuntoId) {
          setSelectedPuntoId(null);
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedPuntoId, renderModalPunto]);

  /* ── Empty state ────────────────────────────────────── */
  if (planos.length === 0) {
    return (
      <SectionTransition className="h-screen flex overflow-hidden bg-[var(--site-bg)]">
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
            <Layers size={28} className="text-[var(--text-muted)]" />
          </div>
          <div>
            <h2 className="text-lg font-site-heading text-[var(--text-secondary)] mb-1">
              {t("implantaciones.notAvailable")}
            </h2>
            <p className="text-sm text-[var(--text-tertiary)]">
              {t("implantaciones.notConfigured")}
            </p>
          </div>
        </div>
      </SectionTransition>
    );
  }

  /* ── Sidebar content (shared between desktop sidebar + mobile sheet) ── */
  const sidebarContent = (
    <>
      {/* ── Plan title + description ── */}
      <div className="flex-shrink-0 p-5 pb-0">
        {activePlano && (
          <>
            <p className="text-[10px] tracking-[0.3em] text-[var(--site-primary)] uppercase mb-2">
              {t("implantaciones.heading")}
            </p>
            <h2 className="font-site-heading text-xl text-white leading-tight mb-2">
              {activePlano.nombre}
            </h2>
            {activePlano.descripcion && (
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                {activePlano.descripcion}
              </p>
            )}
          </>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-white/5 mx-5" />

      {/* ── Hotspots section ── */}
      <div className="flex-shrink-0 px-5 pt-4 pb-2 flex items-center justify-between">
        <p className="text-[10px] tracking-[0.25em] text-[var(--text-tertiary)] uppercase">
          {t("implantaciones.hotspots")}
        </p>
        <span className="text-[10px] text-[var(--text-muted)]">
          {t("implantaciones.hotspotCount", { count: String(puntos.length) })}
        </span>
      </div>

      {/* ── Scrollable hotspot list ── */}
      <div ref={puntoListRef} className="flex-1 overflow-y-auto scrollbar-hide px-3 pb-5">
        {puntos.length > 0 ? (
          <div className="space-y-1.5">
            {puntos.map((punto, index) => {
              const isSelected = selectedPuntoId === punto.id;
              const number = index + 1;

              return (
                <button
                  key={punto.id}
                  data-punto-id={punto.id}
                  onClick={() => handleListItemClick(punto)}
                  onMouseEnter={() => setHoveredPuntoId(punto.id)}
                  onMouseLeave={() => setHoveredPuntoId(null)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer group",
                    isSelected
                      ? "bg-[rgba(var(--site-primary-rgb),0.10)] ring-1 ring-[rgba(var(--site-primary-rgb),0.25)]"
                      : "hover:bg-white/5"
                  )}
                >
                  {/* Number badge */}
                  <span
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-colors",
                      isSelected
                        ? "bg-[var(--site-primary)] text-black"
                        : "bg-white/10 text-[var(--text-secondary)] group-hover:bg-[rgba(var(--site-primary-rgb),0.2)] group-hover:text-[var(--site-primary)]"
                    )}
                  >
                    {number}
                  </span>

                  {/* Render thumbnail */}
                  {(punto.render_url || punto.imagen_url) && (
                    <div className="w-12 h-9 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={(punto.render_url || punto.imagen_url)!}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Text content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-white font-medium truncate">
                      {punto.titulo}
                    </p>
                    {punto.descripcion && (
                      <p className="text-[11px] text-[var(--text-tertiary)] line-clamp-1 mt-0.5">
                        {punto.descripcion}
                      </p>
                    )}
                  </div>

                  {/* View render indicator */}
                  {(punto.render_url || punto.imagen_url) && (
                    <span className="text-[9px] text-[var(--site-primary)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      {t("implantaciones.viewRender")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MapPin size={20} className="text-[var(--text-muted)] mx-auto mb-2" />
              <p className="text-xs text-[var(--text-muted)]">
                {t("implantaciones.selectPoint")}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <SectionTransition className="h-screen flex overflow-hidden bg-[var(--site-bg)]">
      {/* ====== LEFT: Interactive plan image ====== */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Ambient background */}
        <div className="absolute inset-0 bg-[var(--surface-0)]" />

        {/* Header overlay — top left */}
        <motion.div
          className="absolute top-6 z-20"
          style={{ left: isMobile ? "5rem" : "1.5rem" }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[rgba(var(--site-primary-rgb),0.15)] flex items-center justify-center">
              <Layers size={18} className="text-[var(--site-primary)]" />
            </div>
            <div>
              <h1 className="text-lg font-site-heading text-white">{t("implantaciones.heading")}</h1>
              {activePlano && (
                <p className="text-[10px] text-[var(--text-tertiary)] tracking-wider">
                  {activePlano.nombre}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* ====== Plan Image + Hotspots ====== */}
        <motion.div
          className="relative z-10 flex items-center justify-center p-4 lg:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {activePlano && activePlano.imagen_url && !imageError ? (
            <div className="relative inline-block leading-[0]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={planoImgRef}
                src={activePlano.imagen_url}
                alt={activePlano.nombre}
                className={cn(
                  "block max-h-[calc(100vh-120px)] max-w-full w-auto rounded-2xl shadow-2xl shadow-black/50 transition-opacity duration-500",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                draggable={false}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />

              {/* Hotspot dots */}
              {imageLoaded &&
                puntos.map((punto, index) => {
                  const isSelected = selectedPuntoId === punto.id;
                  const isHovered = hoveredPuntoId === punto.id;
                  const number = index + 1;

                  return (
                    <button
                      key={punto.id}
                      aria-label={t("implantaciones.viewItem", { name: punto.titulo })}
                      className="absolute z-10 cursor-pointer group flex items-center justify-center"
                      style={{
                        left: `${punto.x}%`,
                        top: `${punto.y}%`,
                        transform: "translate(-50%, -50%)",
                        minWidth: "44px",
                        minHeight: "44px",
                      }}
                      onClick={() => handleHotspotClick(punto)}
                      onMouseEnter={() => setHoveredPuntoId(punto.id)}
                      onMouseLeave={() => setHoveredPuntoId(null)}
                    >
                      <span className="relative inline-flex items-center justify-center">
                        {/* Pulse ring */}
                        {!isSelected && (
                          <span className="absolute inset-0 rounded-full border-2 border-[rgba(var(--site-primary-rgb),0.40)] opacity-60" />
                        )}

                        {/* Selection ring */}
                        {isSelected && (
                          <span className="absolute -inset-1.5 rounded-full border-2 border-[var(--site-primary)] animate-pulse" />
                        )}

                        {/* Numbered dot */}
                        <span
                          className={cn(
                            "relative flex items-center justify-center w-7 h-7 rounded-full border-2 border-white shadow-lg transition-transform duration-150",
                            "bg-[var(--site-primary)] text-black",
                            isSelected && "scale-110",
                            isHovered && !isSelected && "scale-105"
                          )}
                        >
                          <span className="text-[11px] font-bold leading-none">
                            {number}
                          </span>
                        </span>
                      </span>

                      {/* Tooltip */}
                      <AnimatePresence>
                        {isHovered && !isSelected && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 glass-dark px-3 py-1.5 rounded-lg whitespace-nowrap z-30 pointer-events-none"
                          >
                            <span className="text-[11px] font-medium text-white tracking-wider">
                              {punto.titulo}
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  );
                })}
            </div>
          ) : activePlano ? (
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <Layers size={40} className="text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-tertiary)]">
                {t("implantaciones.noImage")}
              </p>
            </div>
          ) : null}
        </motion.div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[var(--site-bg)] to-transparent z-5" />

        {/* ====== Bottom-left: Plan selector (if multiple) ====== */}
        {planos.length > 1 && (
          <motion.div
            className={cn(
              "absolute z-20 glass rounded-2xl p-3",
              isMobile ? "bottom-20 left-4" : "bottom-6 left-6"
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <p className="text-[9px] tracking-[0.25em] text-[var(--text-tertiary)] uppercase mb-2 px-1">
              {t("implantaciones.plans")}
            </p>
            <div className="flex items-center gap-2">
              {planos.map((plano, idx) => {
                const isActive = idx === activePlanoIndex;
                return (
                  <div key={plano.id} className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => setActivePlanoIndex(idx)}
                      className={cn(
                        "relative w-16 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 cursor-pointer flex-shrink-0",
                        isActive
                          ? "border-[var(--site-primary)] shadow-[0_0_12px_rgba(var(--site-primary-rgb),0.3)]"
                          : "border-transparent opacity-60 hover:opacity-100"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={plano.imagen_url}
                        alt={plano.nombre}
                        className="w-full h-full object-cover"
                      />
                      {isActive && (
                        <div className="absolute inset-0 bg-[rgba(var(--site-primary-rgb),0.10)]" />
                      )}
                    </button>
                    <span className={cn(
                      "text-[9px] leading-tight max-w-16 truncate transition-colors duration-200",
                      isActive ? "text-[var(--site-primary)]" : "text-[var(--text-tertiary)]"
                    )}>
                      {plano.nombre}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* ====== RIGHT: Sidebar (desktop) / Bottom Sheet (mobile) ====== */}
      {!isMobile && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-[380px] h-full flex-shrink-0 bg-[var(--surface-0)]/95 backdrop-blur-xl border-l border-[var(--border-default)] flex flex-col z-20"
        >
          {sidebarContent}
        </motion.div>
      )}
      {isMobile && (
        <MobileBottomSheet
          isOpen={sheetOpen}
          onToggle={() => setSheetOpen((o) => !o)}
          onClose={() => setSheetOpen(false)}
          fabIcon={<Layers size={18} />}
          fabLabel={t("mobile.showHotspots")}
          badgeCount={puntos.length}
        >
          <div className="flex flex-col h-full">
            {sidebarContent}
          </div>
        </MobileBottomSheet>
      )}

      {/* ====== RENDER MODAL ====== */}
      <AnimatePresence>
        {renderModalPunto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
            onClick={() => setRenderModalPunto(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-[85vw] max-h-[85vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setRenderModalPunto(null)}
                aria-label={t("implantaciones.closeRender")}
                className="absolute -top-4 -right-4 z-10 p-2 rounded-full glass hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X size={18} className="text-white" />
              </button>

              {/* Render image */}
              <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={(renderModalPunto.render_url || renderModalPunto.imagen_url)!}
                  alt={renderModalPunto.titulo}
                  className="max-w-[85vw] max-h-[70vh] object-contain"
                />
              </div>

              {/* Title + description below */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-4 text-center max-w-lg"
              >
                <h3 className="font-site-heading text-lg text-white mb-1">
                  {renderModalPunto.titulo}
                </h3>
                {renderModalPunto.descripcion && (
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {renderModalPunto.descripcion}
                  </p>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SectionTransition>
  );
}
