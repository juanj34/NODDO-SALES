"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, type LucideIcon } from "lucide-react";
import { createPortal } from "react-dom";

export interface InfoTooltipProps {
  content: ReactNode;
  trigger?: "icon" | "text" | "inline";
  variant?: "dashboard" | "marketing" | "site";
  placement?: "top" | "bottom" | "left" | "right" | "auto";
  icon?: LucideIcon;
  maxWidth?: number;
  className?: string;
  persistent?: boolean; // Click to open/close instead of hover
  linkText?: string;
  linkHref?: string;
}

type PlacementType = "top" | "bottom" | "left" | "right";

interface TooltipPosition {
  top: number;
  left: number;
  placement: PlacementType;
  arrowLeft?: number;
  arrowTop?: number;
}

const variantStyles = {
  dashboard: {
    tooltip: "bg-[rgba(34,34,38,0.95)] border-[var(--border-default)] text-[var(--text-primary)]",
    arrow: "bg-[rgba(34,34,38,0.95)] border-[var(--border-default)]",
    trigger: "text-[var(--site-primary)] hover:text-[rgba(var(--site-primary-rgb),0.8)]",
  },
  marketing: {
    tooltip: "bg-[rgba(26,26,29,0.95)] border-[rgba(255,255,255,0.08)] text-[rgba(244,240,232,0.9)]",
    arrow: "bg-[rgba(26,26,29,0.95)] border-[rgba(255,255,255,0.08)]",
    trigger: "text-[#b8973a] hover:text-[#d4b05a]",
  },
  site: {
    tooltip: "bg-[rgba(34,34,38,0.95)] border-[var(--border-default)] text-[var(--text-primary)]",
    arrow: "bg-[rgba(34,34,38,0.95)] border-[var(--border-default)]",
    trigger: "text-[var(--site-primary)] hover:text-[rgba(var(--site-primary-rgb),0.8)]",
  },
};

