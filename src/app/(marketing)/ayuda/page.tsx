"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Search,
  ChevronRight,
  Lightbulb,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useContact } from "@/components/marketing/ContactProvider";
import {
  iconMap,
  categoryIconMap,
  defaultIcon,
  categoryStructure,
  normalize,
  type ArticleTranslation,
} from "@/lib/help-data";

/* ─── Framer ease ─── */
const ease = [0.25, 0.46, 0.45, 0.94] as const;

/* ─── Fade-in wrapper ─── */
function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.7, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Structured help dict shape ─── */
interface HelpDict {
  page: Record<string, string>;
  categories: Record<string, string>;
  categoryDescriptions: Record<string, string>;
  articles: Record<string, ArticleTranslation>;
}

/* ─── Category data built from translations ─── */
interface CategoryData {
  id: string;
  label: string;
  description: string;
  articleCount: number;
  articles: {
    id: string;
    title: string;
    description: string;
    content: string;
    steps?: readonly string[];
    tips?: readonly string[];
  }[];
}

export default function AyudaPage() {
  const { dictionary } = useLanguage();
  const { openContact } = useContact();
  const helpDict = dictionary.help as unknown as HelpDict;

  const [search, setSearch] = useState("");
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  /* ─── Build structured data ─── */
  const allCategories: CategoryData[] = useMemo(() => {
    return categoryStructure.map((cat) => {
      const articles = cat.articleIds.map((artId) => {
        const art = helpDict.articles[artId];
        return {
          id: artId,
          title: art?.title || artId,
          description: art?.description || "",
          content: art?.content || "",
          steps: art?.steps,
          tips: art?.tips,
        };
      });
      return {
        id: cat.id,
        label: helpDict.categories[cat.id] || cat.id,
        description: helpDict.categoryDescriptions?.[cat.id] || "",
        articleCount: articles.length,
        articles,
      };
    });
  }, [helpDict]);

  /* ─── Filter by search ─── */
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return allCategories;
    const q = normalize(search);
    return allCategories
      .map((cat) => ({
        ...cat,
        articles: cat.articles.filter(
          (a) =>
            normalize(a.title).includes(q) ||
            normalize(a.description).includes(q) ||
            normalize(a.content).includes(q)
        ),
        articleCount: cat.articles.filter(
          (a) =>
            normalize(a.title).includes(q) ||
            normalize(a.description).includes(q) ||
            normalize(a.content).includes(q)
        ).length,
      }))
      .filter((cat) => cat.articles.length > 0);
  }, [search, allCategories]);

  /* ─── Hash navigation on mount ─── */
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      requestAnimationFrame(() => {
        setExpandedArticle(hash);
        setTimeout(() => {
          document
            .getElementById(`help-${hash}`)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 400);
      });
    }
  }, []);

  const handleToggleArticle = (articleId: string) => {
    const next = expandedArticle === articleId ? null : articleId;
    setExpandedArticle(next);
    if (next) {
      window.history.replaceState(null, "", `#${next}`);
    } else {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  const scrollToCategory = (catId: string) => {
    const el = document.getElementById(`cat-${catId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* ════════════════════════════════════════════
          HERO SECTION
      ════════════════════════════════════════════ */}
      <section className="relative pt-36 pb-20 px-6 lg:px-20">
        <div className="max-w-3xl mx-auto text-center">
          {/* Section label */}
          <FadeIn>
            <p
              className="font-ui text-[9px] font-bold tracking-[0.4em] uppercase mb-6"
              style={{ color: "var(--mk-accent)" }}
            >
              Centro de Ayuda
            </p>
          </FadeIn>

          {/* Heading */}
          <FadeIn delay={0.1}>
            <h1
              className="font-heading font-light leading-[1.1] mb-5"
              style={{
                fontSize: "clamp(36px, 5vw, 72px)",
                color: "var(--mk-text-primary)",
              }}
            >
              {helpDict.page.title}
            </h1>
          </FadeIn>

          {/* Subtitle */}
          <FadeIn delay={0.2}>
            <p
              className="font-mono text-[14px] font-light leading-[1.8] max-w-xl mx-auto mb-10"
              style={{ color: "var(--mk-text-tertiary)" }}
            >
              {helpDict.page.heroSubtitle || helpDict.page.description}
            </p>
          </FadeIn>

          {/* Search */}
          <FadeIn delay={0.3}>
            <div className="relative max-w-xl mx-auto">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "rgba(244, 240, 232, 0.25)" }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={helpDict.page.searchPlaceholder}
                className="w-full pl-12 pr-5 py-4 rounded-[1rem] font-mono text-[13px] font-light outline-none transition-all duration-200"
                style={{
                  background: "var(--mk-surface-3, #2a2a2a)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "var(--mk-text-primary)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor =
                    "rgba(184, 151, 58, 0.4)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(184, 151, 58, 0.08)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor =
                    "rgba(255,255,255,0.06)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          CATEGORY CARDS GRID
      ════════════════════════════════════════════ */}
      <section className="relative px-6 lg:px-20 pb-24">
        <div className="max-w-5xl mx-auto">
          {/* Top row: 3 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {filteredCategories.slice(0, 3).map((cat, i) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                delay={i * 0.08}
                onClick={() => scrollToCategory(cat.id)}
              />
            ))}
          </div>
          {/* Bottom row: 2 cards centered */}
          {filteredCategories.length > 3 && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {filteredCategories.slice(3, 5).map((cat, i) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  delay={(3 + i) * 0.08}
                  onClick={() => scrollToCategory(cat.id)}
                  className="sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)]"
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          CATEGORY SECTIONS WITH ARTICLES
      ════════════════════════════════════════════ */}
      <section className="relative px-6 lg:px-20 pb-20">
        <div className="max-w-4xl mx-auto space-y-16">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              id={`cat-${category.id}`}
              className="scroll-mt-32"
            >
              {/* Category header */}
              <FadeIn>
                <div className="flex items-center gap-4 mb-6">
                  <span
                    className="font-ui text-[9px] font-bold tracking-[0.35em] uppercase whitespace-nowrap"
                    style={{ color: "var(--mk-accent)" }}
                  >
                    {category.label}
                  </span>
                  <div
                    className="flex-1 h-px"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                    }}
                  />
                  <span
                    className="font-mono text-[11px] font-light"
                    style={{ color: "var(--mk-text-muted)" }}
                  >
                    {category.articles.length}
                  </span>
                </div>
              </FadeIn>

              {/* Articles */}
              <div className="space-y-3">
                {category.articles.map((article, i) => (
                  <FadeIn key={article.id} delay={i * 0.05}>
                    <ArticleCard
                      article={article}
                      isExpanded={expandedArticle === article.id}
                      onToggle={() => handleToggleArticle(article.id)}
                      stepsLabel={helpDict.page.stepsLabel || "Paso a paso"}
                      tipsLabel={helpDict.page.tipsLabel || "Consejos"}
                    />
                  </FadeIn>
                ))}
              </div>
            </div>
          ))}

          {/* No results */}
          {filteredCategories.length === 0 && (
            <FadeIn>
              <div className="text-center py-24">
                <Search
                  size={40}
                  className="mx-auto mb-4"
                  style={{ color: "rgba(244, 240, 232, 0.12)" }}
                />
                <p
                  className="font-mono text-[13px] font-light"
                  style={{ color: "var(--mk-text-tertiary)" }}
                >
                  {helpDict.page.noResults}
                </p>
              </div>
            </FadeIn>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          CONTACT CTA SECTION
      ════════════════════════════════════════════ */}
      <section
        className="relative px-6 lg:px-20 py-28 border-t"
        style={{
          borderColor: "var(--mk-border-rule, rgba(255,255,255,0.04))",
          background: "var(--mk-bg-dark, #0a0a0a)",
        }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <FadeIn>
            <p
              className="font-ui text-[9px] font-bold tracking-[0.4em] uppercase mb-6"
              style={{ color: "var(--mk-accent)" }}
            >
              Soporte
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2
              className="font-heading font-light leading-[1.15] mb-5"
              style={{
                fontSize: "clamp(28px, 4vw, 48px)",
                color: "var(--mk-text-primary)",
              }}
            >
              {helpDict.page.ctaTitle || "No encontraste lo que buscabas?"}
            </h2>
          </FadeIn>
          <FadeIn delay={0.15}>
            <p
              className="font-mono text-[13px] font-light leading-[1.8] mb-10 max-w-lg mx-auto"
              style={{ color: "var(--mk-text-tertiary)" }}
            >
              {helpDict.page.ctaDescription || ""}
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => openContact(undefined, "help-center")}
                className="btn-mk-primary flex items-center gap-2 px-7 py-3.5"
              >
                <MessageCircle size={14} />
                {helpDict.page.ctaContact || "Contactanos"}
              </button>
              <a
                href="/faq"
                className="btn-mk-outline flex items-center gap-2 px-7 py-3.5"
              >
                {helpDict.page.ctaWhatsapp
                  ? "Ver preguntas frecuentes"
                  : "FAQ"}
                <ArrowRight size={14} />
              </a>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}

/* ══════════════════════════════════════════════
   CATEGORY CARD COMPONENT
══════════════════════════════════════════════ */
function CategoryCard({
  category,
  delay = 0,
  onClick,
  className,
}: {
  category: CategoryData;
  delay?: number;
  onClick: () => void;
  className?: string;
}) {
  const CatIcon = categoryIconMap[category.id] || defaultIcon;

  return (
    <FadeIn delay={delay} className={className}>
      <button
        onClick={onClick}
        className="w-full text-left rounded-[1.25rem] p-6 transition-all duration-300 group cursor-pointer"
        style={{
          background: "var(--mk-surface-3, #2a2a2a)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(184, 151, 58, 0.3)";
          e.currentTarget.style.boxShadow =
            "0 0 30px rgba(184, 151, 58, 0.06)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {/* Icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-all duration-300"
          style={{
            background: "rgba(184, 151, 58, 0.1)",
          }}
        >
          <CatIcon
            size={20}
            style={{ color: "var(--mk-accent)" }}
          />
        </div>

        {/* Name */}
        <h3
          className="font-ui text-[11px] font-bold tracking-[0.12em] uppercase mb-1.5"
          style={{ color: "var(--mk-text-primary)" }}
        >
          {category.label}
        </h3>

        {/* Description */}
        <p
          className="font-mono text-[11px] font-light leading-[1.6] mb-3"
          style={{ color: "var(--mk-text-tertiary)" }}
        >
          {category.description}
        </p>

        {/* Article count */}
        <span
          className="font-mono text-[10px] font-light"
          style={{ color: "var(--mk-text-muted)" }}
        >
          {category.articleCount}{" "}
          {category.articleCount === 1 ? "articulo" : "articulos"}
        </span>
      </button>
    </FadeIn>
  );
}

/* ══════════════════════════════════════════════
   ARTICLE CARD COMPONENT
══════════════════════════════════════════════ */
function ArticleCard({
  article,
  isExpanded,
  onToggle,
  stepsLabel,
  tipsLabel,
}: {
  article: CategoryData["articles"][number];
  isExpanded: boolean;
  onToggle: () => void;
  stepsLabel: string;
  tipsLabel: string;
}) {
  const Icon = iconMap[article.id] || defaultIcon;

  return (
    <div
      id={`help-${article.id}`}
      className="rounded-[1.25rem] transition-all duration-300"
      style={{
        background: "var(--mk-surface-3, #2a2a2a)",
        border: isExpanded
          ? "1px solid rgba(184, 151, 58, 0.25)"
          : "1px solid rgba(255,255,255,0.06)",
        boxShadow: isExpanded
          ? "0 0 40px rgba(184, 151, 58, 0.06)"
          : "none",
      }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-6 py-5 text-left group cursor-pointer rounded-[1.25rem] transition-colors duration-200"
        style={{}}
        onMouseEnter={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.background = "rgba(255,255,255,0.02)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
          style={{
            background: isExpanded
              ? "rgba(184, 151, 58, 0.15)"
              : "rgba(255,255,255,0.04)",
            boxShadow: isExpanded
              ? "0 0 20px rgba(184, 151, 58, 0.12)"
              : "none",
          }}
        >
          <Icon
            size={18}
            style={{
              color: isExpanded
                ? "var(--mk-accent)"
                : "rgba(244, 240, 232, 0.3)",
            }}
          />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3
            className="font-mono text-[14px] font-normal"
            style={{ color: "var(--mk-text-primary)" }}
          >
            {article.title}
          </h3>
          <p
            className="font-mono text-[11px] font-light mt-0.5 truncate"
            style={{ color: "var(--mk-text-muted)" }}
          >
            {article.description}
          </p>
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="shrink-0"
        >
          <ChevronRight
            size={16}
            className="transition-colors duration-200"
            style={{
              color: isExpanded
                ? "var(--mk-accent)"
                : "rgba(244, 240, 232, 0.15)",
            }}
          />
        </motion.div>
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-6">
              {/* Divider */}
              <div
                className="border-t"
                style={{
                  borderColor: "rgba(184, 151, 58, 0.1)",
                }}
              />

              {/* Content */}
              <p
                className="font-mono text-[13px] font-light leading-[1.85]"
                style={{ color: "var(--mk-text-secondary)" }}
              >
                {article.content}
              </p>

              {/* Steps */}
              {article.steps && article.steps.length > 0 && (
                <div>
                  <h4
                    className="font-ui text-[9px] font-bold tracking-[0.2em] uppercase mb-4"
                    style={{ color: "var(--mk-text-muted)" }}
                  >
                    {stepsLabel}
                  </h4>
                  <ol className="space-y-0 relative">
                    {/* Vertical line */}
                    <div
                      className="absolute left-[11px] top-3 bottom-3 w-px"
                      style={{
                        background:
                          "linear-gradient(to bottom, rgba(184,151,58,0.2), rgba(184,151,58,0.05))",
                      }}
                    />
                    {article.steps.map((step, i) => (
                      <li
                        key={i}
                        className="flex gap-4 py-2.5 relative"
                      >
                        <span
                          className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] font-medium relative z-[1]"
                          style={{
                            background: "rgba(184, 151, 58, 0.12)",
                            color: "var(--mk-accent)",
                            border:
                              "1px solid rgba(184, 151, 58, 0.25)",
                          }}
                        >
                          {i + 1}
                        </span>
                        <span
                          className="font-mono text-[12px] font-light leading-[1.75] pt-[2px]"
                          style={{
                            color: "var(--mk-text-secondary)",
                          }}
                        >
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Tips */}
              {article.tips && article.tips.length > 0 && (
                <div>
                  <h4
                    className="font-ui text-[9px] font-bold tracking-[0.2em] uppercase mb-3"
                    style={{ color: "var(--mk-text-muted)" }}
                  >
                    {tipsLabel}
                  </h4>
                  <div className="space-y-2.5">
                    {article.tips.map((tip, i) => (
                      <div
                        key={i}
                        className="flex gap-3 rounded-[0.875rem] px-4 py-3.5"
                        style={{
                          background: "rgba(184, 151, 58, 0.06)",
                          border:
                            "1px solid rgba(184, 151, 58, 0.12)",
                        }}
                      >
                        <Lightbulb
                          size={15}
                          className="shrink-0 mt-0.5"
                          style={{
                            color: "var(--mk-accent)",
                          }}
                        />
                        <p
                          className="font-mono text-[12px] font-light leading-[1.75]"
                          style={{
                            color: "var(--mk-text-secondary)",
                          }}
                        >
                          {tip}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
