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
  const { project, refresh, projectId } = useEditorProject();
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
          toast.error("Error al guardar recurso");
          return;
        }
      } else {
        const res = await fetch("/api/recursos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, proyecto_id: projectId }),
        });
        if (!res.ok) {
          toast.error("Error al crear recurso");
          return;
        }
      }
      await refresh();
      cancel();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const deleteRecursoAction = useAsyncAction(async (id: string) => {
    if (!(await confirm({ title: t("recursos.deleteTitle") || "Eliminar recurso", message: t("recursos.deleteConfirm") }))) return;
    try {
      const res = await fetch(`/api/recursos/${id}`, { method: "DELETE" });
      if (!res.ok) toast.error("Error al eliminar recurso");
      await refresh();
    } catch {
      toast.error("Error de conexión");
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
                  <select
                    value={form.tipo}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        tipo: e.target.value as Recurso["tipo"],
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="brochure">{t("recursos.types.brochure")}</option>
                    <option value="ficha_tecnica">{t("recursos.types.ficha_tecnica")}</option>
                    <option value="acabados">{t("recursos.types.acabados")}</option>
                    <option value="precios">{t("recursos.types.lista_precios")}</option>
                    <option value="otro">{t("recursos.types.otro")}</option>
                  </select>
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