export function InfoTooltip({
  content,
  trigger = "icon",
  variant = "dashboard",
  placement = "auto",
  icon: Icon = HelpCircle,
  maxWidth = 280,
  className = "",
  persistent = false,
  linkText,
  linkHref,
}: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const vStyles = variantStyles[variant];

  // Client-side only mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate position
  useEffect(() => {
    if (!isOpen || !triggerRef.current || !isMounted) return;

    const calculatePosition = () => {
      const trigger = triggerRef.current!.getBoundingClientRect();
      const tooltipWidth = maxWidth;
      const tooltipHeight = 100; // Estimate, will adjust
      const gap = 8;
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      // Calculate all possible positions
      const positions: Record<PlacementType, { top: number; left: number }> = {
        top: {
          top: trigger.top - tooltipHeight - gap,
          left: trigger.left + trigger.width / 2 - tooltipWidth / 2,
        },
        bottom: {
          top: trigger.bottom + gap,
          left: trigger.left + trigger.width / 2 - tooltipWidth / 2,
        },
        left: {
          top: trigger.top + trigger.height / 2 - tooltipHeight / 2,
          left: trigger.left - tooltipWidth - gap,
        },
        right: {
          top: trigger.top + trigger.height / 2 - tooltipHeight / 2,
          left: trigger.right + gap,
        },
      };

      // Check which positions fit
      const fits = (pos: { top: number; left: number }, p: PlacementType) => {
        if (p === "top" || p === "bottom") {
          return (
            pos.top >= 0 &&
            pos.top + tooltipHeight <= viewport.height &&
            pos.left >= 0 &&
            pos.left + tooltipWidth <= viewport.width
          );
        }
        return (
          pos.left >= 0 &&
          pos.left + tooltipWidth <= viewport.width &&
          pos.top >= 0 &&
          pos.top + tooltipHeight <= viewport.height
        );
      };

      // Auto placement priority: top > bottom > right > left
      let finalPlacement: PlacementType =
        placement === "auto" ? "top" : placement;

      if (placement === "auto") {
        const priorities: PlacementType[] = ["top", "bottom", "right", "left"];
        for (const p of priorities) {
          if (fits(positions[p], p)) {
            finalPlacement = p;
            break;
          }
        }
      }

      const finalPos = positions[finalPlacement];

      // Constrain to viewport
      const constrainedLeft = Math.max(
        8,
        Math.min(finalPos.left, viewport.width - tooltipWidth - 8)
      );
      const constrainedTop = Math.max(
        8,
        Math.min(finalPos.top, viewport.height - tooltipHeight - 8)
      );

      // Calculate arrow position
      let arrowLeft: number | undefined;
      let arrowTop: number | undefined;

      if (finalPlacement === "top" || finalPlacement === "bottom") {
        arrowLeft = trigger.left + trigger.width / 2 - constrainedLeft - 4;
      } else {
        arrowTop = trigger.top + trigger.height / 2 - constrainedTop - 4;
      }

      setPosition({
        top: constrainedTop,
        left: constrainedLeft,
        placement: finalPlacement,
        arrowLeft,
        arrowTop,
      });
    };

    calculatePosition();

    // Recalculate on scroll/resize
    window.addEventListener("scroll", calculatePosition, true);
    window.addEventListener("resize", calculatePosition);

    return () => {
      window.removeEventListener("scroll", calculatePosition, true);
      window.removeEventListener("resize", calculatePosition);
    };
  }, [isOpen, isMounted, maxWidth, placement]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        !isPinned &&
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, isPinned]);

  // Close on ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setIsPinned(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleMouseEnter = () => {
    if (persistent) return;
    hoverTimeoutRef.current = setTimeout(() => setIsOpen(true), 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (!isPinned && !persistent) {
      setIsOpen(false);
    }
  };

  const handleClick = () => {
    if (persistent) {
      setIsOpen(!isOpen);
      setIsPinned(!isOpen);
    } else {
      setIsPinned(!isPinned);
      setIsOpen(true);
    }
  };

  // Render trigger
  const renderTrigger = () => {
    if (trigger === "icon") {
      return (
        <button
          ref={triggerRef}
          type="button"
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`inline-flex items-center justify-center w-4 h-4 rounded-full transition-colors ${vStyles.trigger} ${className}`}
          aria-label="More information"
          aria-expanded={isOpen}
        >
          <Icon size={14} />
        </button>
      );
    }

    if (trigger === "text") {
      return (
        <button
          ref={triggerRef}
          type="button"
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`inline border-b border-dotted ${vStyles.trigger} ${className}`}
          aria-label="More information"
          aria-expanded={isOpen}
        >
          {content}
        </button>
      );
    }

    // inline trigger: (?)
    return (
      <button
        ref={triggerRef}
        type="button"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`inline-flex items-center justify-center text-[10px] ml-1 ${vStyles.trigger} ${className}`}
        aria-label="More information"
        aria-expanded={isOpen}
      >
        (?)
      </button>
    );
  };

  // Animation variants
  const tooltipVariants = {
    hidden: (p: PlacementType) => ({
      opacity: 0,
      y: p === "top" ? 4 : p === "bottom" ? -4 : 0,
      x: p === "left" ? 4 : p === "right" ? -4 : 0,
      scale: 0.96,
    }),
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.15,
        ease: "easeOut",
      },
    },
    exit: (p: PlacementType) => ({
      opacity: 0,
      y: p === "top" ? 4 : p === "bottom" ? -4 : 0,
      x: p === "left" ? 4 : p === "right" ? -4 : 0,
      scale: 0.96,
      transition: {
        duration: 0.1,
        ease: "easeIn",
      },
    }),
  };

  return (
    <>
      {renderTrigger()}

      {isMounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && position && (
              <motion.div
                ref={tooltipRef}
                custom={position.placement}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={tooltipVariants}
                role="tooltip"
                className={`
                  fixed z-[60] rounded-xl border shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_0_1px_rgba(var(--site-primary-rgb),0.15)]
                  ${vStyles.tooltip}
                `}
                style={{
                  top: position.top,
                  left: position.left,
                  maxWidth,
                  backdropFilter: "blur(32px)",
                  WebkitBackdropFilter: "blur(32px)",
                }}
              >
                {/* Arrow */}
                <div
                  className={`absolute w-2 h-2 ${vStyles.arrow} ${
                    position.placement === "bottom"
                      ? "top-[-5px] border-b-0 border-r-0"
                      : position.placement === "top"
                      ? "bottom-[-5px] border-t-0 border-l-0"
                      : position.placement === "right"
                      ? "left-[-5px] border-r-0 border-b-0"
                      : "right-[-5px] border-l-0 border-t-0"
                  }`}
                  style={{
                    transform: "rotate(45deg)",
                    left: position.arrowLeft,
                    top: position.arrowTop,
                  }}
                />

                {/* Content */}
                <div className="p-3 text-[12px] leading-[1.7]">
                  {typeof content === "string" ? (
                    <p>{content}</p>
                  ) : (
                    content
                  )}

                  {/* Optional link */}
                  {linkText && linkHref && (
                    <a
                      href={linkHref}
                      className="inline-flex items-center gap-1 mt-2 text-[11px] text-[var(--site-primary)] hover:underline"
                      onClick={() => {
                        setIsOpen(false);
                        setIsPinned(false);
                      }}
                    >
                      {linkText} →
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
