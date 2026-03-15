"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, FolderOpen, MessageSquare, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchResult {
  users: Array<{ id: string; email: string; last_sign_in_at: string | null }>;
  projects: Array<{
    id: string;
    nombre: string;
    slug: string;
    estado: string;
    render_principal_url: string | null;
  }>;
  leads: Array<{
    id: string;
    nombre: string;
    email: string;
    proyecto_id: string;
    proyectos: { nombre: string } | null;
  }>;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Keyboard handler para Cmd/Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Focus input al abrir
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults(null);
      setSelectedIndex(0);
    }
  }, [open]);

  // Fetch results
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          setResults(await res.json());
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce

    return () => clearTimeout(timer);
  }, [query]);

  // Calcular total de resultados
  const allResults = results
    ? [
        ...(results.users || []).map((u) => ({ type: "user" as const, ...u })),
        ...(results.projects || []).map((p) => ({ type: "project" as const, ...p })),
        ...(results.leads || []).map((l) => ({ type: "lead" as const, ...l })),
      ]
    : [];

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % allResults.length);
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allResults.length) % allResults.length);
      }
      if (e.key === "Enter" && allResults[selectedIndex]) {
        e.preventDefault();
        handleSelect(allResults[selectedIndex]);
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, allResults, selectedIndex]);

  const handleSelect = (item: (typeof allResults)[0]) => {
    if (item.type === "user") {
      router.push(`/admin/usuarios?user=${item.id}`);
    } else if (item.type === "project") {
      router.push(`/editor/${item.id}`);
    } else if (item.type === "lead") {
      router.push(`/admin/leads?lead=${item.id}`);
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-start justify-center pt-[15vh] p-4"
        onClick={() => setOpen(false)}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl shadow-[var(--shadow-xl)] overflow-hidden"
        >
          {/* Search input */}
          <div className="flex items-center gap-3 p-4 border-b border-[var(--border-subtle)]">
            <Search size={18} className="text-[var(--text-muted)] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar usuarios, proyectos, leads..."
              className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
            />
            {loading && <Loader2 size={16} className="animate-spin text-[var(--site-primary)]" />}
            <button
              onClick={() => setOpen(false)}
              className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {query.length < 2 && (
              <div className="p-8 text-center text-[var(--text-muted)] text-sm">
                <Search size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs">Escribe al menos 2 caracteres para buscar</p>
                <p className="text-[10px] mt-2 text-[var(--text-muted)]">
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-3)] border border-[var(--border-subtle)] font-mono text-[9px]">
                    ↑
                  </kbd>{" "}
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-3)] border border-[var(--border-subtle)] font-mono text-[9px]">
                    ↓
                  </kbd>{" "}
                  para navegar •{" "}
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-3)] border border-[var(--border-subtle)] font-mono text-[9px]">
                    Enter
                  </kbd>{" "}
                  para seleccionar •{" "}
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-3)] border border-[var(--border-subtle)] font-mono text-[9px]">
                    Esc
                  </kbd>{" "}
                  para cerrar
                </p>
              </div>
            )}

            {query.length >= 2 && !loading && allResults.length === 0 && (
              <div className="p-8 text-center text-[var(--text-tertiary)] text-sm">
                <Search size={24} className="mx-auto mb-2 opacity-30" />
                <p>No se encontraron resultados para &quot;{query}&quot;</p>
              </div>
            )}

            {allResults.length > 0 && (
              <div className="py-2">
                {/* Users */}
                {results?.users && results.users.length > 0 && (
                  <div className="mb-2">
                    <div className="px-4 py-1.5 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Usuarios ({results.users.length})
                    </div>
                    {results.users.map((user, i) => {
                      const index = allResults.findIndex((r) => r.type === "user" && r.id === user.id);
                      return (
                        <button
                          key={user.id}
                          onClick={() => handleSelect({ type: "user", ...user })}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            selectedIndex === index
                              ? "bg-[var(--surface-2)]"
                              : "hover:bg-[var(--surface-2)]/50"
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-[var(--surface-3)] flex items-center justify-center shrink-0">
                            <User size={14} className="text-[var(--site-primary)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-[var(--text-primary)] truncate">{user.email}</div>
                            {user.last_sign_in_at && (
                              <div className="text-[10px] text-[var(--text-muted)]">
                                Último acceso:{" "}
                                {new Date(user.last_sign_in_at).toLocaleDateString("es-CO", {
                                  day: "2-digit",
                                  month: "short",
                                })}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Projects */}
                {results?.projects && results.projects.length > 0 && (
                  <div className="mb-2">
                    <div className="px-4 py-1.5 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Proyectos ({results.projects.length})
                    </div>
                    {results.projects.map((project) => {
                      const index = allResults.findIndex((r) => r.type === "project" && r.id === project.id);
                      return (
                        <button
                          key={project.id}
                          onClick={() => handleSelect({ type: "project", ...project })}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            selectedIndex === index
                              ? "bg-[var(--surface-2)]"
                              : "hover:bg-[var(--surface-2)]/50"
                          }`}
                        >
                          {project.render_principal_url ? (
                            <img
                              src={project.render_principal_url}
                              alt={project.nombre}
                              className="w-8 h-8 rounded object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-[var(--surface-3)] flex items-center justify-center shrink-0">
                              <FolderOpen size={14} className="text-[var(--site-primary)]" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-[var(--text-primary)] truncate">{project.nombre}</div>
                            <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-2">
                              <span className="truncate">/{project.slug}</span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[8px] font-ui font-bold uppercase tracking-wider ${
                                  project.estado === "publicado"
                                    ? "text-green-400 bg-green-500/15"
                                    : project.estado === "borrador"
                                      ? "text-yellow-400 bg-yellow-500/15"
                                      : "text-neutral-400 bg-neutral-500/15"
                                }`}
                              >
                                {project.estado}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Leads */}
                {results?.leads && results.leads.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Leads ({results.leads.length})
                    </div>
                    {results.leads.map((lead) => {
                      const index = allResults.findIndex((r) => r.type === "lead" && r.id === lead.id);
                      return (
                        <button
                          key={lead.id}
                          onClick={() => handleSelect({ type: "lead", ...lead })}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            selectedIndex === index
                              ? "bg-[var(--surface-2)]"
                              : "hover:bg-[var(--surface-2)]/50"
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-[var(--surface-3)] flex items-center justify-center shrink-0">
                            <MessageSquare size={14} className="text-[var(--site-primary)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-[var(--text-primary)] truncate">{lead.nombre}</div>
                            <div className="text-[10px] text-[var(--text-muted)] truncate">
                              {lead.email} • {lead.proyectos?.nombre || "Proyecto desconocido"}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
