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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";

const tipoIcons: Record<string, typeof FileText> = {
  brochure: BookOpen,
  ficha_tecnica: FileText,
  acabados: Palette,
  precios: DollarSign,
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
    otro: t("recursos.types.otro"),
  };

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingBrochure, setSavingBrochure] = useState(false);

  const handleBrochureUpload = async (url: string) => {
    setSavingBrochure(true);
    try {
      const ok = await save({ brochure_url: url });
      if (!ok) toast.error(t("recursos.saveError"));
    } finally {
      setSavingBrochure(false);
    }
  };

  const handleBrochureRemove = async () => {
    if (!(await confirm({ title: t("recursos.deleteTitle"), message: t("recursos.deleteConfirm") }))) return;
    setSavingBrochure(true);
    try {
      const ok = await save({ brochure_url: null });
      if (!ok) toast.error(t("recursos.saveError"));
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
    setSaving(true);
    const payload = {
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      tipo: form.tipo,
      url: form.url,
    };
    try {
      if (editingId) {
        const res = await fetch(`/api/recursos/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          toast.error(t("recursos.saveError"));
          return;
        }
      } else {
        const res = await fetch("/api/recursos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, proyecto_id: projectId }),
        });
        if (!res.ok) {
          toast.error(t("recursos.createResourceError"));
          return;
        }
      }
      await refresh();
      cancel();
    } catch {
      toast.error(t("errors.connectionError"));
    } finally {
      setSaving(false);
    }
  };

  const deleteRecursoAction = useAsyncAction(async (id: string) => {
    if (!(await confirm({ title: t("recursos.deleteTitle"), message: t("recursos.deleteConfirm") }))) return;

    // Optimistic: remove from UI immediately
    const prev = project.recursos;
    updateLocal((p) => ({
      ...p,
      recursos: p.recursos.filter((r) => r.id !== id),
    }));

    try {
      const res = await fetch(`/api/recursos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        // Rollback on failure
        updateLocal((p) => ({ ...p, recursos: prev }));
        toast.error(t("recursos.deleteResourceError"));
      }
    } catch {
      // Rollback on network error
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
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[rgba(var(--site-primary-rgb),0.12)] flex items-center justify-center">
            <BookOpen size={18} className="text-[var(--site-primary)]" />
          </div>
          <div>
            <h3 className={sectionTitle + " !mb-0"}>Brochure Principal</h3>
            <p className="text-xs text-[var(--text-tertiary)]">
              PDF principal que se muestra en la sección de brochure del micrositio
            </p>
          </div>
        </div>

        {project.brochure_url ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]">
              <FileText size={16} className="text-[var(--site-primary)] shrink-0" />
              <span className="text-sm text-[var(--text-secondary)] truncate font-mono">
                {project.brochure_url.split("/").pop()}
              </span>
              <a
                href={project.brochure_url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-xs text-[var(--text-tertiary)] hover:text-white transition-colors shrink-0"
              >
                <Download size={14} />
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
            label="Subir brochure PDF"
          />
        )}

        {savingBrochure && (
          <div className="flex items-center gap-2 mt-3 text-xs text-[var(--text-tertiary)]">
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
            <div className={sectionCard + " space-y-4"}>
              <h3 className={sectionTitle}>
                {editingId ? t("recursos.editResource") : t("recursos.newResource")}
              </h3>

              <div className="grid grid-cols-2 gap-4">
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
                    options={[
                      { value: "brochure", label: t("recursos.types.brochure") },
                      { value: "ficha_tecnica", label: t("recursos.types.ficha_tecnica") },
                      { value: "acabados", label: t("recursos.types.acabados") },
                      { value: "precios", label: t("recursos.types.lista_precios") },
                      { value: "otro", label: t("recursos.types.otro") },
                    ]}
                  />
                </div>
              </div>

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

              <div>
                <label className={labelClass}>{t("recursos.fileRequired")}</label>
                <FileUploader
                  currentUrl={form.url || null}
                  onUpload={(url) => setForm((p) => ({ ...p, url }))}
                  accept="application/pdf,image/*"
                  folder={`proyectos/${projectId}/recursos`}
                  label={t("recursos.uploadFile")}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !form.nombre.trim() || !form.url}
                  className={btnPrimary}
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  {editingId ? t("recursos.update") : t("recursos.create")}
                </button>
                <button onClick={cancel} className={btnSecondary}>
                  <X size={14} />
                  {t("recursos.cancel")}
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
        <div className="space-y-3">
          {project.recursos.map((r) => {
            const Icon = tipoIcons[r.tipo] || File;
            return (
              <div key={r.id} className={listItem}>
                <div className="w-10 h-10 rounded-lg bg-[rgba(var(--site-primary-rgb),0.1)] flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-[var(--site-primary)]" />
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
