"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "@/i18n";
import { useEditorProject } from "@/hooks/useEditorProject";
import { useConfirm } from "@/components/dashboard/ConfirmModal";
import { useToast } from "@/components/dashboard/Toast";
import {
  inputClass,
  labelClass,
  btnPrimary,
  btnSecondary,
  btnDanger,
  pageHeader,
  pageTitle,
  pageDescription,
  emptyState,
  emptyStateIcon,
  emptyStateTitle,
  emptyStateDescription,
} from "@/components/dashboard/editor-styles";
import type { PuntoInteres } from "@/types";
import {
  Loader2,
  Plus,
  Check,
  X,
  Pencil,
  Trash2,
  MapPin,
  Sparkles,
  Navigation,
  Image as ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPickerModal } from "@/components/dashboard/MapPickerModal";
import { FileUploader } from "@/components/dashboard/FileUploader";

const CATEGORIAS = [
  "Comercio",
  "Recreacion",
  "Salud",
  "Educacion",
  "Transporte",
  "Gastronomia",
  "Cultura",
  "Deporte",
];

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const emptyPoi = {
  nombre: "",
  descripcion: "",
  categoria: "Comercio",
  lat: "",
  lng: "",
  ciudad: "",
  distancia_km: "",
  tiempo_minutos: "",
};

type UbicacionTab = "ubicacion" | "mapa" | "pois";

const TABS: { id: UbicacionTab; labelKey: string; icon: typeof MapPin }[] = [
  { id: "ubicacion", labelKey: "ubicacion.tabs.coordinates", icon: MapPin },
  { id: "mapa", labelKey: "ubicacion.tabs.designedMap", icon: ImageIcon },
  { id: "pois", labelKey: "ubicacion.tabs.pois", icon: Navigation },
];

