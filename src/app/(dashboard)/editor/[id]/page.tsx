"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useProject } from "@/hooks/useProject";
import { FileUploader } from "@/components/dashboard/FileUploader";
import { cn } from "@/lib/utils";
import type { Tipologia, Video, GaleriaCategoria } from "@/types";
import {
  Save,
  Eye,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Film,
  MapPin,
  Settings,
  LayoutDashboard,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const tabs = [
  { id: "general", label: "General", icon: LayoutDashboard },
  { id: "tipologias", label: "Tipologias", icon: Layers },
  { id: "galeria", label: "Galeria", icon: ImageIcon },
  { id: "videos", label: "Videos", icon: Film },
  { id: "ubicacion", label: "Ubicacion", icon: MapPin },
  { id: "config", label: "Configuracion", icon: Settings },
];

const inputClass =
  "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A96E]/50 transition-colors";

const labelClass =
  "block text-xs text-white/50 mb-2 tracking-wider uppercase";

const btnPrimary =
  "flex items-center gap-1.5 px-4 py-2 bg-[#C9A96E] text-black rounded-lg text-xs font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed";

const btnSecondary =
  "flex items-center gap-1.5 px-4 py-2 border border-white/10 rounded-lg text-xs text-white/50 hover:text-white hover:border-white/20 transition-colors";

const btnDanger =
  "flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors";

// ---------------------------------------------------------------------------
// Empty tipologia form state
// ---------------------------------------------------------------------------
const emptyTipologia = {
  nombre: "",
  descripcion: "",
  area_m2: "",
  habitaciones: "",
  banos: "",
  precio_desde: "",
  plano_url: "",
  renders: [] as string[],
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { project, loading, saving, save, refresh } = useProject(id);

  const [activeTab, setActiveTab] = useState("general");

  // ---- General form state ----
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [constructoraNombre, setConstructoraNombre] = useState("");
  const [colorPrimario, setColorPrimario] = useState("#C9A96E");
  const [colorSecundario, setColorSecundario] = useState("#1a1a2e");
  const [colorFondo, setColorFondo] = useState("#0f0f0f");
  const [estado, setEstado] = useState<"borrador" | "publicado" | "archivado">(
    "borrador"
  );
  const [disclaimer, setDisclaimer] = useState("");
  const [renderPrincipalUrl, setRenderPrincipalUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // ---- Ubicacion form state ----
  const [ubicacionDireccion, setUbicacionDireccion] = useState("");
  const [ubicacionLat, setUbicacionLat] = useState("");
  const [ubicacionLng, setUbicacionLng] = useState("");

  // ---- Config form state ----
  const [whatsappNumero, setWhatsappNumero] = useState("");
  const [tour360Url, setTour360Url] = useState("");
  const [brochureUrl, setBrochureUrl] = useState("");

  // ---- Tipologias state ----
  const [tipoForm, setTipoForm] = useState(emptyTipologia);
  const [editingTipoId, setEditingTipoId] = useState<string | null>(null);
  const [showTipoForm, setShowTipoForm] = useState(false);
  const [tipoSaving, setTipoSaving] = useState(false);

  // ---- Videos state ----
  const [videoForm, setVideoForm] = useState({ titulo: "", url: "" });
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [videoSaving, setVideoSaving] = useState(false);

  // ---- Galeria state ----
  const [newCatNombre, setNewCatNombre] = useState("");
  const [showCatForm, setShowCatForm] = useState(false);
  const [galeriaSaving, setGaleriaSaving] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  // ---- Sync project data into form state when loaded ----
  useEffect(() => {
    if (!project) return;
    setNombre(project.nombre || "");
    setSlug(project.slug || "");
    setDescripcion(project.descripcion || "");
    setConstructoraNombre(project.constructora_nombre || "");
    setColorPrimario(project.color_primario || "#C9A96E");
    setColorSecundario(project.color_secundario || "#1a1a2e");
    setColorFondo(project.color_fondo || "#0f0f0f");
    setEstado(project.estado || "borrador");
    setDisclaimer(project.disclaimer || "");
    setRenderPrincipalUrl(project.render_principal_url || "");
    setLogoUrl(project.logo_url || "");
    setUbicacionDireccion(project.ubicacion_direccion || "");
    setUbicacionLat(
      project.ubicacion_lat != null ? String(project.ubicacion_lat) : ""
    );
    setUbicacionLng(
      project.ubicacion_lng != null ? String(project.ubicacion_lng) : ""
    );
    setWhatsappNumero(project.whatsapp_numero || "");
    setTour360Url(project.tour_360_url || "");
    setBrochureUrl(project.brochure_url || "");
  }, [project]);

  // ---- Save handlers ----
  const handleSaveGeneral = async () => {
    await save({
      nombre,
      slug,
      descripcion: descripcion || null,
      constructora_nombre: constructoraNombre || null,
      color_primario: colorPrimario,
      color_secundario: colorSecundario,
      color_fondo: colorFondo,
      estado,
      disclaimer,
      render_principal_url: renderPrincipalUrl || null,
      logo_url: logoUrl || null,
    });
  };

  const handleSaveUbicacion = async () => {
    await save({
      ubicacion_direccion: ubicacionDireccion || null,
      ubicacion_lat: ubicacionLat ? parseFloat(ubicacionLat) : null,
      ubicacion_lng: ubicacionLng ? parseFloat(ubicacionLng) : null,
    });
  };

  const handleSaveConfig = async () => {
    await save({
      whatsapp_numero: whatsappNumero || null,
      tour_360_url: tour360Url || null,
      brochure_url: brochureUrl || null,
    });
  };

  // ---- Tipologia CRUD ----
  const openNewTipo = () => {
    setTipoForm(emptyTipologia);
    setEditingTipoId(null);
    setShowTipoForm(true);
  };

  const openEditTipo = (tipo: Tipologia) => {
    setTipoForm({
      nombre: tipo.nombre || "",
      descripcion: tipo.descripcion || "",
      area_m2: tipo.area_m2 != null ? String(tipo.area_m2) : "",
      habitaciones: tipo.habitaciones != null ? String(tipo.habitaciones) : "",
      banos: tipo.banos != null ? String(tipo.banos) : "",
      precio_desde: tipo.precio_desde != null ? String(tipo.precio_desde) : "",
      plano_url: tipo.plano_url || "",
      renders: tipo.renders || [],
    });
    setEditingTipoId(tipo.id);
    setShowTipoForm(true);
  };

  const cancelTipoForm = () => {
    setShowTipoForm(false);
    setEditingTipoId(null);
    setTipoForm(emptyTipologia);
  };

  const saveTipologia = async () => {
    setTipoSaving(true);
    const payload = {
      nombre: tipoForm.nombre,
      descripcion: tipoForm.descripcion || null,
      area_m2: tipoForm.area_m2 ? parseFloat(tipoForm.area_m2) : null,
      habitaciones: tipoForm.habitaciones
        ? parseInt(tipoForm.habitaciones)
        : null,
      banos: tipoForm.banos ? parseInt(tipoForm.banos) : null,
      precio_desde: tipoForm.precio_desde
        ? parseFloat(tipoForm.precio_desde)
        : null,
      plano_url: tipoForm.plano_url || null,
      renders: tipoForm.renders,
    };

    try {
      if (editingTipoId) {
        await fetch(`/api/tipologias/${editingTipoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/tipologias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, proyecto_id: id }),
        });
      }
      await refresh();
      cancelTipoForm();
    } catch {
      // silent
    } finally {
      setTipoSaving(false);
    }
  };

  const deleteTipologia = async (tipoId: string) => {
    if (!confirm("Eliminar esta tipologia?")) return;
    try {
      await fetch(`/api/tipologias/${tipoId}`, { method: "DELETE" });
      await refresh();
    } catch {
      // silent
    }
  };

  // ---- Video CRUD ----
  const openNewVideo = () => {
    setVideoForm({ titulo: "", url: "" });
    setEditingVideoId(null);
    setShowVideoForm(true);
  };

  const openEditVideo = (video: Video) => {
    setVideoForm({
      titulo: video.titulo || "",
      url: video.url || "",
    });
    setEditingVideoId(video.id);
    setShowVideoForm(true);
  };

  const cancelVideoForm = () => {
    setShowVideoForm(false);
    setEditingVideoId(null);
    setVideoForm({ titulo: "", url: "" });
  };

  const saveVideo = async () => {
    setVideoSaving(true);
    const payload = {
      titulo: videoForm.titulo || null,
      url: videoForm.url,
    };

    try {
      if (editingVideoId) {
        await fetch(`/api/videos/${editingVideoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/videos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, proyecto_id: id }),
        });
      }
      await refresh();
      cancelVideoForm();
    } catch {
      // silent
    } finally {
      setVideoSaving(false);
    }
  };

  const deleteVideo = async (videoId: string) => {
    if (!confirm("Eliminar este video?")) return;
    try {
      await fetch(`/api/videos/${videoId}`, { method: "DELETE" });
      await refresh();
    } catch {
      // silent
    }
  };

  // ---- Galeria CRUD ----
  const addCategoria = async () => {
    if (!newCatNombre.trim()) return;
    setGaleriaSaving(true);
    const catSlug = newCatNombre
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    try {
      await fetch("/api/galeria/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proyecto_id: id,
          nombre: newCatNombre.trim(),
          slug: catSlug,
        }),
      });
      await refresh();
      setNewCatNombre("");
      setShowCatForm(false);
    } catch {
      // silent
    } finally {
      setGaleriaSaving(false);
    }
  };

  const deleteCategoria = async (catId: string) => {
    if (!confirm("Eliminar esta categoria y todas sus imagenes?")) return;
    try {
      await fetch(`/api/galeria/categorias/${catId}`, { method: "DELETE" });
      await refresh();
    } catch {
      // silent
    }
  };

  const addImageToCategory = async (categoriaId: string, url: string) => {
    if (!url) return;
    setGaleriaSaving(true);
    try {
      await fetch("/api/galeria/imagenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoria_id: categoriaId, url }),
      });
      await refresh();
    } catch {
      // silent
    } finally {
      setGaleriaSaving(false);
    }
  };

  const deleteImage = async (imgId: string) => {
    try {
      await fetch(`/api/galeria/imagenes/${imgId}`, { method: "DELETE" });
      await refresh();
    } catch {
      // silent
    }
  };

  // ---- Render helpers ----
  const addRenderUrl = (url: string) => {
    if (!url) return;
    setTipoForm((prev) => ({ ...prev, renders: [...prev.renders, url] }));
  };

  const removeRenderUrl = (index: number) => {
    setTipoForm((prev) => ({
      ...prev,
      renders: prev.renders.filter((_, i) => i !== index),
    }));
  };

  // ---- Loading state ----
  if (loading || !project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 size={32} className="animate-spin text-[#C9A96E]" />
          <p className="text-white/30 text-sm">Cargando proyecto...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* ================================================================ */}
      {/* Top bar                                                          */}
      {/* ================================================================ */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-white/5">
        <div>
          <h1 className="text-lg font-light tracking-wider">{nombre || project.nombre}</h1>
          <p className="text-white/30 text-xs">/{slug || project.slug}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/sites/${project.slug}`}
            target="_blank"
            className={btnSecondary}
          >
            <Eye size={14} />
            Preview
          </Link>
          {(activeTab === "general" ||
            activeTab === "ubicacion" ||
            activeTab === "config") && (
            <button
              onClick={
                activeTab === "general"
                  ? handleSaveGeneral
                  : activeTab === "ubicacion"
                  ? handleSaveUbicacion
                  : handleSaveConfig
              }
              disabled={saving}
              className={btnPrimary}
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              {saving ? "Guardando..." : "Guardar"}
            </button>
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* Tabs                                                             */}
      {/* ================================================================ */}
      <div className="flex px-8 border-b border-white/5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-3 text-sm border-b-2 transition-all flex items-center gap-2",
              activeTab === tab.id
                ? "border-[#C9A96E] text-white"
                : "border-transparent text-white/40 hover:text-white/70"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ================================================================ */}
      {/* Content                                                          */}
      {/* ================================================================ */}
      <div className="flex-1 overflow-y-auto p-8">
        {/* -------------------------------------------------------------- */}
        {/* GENERAL TAB                                                     */}
        {/* -------------------------------------------------------------- */}
        {activeTab === "general" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl space-y-6"
          >
            {/* Nombre */}
            <div>
              <label className={labelClass}>Nombre del proyecto</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Slug */}
            <div>
              <label className={labelClass}>Slug (URL)</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Descripcion */}
            <div>
              <label className={labelClass}>Descripcion</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                className={inputClass + " resize-none"}
              />
            </div>

            {/* Constructora */}
            <div>
              <label className={labelClass}>Constructora</label>
              <input
                type="text"
                value={constructoraNombre}
                onChange={(e) => setConstructoraNombre(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Colores */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Color primario</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colorPrimario}
                    onChange={(e) => setColorPrimario(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-white/10"
                  />
                  <input
                    type="text"
                    value={colorPrimario}
                    onChange={(e) => setColorPrimario(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Color secundario</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colorSecundario}
                    onChange={(e) => setColorSecundario(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-white/10"
                  />
                  <input
                    type="text"
                    value={colorSecundario}
                    onChange={(e) => setColorSecundario(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Color fondo</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colorFondo}
                    onChange={(e) => setColorFondo(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-white/10"
                  />
                  <input
                    type="text"
                    value={colorFondo}
                    onChange={(e) => setColorFondo(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Estado */}
            <div>
              <label className={labelClass}>Estado</label>
              <select
                value={estado}
                onChange={(e) =>
                  setEstado(
                    e.target.value as "borrador" | "publicado" | "archivado"
                  )
                }
                className={inputClass}
              >
                <option value="borrador">Borrador</option>
                <option value="publicado">Publicado</option>
                <option value="archivado">Archivado</option>
              </select>
            </div>

            {/* Disclaimer */}
            <div>
              <label className={labelClass}>Disclaimer legal</label>
              <textarea
                value={disclaimer}
                onChange={(e) => setDisclaimer(e.target.value)}
                rows={2}
                className={inputClass + " resize-none"}
              />
            </div>

            {/* Render principal */}
            <div>
              <label className={labelClass}>Render principal</label>
              <FileUploader
                currentUrl={renderPrincipalUrl || null}
                onUpload={(url) => setRenderPrincipalUrl(url)}
                folder={`proyectos/${id}`}
                label="Subir render principal"
              />
            </div>

            {/* Logo */}
            <div>
              <label className={labelClass}>Logo</label>
              <div className="max-w-[200px]">
                <FileUploader
                  currentUrl={logoUrl || null}
                  onUpload={(url) => setLogoUrl(url)}
                  folder={`proyectos/${id}`}
                  label="Subir logo"
                  aspect="square"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* -------------------------------------------------------------- */}
        {/* TIPOLOGIAS TAB                                                  */}
        {/* -------------------------------------------------------------- */}
        {activeTab === "tipologias" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-light">Tipologias</h2>
              {!showTipoForm && (
                <button onClick={openNewTipo} className={btnPrimary}>
                  <Plus size={14} />
                  Agregar Tipologia
                </button>
              )}
            </div>

            {/* Inline form */}
            <AnimatePresence>
              {showTipoForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-6 bg-white/5 rounded-lg border border-white/10 space-y-4 overflow-hidden"
                >
                  <h3 className="text-sm font-medium text-white/70">
                    {editingTipoId ? "Editar tipologia" : "Nueva tipologia"}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Nombre *</label>
                      <input
                        type="text"
                        value={tipoForm.nombre}
                        onChange={(e) =>
                          setTipoForm((p) => ({
                            ...p,
                            nombre: e.target.value,
                          }))
                        }
                        placeholder="Ej: Apartamento Tipo A"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Area (m2)</label>
                      <input
                        type="number"
                        value={tipoForm.area_m2}
                        onChange={(e) =>
                          setTipoForm((p) => ({
                            ...p,
                            area_m2: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Descripcion</label>
                    <textarea
                      value={tipoForm.descripcion}
                      onChange={(e) =>
                        setTipoForm((p) => ({
                          ...p,
                          descripcion: e.target.value,
                        }))
                      }
                      rows={2}
                      className={inputClass + " resize-none"}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Habitaciones</label>
                      <input
                        type="number"
                        value={tipoForm.habitaciones}
                        onChange={(e) =>
                          setTipoForm((p) => ({
                            ...p,
                            habitaciones: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Banos</label>
                      <input
                        type="number"
                        value={tipoForm.banos}
                        onChange={(e) =>
                          setTipoForm((p) => ({
                            ...p,
                            banos: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Precio desde</label>
                      <input
                        type="number"
                        value={tipoForm.precio_desde}
                        onChange={(e) =>
                          setTipoForm((p) => ({
                            ...p,
                            precio_desde: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Plano */}
                  <div>
                    <label className={labelClass}>Plano</label>
                    <FileUploader
                      currentUrl={tipoForm.plano_url || null}
                      onUpload={(url) =>
                        setTipoForm((p) => ({ ...p, plano_url: url }))
                      }
                      folder={`proyectos/${id}/tipologias`}
                      label="Subir plano"
                    />
                  </div>

                  {/* Renders */}
                  <div>
                    <label className={labelClass}>Renders</label>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {tipoForm.renders.map((r, i) => (
                        <div
                          key={i}
                          className="relative aspect-video rounded overflow-hidden bg-white/5"
                        >
                          <img
                            src={r}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removeRenderUrl(i)}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white/60 hover:text-white"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      <FileUploader
                        onUpload={addRenderUrl}
                        folder={`proyectos/${id}/tipologias`}
                        label="+ Render"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={saveTipologia}
                      disabled={tipoSaving || !tipoForm.nombre.trim()}
                      className={btnPrimary}
                    >
                      {tipoSaving ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                      {editingTipoId ? "Actualizar" : "Crear"}
                    </button>
                    <button onClick={cancelTipoForm} className={btnSecondary}>
                      <X size={14} />
                      Cancelar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* List */}
            <div className="space-y-3">
              {project.tipologias.length === 0 && !showTipoForm && (
                <p className="text-white/20 text-sm text-center py-12">
                  No hay tipologias. Agrega la primera.
                </p>
              )}
              {project.tipologias.map((tipo) => (
                <div
                  key={tipo.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5 group"
                >
                  <div>
                    <h3 className="text-sm font-medium">{tipo.nombre}</h3>
                    <p className="text-xs text-white/30">
                      {tipo.area_m2 ? `${tipo.area_m2} m2` : "--"} &bull;{" "}
                      {tipo.habitaciones ?? "--"} hab &bull;{" "}
                      {tipo.banos ?? "--"} banos
                      {tipo.precio_desde
                        ? ` &bull; Desde $${tipo.precio_desde.toLocaleString()}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditTipo(tipo)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Pencil size={12} />
                      Editar
                    </button>
                    <button
                      onClick={() => deleteTipologia(tipo.id)}
                      className={btnDanger}
                    >
                      <Trash2 size={12} />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* -------------------------------------------------------------- */}
        {/* GALERIA TAB                                                     */}
        {/* -------------------------------------------------------------- */}
        {activeTab === "galeria" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-light">Categorias de Galeria</h2>
              {!showCatForm && (
                <button
                  onClick={() => setShowCatForm(true)}
                  className={btnPrimary}
                >
                  <Plus size={14} />
                  Agregar Categoria
                </button>
              )}
            </div>

            {/* New category form */}
            <AnimatePresence>
              {showCatForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10 overflow-hidden"
                >
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className={labelClass}>Nombre de la categoria</label>
                      <input
                        type="text"
                        value={newCatNombre}
                        onChange={(e) => setNewCatNombre(e.target.value)}
                        placeholder="Ej: Exteriores, Interiores, Amenidades..."
                        className={inputClass}
                      />
                    </div>
                    <button
                      onClick={addCategoria}
                      disabled={galeriaSaving || !newCatNombre.trim()}
                      className={btnPrimary}
                    >
                      {galeriaSaving ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                      Crear
                    </button>
                    <button
                      onClick={() => {
                        setShowCatForm(false);
                        setNewCatNombre("");
                      }}
                      className={btnSecondary}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Categories list */}
            <div className="space-y-4">
              {project.galeria_categorias.length === 0 && !showCatForm && (
                <p className="text-white/20 text-sm text-center py-12">
                  No hay categorias. Agrega la primera.
                </p>
              )}
              {project.galeria_categorias.map((cat) => {
                const isExpanded = expandedCat === cat.id;
                return (
                  <div
                    key={cat.id}
                    className="p-4 bg-white/5 rounded-lg border border-white/5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={() =>
                          setExpandedCat(isExpanded ? null : cat.id)
                        }
                        className="flex items-center gap-2 text-sm font-medium hover:text-[#C9A96E] transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                        {cat.nombre}
                        <span className="text-xs text-white/30 font-normal">
                          ({cat.imagenes?.length || 0} imagenes)
                        </span>
                      </button>
                      <button
                        onClick={() => deleteCategoria(cat.id)}
                        className={btnDanger}
                      >
                        <Trash2 size={12} />
                        Eliminar
                      </button>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-6 gap-2">
                            {cat.imagenes?.map((img) => (
                              <div
                                key={img.id}
                                className="relative aspect-video rounded overflow-hidden bg-white/5 group"
                              >
                                <img
                                  src={img.thumbnail_url || img.url}
                                  alt={img.alt_text || ""}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  onClick={() => deleteImage(img.id)}
                                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white/60 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            ))}
                            <FileUploader
                              onUpload={(url) =>
                                addImageToCategory(cat.id, url)
                              }
                              folder={`proyectos/${id}/galeria/${cat.slug}`}
                              label="+ Imagen"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Collapsed preview */}
                    {!isExpanded && (cat.imagenes?.length ?? 0) > 0 && (
                      <div className="grid grid-cols-8 gap-1.5">
                        {cat.imagenes?.slice(0, 8).map((img) => (
                          <div
                            key={img.id}
                            className="aspect-video rounded overflow-hidden bg-white/5"
                          >
                            <img
                              src={img.thumbnail_url || img.url}
                              alt={img.alt_text || ""}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* -------------------------------------------------------------- */}
        {/* VIDEOS TAB                                                      */}
        {/* -------------------------------------------------------------- */}
        {activeTab === "videos" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-light">Videos</h2>
              {!showVideoForm && (
                <button onClick={openNewVideo} className={btnPrimary}>
                  <Plus size={14} />
                  Agregar Video
                </button>
              )}
            </div>

            {/* Inline form */}
            <AnimatePresence>
              {showVideoForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-6 bg-white/5 rounded-lg border border-white/10 space-y-4 overflow-hidden"
                >
                  <h3 className="text-sm font-medium text-white/70">
                    {editingVideoId ? "Editar video" : "Nuevo video"}
                  </h3>
                  <div>
                    <label className={labelClass}>Titulo</label>
                    <input
                      type="text"
                      value={videoForm.titulo}
                      onChange={(e) =>
                        setVideoForm((p) => ({
                          ...p,
                          titulo: e.target.value,
                        }))
                      }
                      placeholder="Ej: Recorrido virtual"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>URL del video *</label>
                    <input
                      type="url"
                      value={videoForm.url}
                      onChange={(e) =>
                        setVideoForm((p) => ({ ...p, url: e.target.value }))
                      }
                      placeholder="https://youtube.com/watch?v=..."
                      className={inputClass}
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={saveVideo}
                      disabled={videoSaving || !videoForm.url.trim()}
                      className={btnPrimary}
                    >
                      {videoSaving ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                      {editingVideoId ? "Actualizar" : "Crear"}
                    </button>
                    <button onClick={cancelVideoForm} className={btnSecondary}>
                      <X size={14} />
                      Cancelar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* List */}
            <div className="space-y-3">
              {project.videos.length === 0 && !showVideoForm && (
                <p className="text-white/20 text-sm text-center py-12">
                  No hay videos. Agrega el primero.
                </p>
              )}
              {project.videos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/5 group"
                >
                  <div className="w-24 h-14 rounded overflow-hidden bg-white/5 flex items-center justify-center">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Film size={20} className="text-white/10" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm">{video.titulo || "Sin titulo"}</h3>
                    <p className="text-xs text-white/30 truncate">
                      {video.url}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditVideo(video)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Pencil size={12} />
                      Editar
                    </button>
                    <button
                      onClick={() => deleteVideo(video.id)}
                      className={btnDanger}
                    >
                      <Trash2 size={12} />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* -------------------------------------------------------------- */}
        {/* UBICACION TAB                                                   */}
        {/* -------------------------------------------------------------- */}
        {activeTab === "ubicacion" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl space-y-6"
          >
            <div>
              <label className={labelClass}>Direccion</label>
              <input
                type="text"
                value={ubicacionDireccion}
                onChange={(e) => setUbicacionDireccion(e.target.value)}
                placeholder="Ej: Calle 100 #15-20, Bogota"
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Latitud</label>
                <input
                  type="number"
                  step="0.000001"
                  value={ubicacionLat}
                  onChange={(e) => setUbicacionLat(e.target.value)}
                  placeholder="4.6097"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Longitud</label>
                <input
                  type="number"
                  step="0.000001"
                  value={ubicacionLng}
                  onChange={(e) => setUbicacionLng(e.target.value)}
                  placeholder="-74.0817"
                  className={inputClass}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* -------------------------------------------------------------- */}
        {/* CONFIG TAB                                                      */}
        {/* -------------------------------------------------------------- */}
        {activeTab === "config" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl space-y-6"
          >
            <div>
              <label className={labelClass}>
                WhatsApp (numero con codigo de pais)
              </label>
              <input
                type="text"
                value={whatsappNumero}
                onChange={(e) => setWhatsappNumero(e.target.value)}
                placeholder="+573001234567"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Tour 360 URL</label>
              <input
                type="url"
                value={tour360Url}
                onChange={(e) => setTour360Url(e.target.value)}
                placeholder="https://..."
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Brochure</label>
              <FileUploader
                currentUrl={brochureUrl || null}
                onUpload={(url) => setBrochureUrl(url)}
                accept="application/pdf,image/*"
                folder={`proyectos/${id}`}
                label="Subir brochure (PDF o imagen)"
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
