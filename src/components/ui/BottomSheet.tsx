"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Title shown in header */
  title?: string;
  /** Height of the sheet when open */
  height?: "sm" | "md" | "lg" | "full";
  /** Whether to show the drag handle */
  showHandle?: boolean;
  /** Custom className for the sheet content */
  className?: string;
  /** Whether clicking backdrop closes the sheet */
  closeOnBackdrop?: boolean;
}

const heightClasses = {
  sm: "h-[40vh]",
  md: "h-[60vh]",
  lg: "h-[80vh]",
  full: "h-[95vh]",
};

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  height = "md",
  showHandle = true,
  className,
  closeOnBackdrop = true,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isOpen]);

  // Handle drag to close
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // If dragged down more than 100px or velocity is high, close
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeOnBackdrop ? onClose : undefined}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            aria-hidden="true"
          />

          {/* Bottom Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50 flex flex-col",
              "bg-[var(--surface-1)] border-t border-[var(--border-default)]",
              "rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.3)]",
              heightClasses[height]
            )}
            role="dialog"
            aria-modal="true"
            aria-label={title || "Bottom sheet"}
          >
            {/* Drag Handle */}
            {showHandle && (
              <div className="flex justify-center py-3 touch-none">
                <div className="w-12 h-1 rounded-full bg-[var(--text-muted)] opacity-40" />
              </div>
            )}

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 pb-4 flex-shrink-0">
                <h3 className="font-ui text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/5 transition-colors"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* Content */}
            <div
              className={cn(
                "flex-1 overflow-y-auto px-6 pb-6",
                "scrollbar-thin scrollbar-thumb-[var(--border-default)] scrollbar-track-transparent",
                className
              )}
              data-lenis-prevent
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
