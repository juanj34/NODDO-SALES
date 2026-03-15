"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, BookOpen, Menu } from "lucide-react";
import {
  FolderOpen,
  Users,
  Mail,
  Settings2,
  Building2,
  Layers,
  Package,
  Grid3X3,
  Map as MapIcon,
  Image as ImageIcon,
  Film,
  MapPin,
  FileText,
  HardHat,
  Globe,
  Rocket,
  Save,
  Sparkles,
  Upload,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { HelpSidebar } from "@/components/help/HelpSidebar";
import {
  HelpCategorySection,
  type HelpCategoryData,
  type HelpArticleData,
} from "@/components/help/HelpCategorySection";
import type { LucideIcon } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";

/* ─── Article ID → icon mapping ─── */
const iconMap: Record<string, LucideIcon> = {
  proyectos: FolderOpen,
  equipo: Users,
  leads: Mail,
  general: Settings2,
  torres: Building2,
  tipologias: Layers,
  inventario: Package,
  fachadas: Grid3X3,
  planos: MapIcon,
  galeria: ImageIcon,
  videos: Film,
  ubicacion: MapPin,
  recursos: FileText,
  avances: HardHat,
  config: Settings2,
  dominio: Globe,
  publicacion: Rocket,
  autoguardado: Save,
  iaCreacion: Sparkles,
  archivos: Upload,
};

/* ─── Category → article IDs structure ─── */
const categoryStructure = [
  { id: "dashboard", articleIds: ["proyectos", "equipo", "leads"] },
  { id: "proyecto", articleIds: ["general", "torres"] },
  {
    id: "contenido",
    articleIds: [
      "tipologias",
      "inventario",
      "fachadas",
      "planos",
      "galeria",
      "videos",
      "ubicacion",
      "recursos",
      "avances",
    ],
  },
  { id: "ajustes", articleIds: ["config", "dominio"] },
  {
    id: "flujos",
    articleIds: ["publicacion", "autoguardado", "iaCreacion", "archivos"],
  },
] as const;

interface ArticleTranslation {
  title: string;
  description: string;
  content: string;
  steps?: readonly string[];
  tips?: readonly string[];
}

/* ─── Strip accents for search ─── */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function AyudaPage() {
  const { dictionary } = useLanguage();
  const helpDict = dictionary.help as unknown as {
    page: Record<string, string>;
    categories: Record<string, string>;
    articles: Record<string, ArticleTranslation>;
  };

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [showCategories, setShowCategories] = useState(false);

  /* ─── Build structured data from translations ─── */
  const allCategories: HelpCategoryData[] = useMemo(() => {
    return categoryStructure.map((cat) => ({
      id: cat.id,
      label: helpDict.categories[cat.id] || cat.id,
      articles: cat.articleIds.map((artId): HelpArticleData => {
        const art = helpDict.articles[artId];
        return {
          id: artId,
          title: art?.title || artId,
          description: art?.description || "",
          content: art?.content || "",
          steps: art?.steps,
          tips: art?.tips,
          icon: iconMap[artId] || BookOpen,
        };
      }),
    }));
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
      }))
      .filter((cat) => cat.articles.length > 0);
  }, [search, allCategories]);

  /* ─── Hash navigation on mount ─── */
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      // Use requestAnimationFrame to avoid setState in effect warning
      requestAnimationFrame(() => {
        setExpandedArticle(hash);
        setTimeout(() => {
          document
            .getElementById(`help-${hash}`)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
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

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-4">
        <a
          href="/dashboard"
          className="hover:text-[var(--site-primary)] transition-colors"
        >
          Dashboard
        </a>
        <span>/</span>
        <span className="text-[var(--text-secondary)]">Ayuda</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <h1 className="font-heading text-[32px] font-light text-[var(--text-primary)]">
          {helpDict.page.title}
        </h1>
        <p className="text-[var(--text-tertiary)] text-[13px] mt-2 leading-relaxed max-w-2xl">
          {helpDict.page.description}
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-8">
        <label htmlFor="search-help" className="block text-[10px] tracking-[0.12em] uppercase text-[var(--text-muted)] mb-1.5 font-ui font-bold">
          Buscar en ayuda
        </label>
        <Search
          size={15}
          className="absolute left-3.5 bottom-1/2 translate-y-1/2 text-[var(--text-muted)]"
        />
        <input
          id="search-help"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={helpDict.page.searchPlaceholder}
          className="w-full bg-[var(--surface-2)] border border-[var(--border-default)] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)] focus:shadow-[0_0_0_3px_rgba(var(--site-primary-rgb),0.10)] transition-all"
        />
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar — hidden on mobile */}
        <HelpSidebar
          categories={filteredCategories}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />

        {/* Articles */}
        <div className="flex-1 min-w-0 space-y-10">
          {filteredCategories.map((category) => (
            <HelpCategorySection
              key={category.id}
              category={category}
              expandedArticle={expandedArticle}
              onToggleArticle={handleToggleArticle}
            />
          ))}
          {filteredCategories.length === 0 && (
            <div className="text-center py-20">
              <Search
                size={32}
                className="mx-auto mb-3 text-[var(--text-muted)]"
              />
              <p className="text-xs text-[var(--text-tertiary)]">
                {helpDict.page.noResults}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile FAB for categories */}
      <button
        onClick={() => setShowCategories(true)}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-50 transition-transform hover:scale-105 active:scale-95"
        style={{
          background: "var(--site-primary)",
        }}
        aria-label="Abrir categorías"
      >
        <Menu size={20} className="text-[#141414]" />
      </button>

      {/* Mobile BottomSheet */}
      <BottomSheet
        isOpen={showCategories}
        onClose={() => setShowCategories(false)}
      >
        <div className="p-6">
          <h3 className="font-ui text-xs uppercase tracking-[0.12em] text-[var(--text-muted)] font-bold mb-4">
            Categorías
          </h3>
          <HelpSidebar
            categories={filteredCategories}
            activeCategory={activeCategory}
            onSelectCategory={(cat) => {
              setActiveCategory(cat);
              setShowCategories(false);
            }}
          />
        </div>
      </BottomSheet>
    </div>
  );
}