export default function UbicacionPage() {
  const { t } = useTranslation("editor");
  const { project, saving, save, refresh, projectId } = useEditorProject();
  const { confirm } = useConfirm();
  const toast = useToast();

  // Tab
  const [activeTab, setActiveTab] = useState<UbicacionTab>("ubicacion");

  // Location form
  const [ubicacionDireccion, setUbicacionDireccion] = useState("");
  const [ubicacionLat, setUbicacionLat] = useState("");
  const [ubicacionLng, setUbicacionLng] = useState("");

  // POI state
  const [poiForm, setPoiForm] = useState(emptyPoi);
  const [editingPoiId, setEditingPoiId] = useState<string | null>(null);
  const [showPoiForm, setShowPoiForm] = useState(false);
  const [poiSaving, setPoiSaving] = useState(false);
  const [filterCat, setFilterCat] = useState<string>("");

  // Map picker
  const [showMapPicker, setShowMapPicker] = useState(false);

  // AI Discovery
  const [discovering, setDiscovering] = useState(false);
  const [discoveredPois, setDiscoveredPois] = useState<PuntoInteres[]>([]);
  const [selectedDiscovered, setSelectedDiscovered] = useState<Set<number>>(
    new Set()
  );
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);

  useEffect(() => {
    if (!project) return;
    setUbicacionDireccion(project.ubicacion_direccion || "");
    setUbicacionLat(
      project.ubicacion_lat != null ? String(project.ubicacion_lat) : ""
    );
    setUbicacionLng(
      project.ubicacion_lng != null ? String(project.ubicacion_lng) : ""
    );
  }, [project]);

  const handleSaveLocation = async () => {
    const ok = await save({
      ubicacion_direccion: ubicacionDireccion || null,
      ubicacion_lat: ubicacionLat ? parseFloat(ubicacionLat) : null,
      ubicacion_lng: ubicacionLng ? parseFloat(ubicacionLng) : null,
    });
    if (!ok) toast.error(t("general.saveError"));
  };

  /* ── Auto-save for coordinates ── */
  const handleSaveLocationRef = useRef(handleSaveLocation);
  handleSaveLocationRef.current = handleSaveLocation;
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleAutoSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => handleSaveLocationRef.current(), 1500);
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        handleSaveLocationRef.current();
      }
    };
  }, []);

  // POI CRUD
  const openNewPoi = () => {
    const form = { ...emptyPoi };
    setPoiForm(form);
    setEditingPoiId(null);
    setShowPoiForm(true);
  };

  const openEditPoi = (poi: PuntoInteres) => {
    setPoiForm({
      nombre: poi.nombre,
      descripcion: poi.descripcion || "",
      categoria: poi.categoria,
      lat: String(poi.lat),
      lng: String(poi.lng),
      ciudad: poi.ciudad || "",
      distancia_km:
        poi.distancia_km != null ? String(poi.distancia_km) : "",
      tiempo_minutos:
        poi.tiempo_minutos != null ? String(poi.tiempo_minutos) : "",
    });
    setEditingPoiId(poi.id);
    setShowPoiForm(true);
  };

  const cancelPoiForm = () => {
    setShowPoiForm(false);
    setEditingPoiId(null);
    setPoiForm(emptyPoi);
  };

  const autoCalcDistance = useCallback(() => {
    if (!ubicacionLat || !ubicacionLng || !poiForm.lat || !poiForm.lng) return;
    const dist = haversineDistance(
      parseFloat(ubicacionLat),
      parseFloat(ubicacionLng),
      parseFloat(poiForm.lat),
      parseFloat(poiForm.lng)
    );
    const time = Math.round(dist * 2.5);
    setPoiForm((p) => ({
      ...p,
      distancia_km: dist.toFixed(1),
      tiempo_minutos: String(time),
    }));
  }, [ubicacionLat, ubicacionLng, poiForm.lat, poiForm.lng]);

  const savePoi = async () => {
    setPoiSaving(true);
    const payload = {
      nombre: poiForm.nombre,
      descripcion: poiForm.descripcion || null,
      categoria: poiForm.categoria,
      lat: parseFloat(poiForm.lat),
      lng: parseFloat(poiForm.lng),
      ciudad: poiForm.ciudad || null,
      distancia_km: poiForm.distancia_km
        ? parseFloat(poiForm.distancia_km)
        : null,
      tiempo_minutos: poiForm.tiempo_minutos
        ? parseInt(poiForm.tiempo_minutos)
        : null,
    };
    try {
      if (editingPoiId) {
        const res = await fetch(`/api/puntos-interes/${editingPoiId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          toast.error("Error al guardar punto de interés");
          return;
        }
      } else {
        const res = await fetch("/api/puntos-interes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, proyecto_id: projectId }),
        });
        if (!res.ok) {
          toast.error("Error al crear punto de interés");
          return;
        }
      }
      await refresh();
      cancelPoiForm();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setPoiSaving(false);
    }
  };

  const deletePoi = async (id: string) => {
    if (!(await confirm({ title: "Eliminar punto de interés", message: "¿Seguro que deseas eliminar este punto de interés?" }))) return;
    try {
      const res = await fetch(`/api/puntos-interes/${id}`, { method: "DELETE" });
      if (!res.ok) toast.error("Error al eliminar punto de interés");
      await refresh();
    } catch {
      toast.error("Error de conexión");
    }
  };

  // AI Discovery
  const discoverPois = async () => {
    if (!ubicacionLat || !ubicacionLng) return;
    setDiscovering(true);
    try {
      const res = await fetch("/api/ai/discover-pois", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: parseFloat(ubicacionLat),
          lng: parseFloat(ubicacionLng),
          projectName: project.nombre,
          address: ubicacionDireccion,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDiscoveredPois(data.pois || []);
        setSelectedDiscovered(
          new Set(data.pois?.map((_: unknown, i: number) => i) || [])
        );
        setShowDiscoveryModal(true);
      } else {
        toast.error("Error al descubrir puntos de interés");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setDiscovering(false);
    }
  };

  const addDiscoveredPois = async () => {
    setPoiSaving(true);
    try {
      const selected = discoveredPois.filter((_, i) =>
        selectedDiscovered.has(i)
      );
      let failed = 0;
      for (const poi of selected) {
        const res = await fetch("/api/puntos-interes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proyecto_id: projectId,
            nombre: poi.nombre,
            descripcion: poi.descripcion,
            categoria: poi.categoria,
            lat: poi.lat,
            lng: poi.lng,
            ciudad: poi.ciudad,
            distancia_km: poi.distancia_km,
            tiempo_minutos: poi.tiempo_minutos,
          }),
        });
        if (!res.ok) failed++;
      }
      if (failed > 0) toast.error(`Error al agregar ${failed} punto(s)`);
      await refresh();
      setShowDiscoveryModal(false);
      setDiscoveredPois([]);
    } catch {
      toast.error("Error de conexión");
    } finally {
      setPoiSaving(false);
    }
  };

  const filteredPois = filterCat
    ? project.puntos_interes.filter((p) => p.categoria === filterCat)
    : project.puntos_interes;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Page Header */}
      <div className={`${pageHeader} max-w-4xl mx-auto`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center">
            <MapPin size={18} className="text-[var(--site-primary)]" />
          </div>
          <div>
            <h2 className={pageTitle}>{t("ubicacion.title")}</h2>
            <p className={pageDescription}>{t("ubicacion.description")}</p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center gap-1 p-1 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] w-fit">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-[var(--site-primary)] text-black"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                }`}
              >
                <Icon size={14} />
                {t(tab.labelKey)}
                {tab.id === "pois" && project.puntos_interes.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    isActive
                      ? "bg-black/20 text-black"
                      : "bg-[var(--surface-3)] text-[var(--text-muted)]"
                  }`}>
                    {project.puntos_interes.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ── Tab: Coordenadas ── */}
        {activeTab === "ubicacion" && (
          <motion.div
            key="ubicacion"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-[var(--surface-2)] rounded-lg border border-[var(--border-subtle)]"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[var(--text-secondary)]">{t("ubicacion.coordinates.title")}</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>{t("ubicacion.coordinates.address")}</label>
                <input
                  type="text"
                  value={ubicacionDireccion}
                  onChange={(e) => { setUbicacionDireccion(e.target.value); scheduleAutoSave(); }}
                  placeholder={t("ubicacion.coordinates.addressPlaceholder")}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t("ubicacion.coordinates.latitude")}</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={ubicacionLat}
                    onChange={(e) => { setUbicacionLat(e.target.value); scheduleAutoSave(); }}
                    placeholder="4.6097"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("ubicacion.coordinates.longitude")}</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={ubicacionLng}
                    onChange={(e) => { setUbicacionLng(e.target.value); scheduleAutoSave(); }}
                    placeholder="-74.0817"
                    className={inputClass}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMapPicker(true)}
                className={btnSecondary}
              >
                <MapPin size={14} />
                {t("ubicacion.coordinates.selectOnMap")}
              </button>

              <MapPickerModal
                isOpen={showMapPicker}
                onClose={() => setShowMapPicker(false)}
                onSelect={async (lat, lng, addr) => {
                  setUbicacionLat(String(lat));
                  setUbicacionLng(String(lng));
                  if (addr) setUbicacionDireccion(addr);
                  // Save immediately with the callback values (state not yet updated)
                  const ok = await save({
                    ubicacion_lat: lat,
                    ubicacion_lng: lng,
                    ubicacion_direccion: addr || ubicacionDireccion || null,
                  });
                  if (ok) toast.success(t("ubicacion.coordinates.saved"));
                  else toast.error(t("general.saveError"));
                }}
                initialLat={ubicacionLat ? parseFloat(ubicacionLat) : undefined}
                initialLng={ubicacionLng ? parseFloat(ubicacionLng) : undefined}
              />
            </div>
          </motion.div>
        )}

        {/* ── Tab: Mapa Diseñado ── */}
        {activeTab === "mapa" && (
          <motion.div
            key="mapa"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-[var(--surface-2)] rounded-lg border border-[var(--border-subtle)]"
          >
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon size={16} className="text-[var(--site-primary)]" />
              <h3 className="text-sm font-medium text-[var(--text-secondary)]">
                {t("ubicacion.designedMap.title")}
              </h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              {t("ubicacion.designedMap.description")}
            </p>
            <FileUploader
              onUpload={(url) => save({ mapa_ubicacion_url: url })}
              folder={`proyectos/${projectId}/ubicacion`}
              currentUrl={project.mapa_ubicacion_url}
              label={t("ubicacion.designedMap.label")}
              aspect="video"
            />
          </motion.div>
        )}

        {/* ── Tab: Puntos de Interes ── */}
        {activeTab === "pois" && (
          <motion.div
            key="pois"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* POI header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-[var(--text-secondary)]">
                {t("ubicacion.pois.title", { count: String(project.puntos_interes.length) })}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={discoverPois}
                  disabled={discovering || !ubicacionLat || !ubicacionLng}
                  className={btnSecondary}
                >
                  {discovering ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  {t("ubicacion.pois.discoverWithAI")}
                </button>
                {!showPoiForm && (
                  <button onClick={openNewPoi} className={btnPrimary}>
                    <Plus size={14} />
                    {t("ubicacion.pois.addPOI")}
                  </button>
                )}
              </div>
            </div>

            {/* Category filter */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterCat("")}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  !filterCat
                    ? "bg-[var(--site-primary)] text-black"
                    : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-white"
                }`}
              >
                {t("ubicacion.pois.all")}
              </button>
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCat(cat === filterCat ? "" : cat)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    filterCat === cat
                      ? "bg-[var(--site-primary)] text-black"
                      : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* POI Form */}
            <AnimatePresence>
              {showPoiForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-6 bg-[var(--surface-2)] rounded-lg border border-[var(--border-default)] space-y-4 overflow-hidden"
                >
                  <h3 className="text-sm font-medium text-[var(--text-secondary)]">
                    {editingPoiId ? t("ubicacion.pois.editPOI") : t("ubicacion.pois.newPOI")}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>{t("ubicacion.pois.nameRequired")}</label>
                      <input
                        type="text"
                        value={poiForm.nombre}
                        onChange={(e) =>
                          setPoiForm((p) => ({ ...p, nombre: e.target.value }))
                        }
                        placeholder={t("ubicacion.pois.namePlaceholder")}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{t("ubicacion.pois.categoryRequired")}</label>
                      <select
                        value={poiForm.categoria}
                        onChange={(e) =>
                          setPoiForm((p) => ({ ...p, categoria: e.target.value }))
                        }
                        className={inputClass}
                      >
                        {CATEGORIAS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>{t("ubicacion.pois.description")}</label>
                    <input
                      type="text"
                      value={poiForm.descripcion}
                      onChange={(e) =>
                        setPoiForm((p) => ({ ...p, descripcion: e.target.value }))
                      }
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>{t("ubicacion.pois.latitudeRequired")}</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={poiForm.lat}
                        onChange={(e) =>
                          setPoiForm((p) => ({ ...p, lat: e.target.value }))
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{t("ubicacion.pois.longitudeRequired")}</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={poiForm.lng}
                        onChange={(e) =>
                          setPoiForm((p) => ({ ...p, lng: e.target.value }))
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{t("ubicacion.pois.city")}</label>
                      <input
                        type="text"
                        value={poiForm.ciudad}
                        onChange={(e) =>
                          setPoiForm((p) => ({ ...p, ciudad: e.target.value }))
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>{t("ubicacion.pois.distance")}</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.1"
                          value={poiForm.distancia_km}
                          onChange={(e) =>
                            setPoiForm((p) => ({
                              ...p,
                              distancia_km: e.target.value,
                            }))
                          }
                          className={inputClass}
                        />
                        <button
                          onClick={autoCalcDistance}
                          disabled={!poiForm.lat || !poiForm.lng}
                          className={btnSecondary + " shrink-0"}
                          title={t("ubicacion.pois.calculateAuto")}
                        >
                          <Navigation size={14} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>{t("ubicacion.pois.time")}</label>
                      <input
                        type="number"
                        value={poiForm.tiempo_minutos}
                        onChange={(e) =>
                          setPoiForm((p) => ({
                            ...p,
                            tiempo_minutos: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={savePoi}
                      disabled={
                        poiSaving ||
                        !poiForm.nombre.trim() ||
                        !poiForm.lat ||
                        !poiForm.lng
                      }
                      className={btnPrimary}
                    >
                      {poiSaving ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                      {editingPoiId ? t("ubicacion.pois.update") : t("ubicacion.pois.create")}
                    </button>
                    <button onClick={cancelPoiForm} className={btnSecondary}>
                      <X size={14} />
                      {t("videos.cancel")}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* POI List */}
            <div className="space-y-2">
              {filteredPois.length === 0 && !showPoiForm && (
                project.puntos_interes.length === 0 ? (
                  <div className={emptyState}>
                    <div className={emptyStateIcon}>
                      <MapPin size={24} className="text-[var(--text-muted)]" />
                    </div>
                    <p className={emptyStateTitle}>{t("ubicacion.pois.noPois")}</p>
                    <p className={emptyStateDescription}>{t("ubicacion.pois.noPoisHint")}</p>
                    <button onClick={openNewPoi} className={btnPrimary}>
                      <Plus size={14} />
                      {t("ubicacion.pois.addFirstPOI")}
                    </button>
                  </div>
                ) : (
                  <p className="text-[var(--text-muted)] text-sm text-center py-12">
                    {t("ubicacion.pois.noPoisCategory")}
                  </p>
                )
              )}
              {filteredPois.map((poi) => (
                <div
                  key={poi.id}
                  className="flex items-center gap-4 p-3 bg-[var(--surface-2)] rounded-lg border border-[var(--border-subtle)] group"
                >
                  <div className="w-8 h-8 rounded-full bg-[rgba(var(--site-primary-rgb),0.1)] flex items-center justify-center shrink-0">
                    <MapPin size={14} className="text-[var(--site-primary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm">{poi.nombre}</h3>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-tertiary)]">
                        {poi.categoria}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {poi.distancia_km != null
                        ? `${poi.distancia_km} km`
                        : "--"}{" "}
                      &bull;{" "}
                      {poi.tiempo_minutos != null
                        ? `${poi.tiempo_minutos} min`
                        : "--"}
                      {poi.ciudad ? ` &bull; ${poi.ciudad}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditPoi(poi)}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-tertiary)] hover:text-white hover:bg-[var(--surface-2)] rounded transition-colors"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => deletePoi(poi.id)}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* AI Discovery Modal (always rendered, shown via state) */}
      <AnimatePresence>
        {showDiscoveryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-8"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl max-h-[80vh] bg-[var(--surface-2)] rounded-2xl border border-[var(--border-default)] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
                <h3 className="text-lg font-light">
                  {t("ubicacion.pois.discoveredPois", { count: String(discoveredPois.length) })}
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={addDiscoveredPois}
                    disabled={poiSaving || selectedDiscovered.size === 0}
                    className={btnPrimary}
                  >
                    {poiSaving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    {t("ubicacion.pois.addSelected", { n: String(selectedDiscovered.size) })}
                  </button>
                  <button
                    onClick={() => setShowDiscoveryModal(false)}
                    className={btnSecondary}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-2">
                {discoveredPois.map((poi, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-3 p-3 bg-[var(--surface-2)] rounded-lg cursor-pointer hover:bg-[var(--surface-3)] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDiscovered.has(i)}
                      onChange={() => {
                        setSelectedDiscovered((prev) => {
                          const next = new Set(prev);
                          if (next.has(i)) next.delete(i);
                          else next.add(i);
                          return next;
                        });
                      }}
                      className="w-4 h-4 rounded accent-[var(--site-primary)]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{poi.nombre}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-tertiary)]">
                          {poi.categoria}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {poi.descripcion ||
                          `${poi.distancia_km?.toFixed(1) ?? "--"} km · ${poi.tiempo_minutos ?? "--"} min`}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
