"use client";

import type { LucideIcon } from "lucide-react";
import { HelpArticle } from "./HelpArticle";

export interface HelpArticleData {
  id: string;
  title: string;
  description: string;
  content: string;
  steps?: readonly string[];
  tips?: readonly string[];
  icon: LucideIcon;
}

export interface HelpCategoryData {
  id: string;
  label: string;
  articles: HelpArticleData[];
}

interface HelpCategorySectionProps {
  category: HelpCategoryData;
  expandedArticle: string | null;
  onToggleArticle: (id: string) => void;
}

export function HelpCategorySection({
  category,
  expandedArticle,
  onToggleArticle,
}: HelpCategorySectionProps) {
  return (
    <section id={`cat-${category.id}`} className="scroll-mt-8">
      {/* Category label */}
      <h2 className="font-ui text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)] font-bold mb-3 px-1">
        {category.label}
      </h2>

      {/* Articles */}
      <div className="space-y-2">
        {category.articles.map((article) => (
          <HelpArticle
            key={article.id}
            id={article.id}
            title={article.title}
            description={article.description}
            content={article.content}
            steps={article.steps}
            tips={article.tips}
            icon={article.icon}
            isExpanded={expandedArticle === article.id}
            onToggle={() => onToggleArticle(article.id)}
          />
        ))}
      </div>
    </section>
  );
}
