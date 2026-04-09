"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useTranslation } from "@/i18n";
import { useEditorProject } from "@/hooks/useEditorProject";
import { useConfirm } from "@/components/dashboard/ConfirmModal";
import { useToast } from "@/components/dashboard/Toast";
import { FileUploader } from "@/components/dashboard/FileUploader";
import {
  inputClass,
  labelClass,
  btnPrimary,
  btnSecondary,
  btnDanger,
  sectionCard,
  sectionTitle,
  listItem,
} from "@/components/dashboard/editor-styles";
import { PageHeader } from "@/components/dashboard/base/PageHeader";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import type { Recurso } from "@/types";
import {
  Plus,
  Loader2,
  Check,
  X,
  Pencil,
  Trash2,
  FileText,
  Download,
  BookOpen,
  Palette,
  DollarSign,
  File,
  Ruler,
  Image,
  BookMarked,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";

const tipoIcons: Record<string, typeof FileText> = {
  brochure: BookOpen,
  ficha_tecnica: FileText,
  acabados: Palette,
  precios: DollarSign,
  planos: Ruler,
  render: Image,
  manual: BookMarked,
  reglamento: ScrollText,
  garantias: ShieldCheck,
  otro: File,
};

const emptyForm = {
  nombre: "",
  descripcion: "",
  tipo: "otro" as Recurso["tipo"],
  url: "",
};

export default function RecursosPage() {
  const { project, refresh, save, updateLocal, projectId } = useEditorProject();
  const { t } = useTranslation("editor");
  const { confirm } = useConfirm();
  const toast = useToast();

  const tipoLabels: Record<string, string> = {
    brochure: t("recursos.types.brochure"),
    ficha_tecnica: t("recursos.types.ficha_tecnica"),
    acabados: t("recursos.types.acabados"),
    precios: t("recursos.types.lista_precios"),
    planos: t("recursos.types.planos"),
    render: t("recursos.types.render"),
    manual: t("recursos.types.manual"),
    reglamento: t("recursos.types.reglamento"),
    garantias: t("recursos.types.garantias"),
    otro: t("recursos.types.otro"),
  };

  const tipoOptions = Object.entries(tipoIcons).map(([value, Icon]) => ({
    value,
    label: tipoLabels[value] || value,
    icon: <Icon size={14} />,
  }));

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [savingBrochure, setSavingBrochure] = useState(false);

  const handleBrochureUpload = async (url: string) => {
    // Optimistic update
    const prev = project.brochure_url;
    updateLocal((p) => ({ ...p, brochure_url: url }));
    setSavingBrochure(true);
    try {
      const ok = await save({ brochure_url: url });
      if (!ok) {
        updateLocal((p) => ({ ...p, brochure_url: prev }));
        toast.error(t("recursos.saveError"));
      }
    } catch {
      updateLocal((p) => ({ ...p, brochure_url: prev }));
    } finally {
      setSavingBrochure(false);
    }
  };

  const handleBrochureRemove = async () => {
    if (!(await confirm({ title: t("recursos.deleteTitle"), message: t("recursos.deleteConfirm") }))) return;
    // Optimistic remove
    const prev = project.brochure_url;
    updateLocal((p) => ({ ...p, brochure_url: null }));
    setSavingBrochure(true);
    try {
      const ok = await save({ brochure_url: null });
      if (!ok) {
        updateLocal((p) => ({ ...p, brochure_url: prev }));
        toast.error(t("recursos.saveError"));
      }
    } catch {
      updateLocal((p) => ({ ...p, brochure_url: prev }));
    } finally {
      setSavingBrochure(false);
    }
  };

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (r: Recurso) => {
    setForm({
      nombre: r.nombre,
      descripcion: r.descripcion || "",
      tipo: r.tipo,
      url: r.url,
    });
    setEditingId(r.id);
    setShowForm(true);
  };

  const cancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    const payload = {
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      tipo: form.tipo,
      url: form.url,
    };

    const prevRecursos = project.recursos;

    if (editingId) {
      // Optimistic update for edit
      updateLocal((p) => ({
        ...p,
        recursos: p.recursos.map((r) =>
          r.id === editingId ? { ...r, ...payload } : r
        ),
      }));
      cancel();

      try {
        const res = await fetch(`/api/recursos/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          updateLocal((p) => ({ ...p, recursos: prevRecursos }));
          toast.error(t("recursos.saveError"));
        }
      } catch {
        updateLocal((p) => ({ ...p, recursos: prevRecursos }));
        toast.error(t("errors.connectionError"));
      }
    } else {
      // Optimistic create with temp ID
      const tempId = `temp-${Date.now()}`;
      const optimistic: Recurso = {
        id: tempId,
        proyecto_id: projectId,
        nombre: payload.nombre,
        descripcion: payload.descripcion,
        tipo: payload.tipo as Recurso["tipo"],
        url: payload.url,
        orden: project.recursos.length,
      };
      updateLocal((p) => ({
        ...p,
        recursos: [...p.recursos, optimistic],
      }));
      cancel();

      try {
        const res = await fetch("/api/recursos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, proyecto_id: projectId }),
        });
        if (!res.ok) {
          updateLocal((p) => ({ ...p, recursos: prevRecursos }));
          toast.error(t("recursos.createResourceError"));
        } else {
          // Replace temp ID with real one from server
          const created = await res.json();
          updateLocal((p) => ({
            ...p,
            recursos: p.recursos.map((r) =>
              r.id === tempId ? { ...r, id: created.id ?? r.id } : r
            ),
          }));
        }
      } catch {
        updateLocal((p) => ({ ...p, recursos: prevRecursos }));
        toast.error(t("errors.connectionError"));
      }
    }
  };

  const deleteRecursoAction = useAsyncAction(async (id: string) => {
    if (!(await confirm({ title: t("recursos.deleteTitle"), message: t("recursos.deleteConfirm") }))) return;

    const prev = project.recursos;
    updateLocal((p) => ({
      ...p,
      recursos: p.recursos.filter((r) => r.id !== id),
    }));

    try {
      const res = await fetch(`/api/recursos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        updateLocal((p) => ({ ...p, recursos: prev }));
        toast.error(t("recursos.deleteResourceError"));
      }
    } catch {
      updateLocal((p) => ({ ...p, recursos: prev }));
      toast.error(t("errors.connectionError"));
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* ── Page Header ──────────────────────────────────────────── */}
      <PageHeader
        icon={FileText}
        title={t("recursos.title")}
        description={t("recursos.description")}
        actions={
          !showForm ? (
            <button onClick={openNew} className={btnPrimary}>
              <Plus size={14} />
              {t("recursos.addResource")}
            </button>
          ) : undefined
        }
      />

      {/* ── Brochure Principal ────────────────────────────────────── */}
      <div className={sectionCard + " mb-6 border-[rgba(var(--site-primary-rgb),0.25)]"}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[rgba(var(--site-primary-rgb),0.12)] flex items-center justify-center shrink-0">
              <BookOpen size={16} className="text-[var(--site-primary)]" />
            </div>
            <div>
              <h3 className={sectionTitle + " !mb-0 text-sm"}>Brochure Principal</h3>
              <p className="text-[11px] text-[var(--text-tertiary)]">
                PDF principal del micrositio
              </p>
            </div>
          </div>

          {project.brochure_url ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]">
                <FileText size={14} className="text-[var(--site-primary)] shrink-0" />
                <span className="text-xs text-[var(--text-secondary)] font-mono max-w-[200px] truncate">
                  {project.brochure_url.split("/").pop()}
                </span>
                <a
                  href={project.brochure_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-tertiary)] hover:text-white transition-colors"
                >
                  <Download size={13} />
                </a>
              </div>
              <button
                onClick={handleBrochureRemove}
                disabled={savingBrochure}
                className={btnDanger}
              >
                {savingBrochure ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              </button>
            </div>
          ) : (
            <FileUploader
              currentUrl={null}
              onUpload={handleBrochureUpload}
              accept="application/pdf"
              folder={`proyectos/${projectId}/brochure`}
              label="Subir PDF"
              compact
            />
          )}
        </div>

        {savingBrochure && (
          <div className="flex items-center gap-2 mt-2 text-xs text-[var(--text-tertiary)]">
            <Loader2 size={12} className="animate-spin" />
            Guardando...
          </div>
        )}
      </div>

      {/* ── Form ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className={sectionCard + " space-y-3"}>
              <div className="flex items-center justify-between">
                <h3 className={sectionTitle + " !mb-0"}>
                  {editingId ? t("recursos.editResource") : t("recursos.newResource")}
                </h3>
                <button onClick={cancel} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Row 1: Name + Type */}
              <div className="grid grid-cols-[1fr_200px] gap-3">
                <div>
                  <label className={labelClass}>{t("recursos.nameRequired")}</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, nombre: e.target.value }))
                    }
                    placeholder={t("recursos.namePlaceholder")}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("recursos.type")}</label>
                  <NodDoDropdown
                    variant="form"
                    size="lg"
                    value={form.tipo}
                    onChange={(val) =>
                      setForm((p) => ({
                        ...p,
                        tipo: val as Recurso["tipo"],
                      }))
                    }
                    options={tipoOptions}
                  />
                </div>
              </div>

              {/* Row 2: Description */}
              <div>
                <label className={labelClass}>{t("recursos.description2")}</label>
                <input
                  type="text"
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, descripcion: e.target.value }))
                  }
                  placeholder={t("recursos.descriptionPlaceholder")}
                  className={inputClass}
                />
              </div>

              {/* Row 3: File upload (compact) + Actions */}
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className={labelClass}>{t("recursos.fileRequired")}</label>
                  {form.url ? (
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]">
                      <FileText size={14} className="text-[var(--site-primary)] shrink-0" />
                      <span className="text-xs text-[var(--text-secondary)] font-mono truncate">
                        {decodeURIComponent(form.url.split("/").pop()?.split("?")[0] || "")}
                      </span>
                      <button
                        onClick={() => setForm((p) => ({ ...p, url: "" }))}
                        className="ml-auto text-[var(--text-muted)] hover:text-red-400 transition-colors shrink-0"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <FileUploader
                      currentUrl={null}
                      onUpload={(url) => setForm((p) => ({ ...p, url }))}
                      accept="application/pdf,image/*"
                      folder={`proyectos/${projectId}/recursos`}
                      label={t("recursos.uploadFile")}
                      compact
                    />
                  )}
                </div>
                <button
                  onClick={handleSave}
                  disabled={!form.nombre.trim() || !form.url}
                  className={btnPrimary + " shrink-0"}
                >
                  <Check size={14} />
                  {editingId ? t("recursos.update") : t("recursos.create")}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty State ──────────────────────────────────────────── */}
      {project.recursos.length === 0 && !showForm && (
        <DashboardEmptyState
          variant="recursos"
          title={t("recursos.noResources")}
          description={t("recursos.noResourcesHint")}
        >
          <button onClick={openNew} className={btnPrimary}>
            <Plus size={14} />
            {t("recursos.addResource")}
          </button>
        </DashboardEmptyState>
      )}

      {/* ── Resource List ────────────────────────────────────────── */}
      {project.recursos.length > 0 && (
        <div className="space-y-2">
          {project.recursos.map((r) => {
            const Icon = tipoIcons[r.tipo] || File;
            return (
              <div key={r.id} className={listItem}>
                <div className="w-9 h-9 rounded-lg bg-[rgba(var(--site-primary-rgb),0.1)] flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-[var(--site-primary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm">{r.nombre}</h3>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {tipoLabels[r.tipo]}
                    {r.descripcion ? ` — ${r.descripcion}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-[var(--text-tertiary)] hover:text-white hover:bg-[var(--surface-2)] rounded-lg transition-colors"
                  >
                    <Download size={12} />
                    {t("recursos.view")}
                  </a>
                  <button
                    onClick={() => openEdit(r)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-[var(--text-tertiary)] hover:text-white hover:bg-[var(--surface-2)] rounded-lg transition-colors"
                  >
                    <Pencil size={12} />
                    {t("recursos.edit")}
                  </button>
                  <button
                    onClick={() => deleteRecursoAction.execute(r.id)}
                    disabled={deleteRecursoAction.loading}
                    className={btnDanger}
                  >
                    {deleteRecursoAction.loading ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
