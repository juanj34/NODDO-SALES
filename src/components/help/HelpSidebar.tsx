"use client";

import { cn } from "@/lib/utils";
import type { HelpCategoryData } from "./HelpCategorySection";

interface HelpSidebarProps {
  categories: HelpCategoryData[];
  activeCategory: string | null;
  onSelectCategory: (id: string) => void;
}

export function HelpSidebar({
  categories,
  activeCategory,
  onSelectCategory,
}: HelpSidebarProps) {
  const handleClick = (categoryId: string) => {
    onSelectCategory(categoryId);
    const el = document.getElementById(`cat-${categoryId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav className="w-48 shrink-0 hidden lg:block">
      <div className="sticky top-8 space-y-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleClick(cat.id)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all text-xs cursor-pointer",
              activeCategory === cat.id
                ? "bg-[var(--surface-2)] text-[var(--text-primary)] border-l-2 border-[var(--site-primary)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
            )}
          >
            <span className="font-ui text-[11px] font-semibold uppercase tracking-[0.06em]">
              {cat.label}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">
              {cat.articles.length}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
