"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";

interface MobileBottomSheetProps {
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  /** Icon for the floating action button */
  fabIcon: React.ReactNode;
  /** Label shown next to FAB icon */
  fabLabel?: string;
  /** Optional badge count */
  badgeCount?: number;
  /** Height of the panel in vh (default: 75) */
  heightVh?: number;
  /** Additional className for the panel body */
  className?: string;
}

export function MobileBottomSheet({
  children,
  isOpen,
  onToggle,
  onClose,
  fabIcon,
  fabLabel,
  badgeCount,
  heightVh = 75,
  className,
}: MobileBottomSheetProps) {
  // Scroll lock
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.setProperty("--scroll-position", `-${scrollY}px`);
      document.body.classList.add("scroll-locked");
      return () => {
        document.body.classList.remove("scroll-locked");
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (info.offset.y > 100 || info.velocity.y > 500) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <>
      {/* Floating Action Button — visible when sheet is closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
            onClick={onToggle}
            className="fixed bottom-6 right-20 z-30 flex items-center gap-2 px-4 py-3 rounded-full glass cursor-pointer"
            style={{
              boxShadow:
                "0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)",
            }}
          >
            <span className="text-[var(--site-primary)]">{fabIcon}</span>
            {fabLabel && (
              <span className="text-xs text-white/80 tracking-wider font-medium">
                {fabLabel}
              </span>
            )}
            {badgeCount != null && badgeCount > 0 && (
              <span className="min-w-[18px] h-[18px] rounded-full bg-[var(--site-primary)] text-black text-[10px] font-bold flex items-center justify-center px-1">
                {badgeCount}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Backdrop overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[38] bg-black/40"
          />
        )}
      </AnimatePresence>

      {/* Bottom sheet panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[39] flex flex-col rounded-t-[1.25rem] border-t border-[var(--border-default)] overflow-hidden"
            style={{
              height: `${heightVh}vh`,
              background: "rgba(10, 10, 11, 0.95)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              paddingBottom: "var(--safe-area-bottom, 0px)",
            }}
          >
            {/* Drag handle — only this area is draggable */}
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.3}
              onDragEnd={handleDragEnd}
              className="flex-shrink-0 flex items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
            >
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </motion.div>

            {/* Panel content — scrollable */}
            <div className={cn("flex-1 min-h-0 overflow-y-auto", className)}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
