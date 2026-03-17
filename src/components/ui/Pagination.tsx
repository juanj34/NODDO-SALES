"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { fontSize, letterSpacing, radius, gap, iconSize } from "@/lib/design-tokens";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  variant?: "default" | "compact";
  className?: string;
}

/**
 * Unified Pagination component for consistent pagination UI.
 *
 * Variants:
 * - default: Full pagination with page numbers
 * - compact: Only prev/next buttons with page indicator
 *
 * Used in: bitacora/page.tsx, leads table, future tables
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  variant = "default",
  className,
}: PaginationProps) {
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const buttonClass = cn(
    "flex items-center justify-center px-3 py-1.5 font-ui font-bold uppercase transition-all border cursor-pointer",
    fontSize.label,
    letterSpacing.wider,
    radius.md,
    gap.compact,
    "bg-[var(--surface-2)] border-[var(--border-default)] text-[var(--text-secondary)]",
    "hover:bg-[var(--surface-3)] hover:text-white hover:border-[var(--border-strong)]",
    "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[var(--surface-2)] disabled:hover:text-[var(--text-secondary)]"
  );

  const activeButtonClass = cn(
    "flex items-center justify-center min-w-[32px] h-8 font-ui font-bold transition-all border",
    fontSize.label,
    radius.md,
    "bg-[var(--site-primary)] border-[var(--site-primary)] text-black",
    "shadow-lg shadow-[rgba(var(--site-primary-rgb),0.2)]"
  );

  const pageButtonClass = cn(
    "flex items-center justify-center min-w-[32px] h-8 font-ui font-bold transition-all border cursor-pointer",
    fontSize.label,
    radius.md,
    "bg-[var(--surface-2)] border-[var(--border-default)] text-[var(--text-secondary)]",
    "hover:bg-[var(--surface-3)] hover:text-white hover:border-[var(--border-strong)]"
  );

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center", gap.normal, className)}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrev}
          className={buttonClass}
          type="button"
        >
          <ChevronLeft size={iconSize.xs} />
          <span>Anterior</span>
        </button>

        <span className={cn("font-mono text-[var(--text-secondary)]", fontSize.label)}>
          Página {currentPage} de {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className={buttonClass}
          type="button"
        >
          <span>Siguiente</span>
          <ChevronRight size={iconSize.xs} />
        </button>
      </div>
    );
  }

  // variant === "default" - Full pagination with page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, and pages around current
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className={cn("flex items-center", gap.compact, className)}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrev}
        className={buttonClass}
        type="button"
      >
        <ChevronLeft size={iconSize.xs} />
      </button>

      {getPageNumbers().map((page, idx) => {
        if (page === "...") {
          return (
            <span
              key={`ellipsis-${idx}`}
              className={cn("flex items-center justify-center min-w-[32px] h-8 text-[var(--text-muted)]", fontSize.label)}
            >
              ...
            </span>
          );
        }

        const pageNum = page as number;
        const isActive = pageNum === currentPage;

        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={isActive ? activeButtonClass : pageButtonClass}
            type="button"
          >
            {pageNum}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        className={buttonClass}
        type="button"
      >
        <ChevronRight size={iconSize.xs} />
      </button>
    </div>
  );
}
