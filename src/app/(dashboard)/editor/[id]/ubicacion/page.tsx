"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useTranslation } from "@/i18n";
import { useEditorProject } from "@/hooks/useEditorProject";
import { useConfirm } from "@/components/dashboard/ConfirmModal";
import { useToast } from "@/components/dashboard/Toast";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";
import { PageHeader } from "@/components/dashboard/base/PageHeader";
import {
  inputClass,
  labelClass,
  btnPrimary,
  btnSecondary,
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
  Send,
  MessageCircle,
  Bot,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPickerModal } from "@/components/dashboard/MapPickerModal";
import { FileUploader } from "@/components/dashboard/FileUploader";
import { poiSchema, proyectoUbicacionSchema } from "@/lib/validation/schemas";
import { InlineError } from "@/components/ui/ErrorBoundary";
import { ZodError } from "zod";

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

// Map DB category values to translation keys for display
const CATEGORIA_LABEL_KEYS: Record<string, string> = {
  Comercio: "ubicacion.pois.categories.comercio",
  Recreacion: "ubicacion.pois.categories.recreacion",
  Salud: "ubicacion.pois.categories.salud",
  Educacion: "ubicacion.pois.categories.educacion",
  Transporte: "ubicacion.pois.categories.transporte",
  Gastronomia: "ubicacion.pois.categories.gastronomia",
  Cultura: "ubicacion.pois.categories.cultura",
  Deporte: "ubicacion.pois.categories.deporte",
};

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
type DiscoveryTab = "quick" | "chat";

const TABS: { id: UbicacionTab; labelKey: string; icon: typeof MapPin }[] = [
  { id: "ubicacion", labelKey: "ubicacion.tabs.coordinates", icon: MapPin },
  { id: "mapa", labelKey: "ubicacion.tabs.designedMap", icon: ImageIcon },
  { id: "pois", labelKey: "ubicacion.tabs.pois", icon: Navigation },
];

export default function UbicacionPage() {
  const { t } = useTranslation("editor");
  const { project, save, refresh, updateLocal, projectId } = useEditorProject();
  const { confirm } = useConfirm();
  const toast = useToast();

  // Tab
  const [activeTab, setActiveTab] = useState<UbicacionTab>("ubicacion");

  // Location form
  const [ubicacionDireccion, setUbicacionDireccion] = useState("");
  const [ubicacionLat, setUbicacionLat] = useState("");
  const [ubicacionLng, setUbicacionLng] = useState("");
  const [ubicacionErrors, setUbicacionErrors] = useState<string | null>(null);

  // POI state
  const [poiForm, setPoiForm] = useState(emptyPoi);
  const [editingPoiId, setEditingPoiId] = useState<string | null>(null);
  const [showPoiForm, setShowPoiForm] = useState(false);
  const [poiSaving, setPoiSaving] = useState(false);
  const [filterCat, setFilterCat] = useState<string>("");
  const [poiErrors, setPoiErrors] = useState<string | null>(null);

  // Map pickers
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showPoiMapPicker, setShowPoiMapPicker] = useState(false);

  // Guard: only initialize local state from project once
  const initializedRef = useRef(false);

  // AI Discovery (advanced modal)
  interface DiscoveredPOI {
    nombre: string;
    descripcion: string | null;
    categoria: string;
    lat: number;
    lng: number;
    ciudad: string | null;
    distancia_km: number | null;
    tiempo_minutos: number | null;
  }

  interface ChatMessage {
    role: "user" | "model";
    text: string;
    pois?: DiscoveredPOI[];
  }

  const [discoveryOpen, setDiscoveryOpen] = useState(false);
  const [discoveryTab, setDiscoveryTab] = useState<DiscoveryTab>("quick");
  const [discoveryResults, setDiscoveryResults] = useState<DiscoveredPOI[]>([]);
  const [searchingCategory, setSearchingCategory] = useState<string | null>(null);
  const [selectedDiscovered, setSelectedDiscovered] = useState<Set<number>>(new Set());
  const [searchedCategories, setSearchedCategories] = useState<Set<string>>(new Set());
  const [addingSaving, setAddingSaving] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!project || initializedRef.current) return;
    initializedRef.current = true;
    setUbicacionDireccion(project.ubicacion_direccion || "");
    setUbicacionLat(
      project.ubicacion_lat != null ? String(project.ubicacion_lat) : ""
    );
    setUbicacionLng(
      project.ubicacion_lng != null ? String(project.ubicacion_lng) : ""
    );
  }, [project]);

  const handleSaveLocation = async () => {
    if (!initializedRef.current) return;
    try {
      // Validate location data
      proyectoUbicacionSchema.parse({
        ubicacion_direccion: ubicacionDireccion || null,
        ubicacion_lat: ubicacionLat ? parseFloat(ubicacionLat) : null,
        ubicacion_lng: ubicacionLng ? parseFloat(ubicacionLng) : null,
      });
      setUbicacionErrors(null);

      const ok = await save({
        ubicacion_direccion: ubicacionDireccion || null,
        ubicacion_lat: ubicacionLat ? parseFloat(ubicacionLat) : null,
        ubicacion_lng: ubicacionLng ? parseFloat(ubicacionLng) : null,
      });
      if (!ok) toast.error(t("general.saveError"));
    } catch (err) {
      if (err instanceof ZodError) {
        if (err.issues?.length > 0) {
          setUbicacionErrors(err.issues[0].message);
          toast.error(err.issues[0].message);
        }
      }
    }
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
    setPoiErrors(null);

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
      // Validate POI data
      poiSchema.parse(payload);

      // Optimistic update — close form and update UI immediately
      const snapshot = project.puntos_interes;

      if (editingPoiId) {
        updateLocal((prev) => ({
          ...prev,
          puntos_interes: prev.puntos_interes.map((p) =>
            p.id === editingPoiId ? { ...p, ...payload } : p
          ),
        }));
        cancelPoiForm();

        const res = await fetch(`/api/puntos-interes/${editingPoiId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          updateLocal((prev) => ({ ...prev, puntos_interes: snapshot }));
          toast.error(t("ubicacion.pois.savePOIError"));
          return;
        }
        // Merge server response
        const updated = await res.json();
        updateLocal((prev) => ({
          ...prev,
          puntos_interes: prev.puntos_interes.map((p) =>
            p.id === editingPoiId ? { ...p, ...updated } : p
          ),
        }));
      } else {
        const tempId = `temp-${Date.now()}`;
        const tempPoi = { ...payload, id: tempId, proyecto_id: projectId } as unknown as PuntoInteres;
        updateLocal((prev) => ({
          ...prev,
          puntos_interes: [...prev.puntos_interes, tempPoi],
        }));
        cancelPoiForm();

        const res = await fetch("/api/puntos-interes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, proyecto_id: projectId }),
        });
        if (!res.ok) {
          updateLocal((prev) => ({ ...prev, puntos_interes: snapshot }));
          toast.error(t("ubicacion.pois.createPOIError"));
          return;
        }
        // Replace temp with real
        const created = await res.json();
        updateLocal((prev) => ({
          ...prev,
          puntos_interes: prev.puntos_interes.map((p) =>
            p.id === tempId ? { ...p, ...created } : p
          ),
        }));
      }
    } catch (err) {
      if (err instanceof ZodError) {
        if (err.issues?.length > 0) {
          setPoiErrors(err.issues[0].message);
          toast.error(err.issues[0].message);
        }
      } else {
        toast.error(t("errors.connectionError"));
      }
    } finally {
      setPoiSaving(false);
    }
  };

  const deletePoiAction = useAsyncAction(async (id: string) => {
    if (!(await confirm({ title: t("ubicacion.pois.deletePOI"), message: t("ubicacion.pois.deleteConfirmMsg") }))) return;
    // Optimistic remove
    const snapshot = project.puntos_interes;
    updateLocal((prev) => ({
      ...prev,
      puntos_interes: prev.puntos_interes.filter((p) => p.id !== id),
    }));
    try {
      const res = await fetch(`/api/puntos-interes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        updateLocal((prev) => ({ ...prev, puntos_interes: snapshot }));
        toast.error(t("ubicacion.pois.deletePOIError"));
      }
    } catch {
      updateLocal((prev) => ({ ...prev, puntos_interes: snapshot }));
      toast.error(t("errors.connectionError"));
    }
  });

  // AI Discovery — open modal with both quick-search and chat modes
  const openDiscoveryModal = () => {
    if (!ubicacionLat || !ubicacionLng) return;
    setDiscoveryResults([]);
    setSelectedDiscovered(new Set());
    setSearchedCategories(new Set());
    setSearchingCategory(null);
    setChatMessages([]);
    setChatInput("");
    setDiscoveryTab("quick");
    setDiscoveryOpen(true);
  };

  const searchCategory = async (cat: string | null) => {
    if (!ubicacionLat || !ubicacionLng || searchingCategory) return;
    setSearchingCategory(cat ?? "Todas");
    try {
      const body: Record<string, unknown> = {
        lat: parseFloat(ubicacionLat),
        lng: parseFloat(ubicacionLng),
        projectName: project.nombre,
        address: ubicacionDireccion,
      };
      if (cat) body.categoria = cat;

      const res = await fetch("/api/ai/discover-pois", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        const newPois: DiscoveredPOI[] = data.pois || [];
        if (newPois.length === 0) {
          toast.error(t("ubicacion.pois.noPOIsFound"));
          return;
        }
        // Deduplicate by nombre (case-insensitive)
        const existingNames = new Set(
          discoveryResults.map((p) => p.nombre.toLowerCase())
        );
        const unique = newPois.filter(
          (p) => !existingNames.has(p.nombre.toLowerCase())
        );
        const prevLen = discoveryResults.length;
        const merged = [...discoveryResults, ...unique];
        setDiscoveryResults(merged);
        // Pre-select all new ones
        setSelectedDiscovered((prev) => {
          const next = new Set(prev);
          for (let i = prevLen; i < merged.length; i++) next.add(i);
          return next;
        });
        // Track searched category
        setSearchedCategories((prev) => {
          const next = new Set(prev);
          if (cat) next.add(cat);
          else CATEGORIAS.forEach((c) => next.add(c));
          return next;
        });
        toast.success(t("ubicacion.pois.poisFound", { count: unique.length }));
      } else {
        const errData = await res.json().catch(() => null);
        toast.error(errData?.error || t("ubicacion.pois.searchPOIError"));
      }
    } catch {
      toast.error(t("errors.aiConnectionError"));
    } finally {
      setSearchingCategory(null);
    }
  };

  // Chat-based AI discovery
  const sendChatMessage = async (message: string) => {
    if (!message.trim() || chatSending || !ubicacionLat || !ubicacionLng) return;
    setChatSending(true);
    setChatMessages((prev) => [...prev, { role: "user", text: message }]);
    setChatInput("");

    try {
      const historyForApi = chatMessages.map((m) => ({
        role: m.role,
        text: m.text,
      }));
      const existingPoiNames = [
        ...project.puntos_interes.map((p) => p.nombre),
        ...discoveryResults.map((p) => p.nombre),
      ];

      const res = await fetch("/api/ai/discover-pois-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: parseFloat(ubicacionLat),
          lng: parseFloat(ubicacionLng),
          projectName: project.nombre,
          address: ubicacionDireccion,
          message,
          history: historyForApi,
          existingPoiNames,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newPois: DiscoveredPOI[] = data.pois || [];
        // Deduplicate against existing results
        const existingNames = new Set(
          discoveryResults.map((p) => p.nombre.toLowerCase())
        );
        const uniqueNew = newPois.filter(
          (p) => !existingNames.has(p.nombre.toLowerCase())
        );

        const aiMsg: ChatMessage = {
          role: "model",
          text: data.message || "Aquí tienes los resultados:",
          pois: uniqueNew.length > 0 ? uniqueNew : undefined,
        };
        setChatMessages((prev) => [...prev, aiMsg]);

        if (uniqueNew.length > 0) {
          const prevLen = discoveryResults.length;
          setDiscoveryResults((prev) => [...prev, ...uniqueNew]);
          setSelectedDiscovered((prev) => {
            const next = new Set(prev);
            for (let i = prevLen; i < prevLen + uniqueNew.length; i++)
              next.add(i);
            return next;
          });
        }
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: "model", text: "Lo siento, hubo un error. Intenta de nuevo." },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "model", text: "Error de conexión. Intenta de nuevo." },
      ]);
    } finally {
      setChatSending(false);
      setTimeout(
        () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        100
      );
    }
  };

  const addDiscoveredPois = async () => {
    const selected = discoveryResults.filter((_, i) => selectedDiscovered.has(i));
    if (selected.length === 0) return;
    setAddingSaving(true);

    // Optimistic: add all selected POIs with temp IDs
    const tempPois = selected.map((poi, i) => ({
      id: `temp-discovered-${Date.now()}-${i}`,
      proyecto_id: projectId,
      nombre: poi.nombre,
      descripcion: poi.descripcion,
      categoria: poi.categoria,
      lat: poi.lat,
      lng: poi.lng,
      ciudad: poi.ciudad,
      distancia_km: poi.distancia_km,
      tiempo_minutos: poi.tiempo_minutos,
    })) as unknown as PuntoInteres[];

    const snapshot = project.puntos_interes;
    updateLocal((prev) => ({
      ...prev,
      puntos_interes: [...prev.puntos_interes, ...tempPois],
    }));
    setDiscoveryOpen(false);

    try {
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
      if (failed > 0) {
        toast.error(t("ubicacion.pois.addPOIError", { count: failed }));
      } else {
        toast.success(t("ubicacion.pois.addPOISuccess", { count: selected.length }));
      }
      // Refresh to get real IDs from server
      refresh().catch(() => {});
    } catch {
      updateLocal((prev) => ({ ...prev, puntos_interes: snapshot }));
      toast.error(t("errors.connectionError"));
    } finally {
      setAddingSaving(false);
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
      <div className="max-w-4xl mx-auto">
        <PageHeader
          icon={MapPin}
          title={t("ubicacion.title")}
          description={t("ubicacion.description")}
        />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              {ubicacionErrors && (
                <InlineError
                  message={ubicacionErrors}
                  onRetry={() => setUbicacionErrors(null)}
                  variant="compact"
                />
              )}

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

              {/* POI form map picker */}
              <MapPickerModal
                isOpen={showPoiMapPicker}
                onClose={() => setShowPoiMapPicker(false)}
                onSelect={(lat, lng) => {
                  // Calculate distance and time if project coordinates are set
                  if (ubicacionLat && ubicacionLng) {
                    const dist = haversineDistance(
                      parseFloat(ubicacionLat),
                      parseFloat(ubicacionLng),
                      lat,
                      lng
                    );
                    const time = Math.round(dist * 2.5);
                    setPoiForm((p) => ({
                      ...p,
                      lat: String(lat),
                      lng: String(lng),
                      distancia_km: dist.toFixed(1),
                      tiempo_minutos: String(time),
                    }));
                  } else {
                    setPoiForm((p) => ({
                      ...p,
                      lat: String(lat),
                      lng: String(lng),
                    }));
                  }
                }}
                initialLat={poiForm.lat ? parseFloat(poiForm.lat) : undefined}
                initialLng={poiForm.lng ? parseFloat(poiForm.lng) : undefined}
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
                  onClick={openDiscoveryModal}
                  disabled={!ubicacionLat || !ubicacionLng}
                  className={btnSecondary}
                >
                  <Sparkles size={14} />
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
                  {t(CATEGORIA_LABEL_KEYS[cat] ?? cat)}
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <NodDoDropdown
                        variant="dashboard"
                        size="md"
                        value={poiForm.categoria}
                        onChange={(val) => setPoiForm((p) => ({ ...p, categoria: val }))}
                        options={CATEGORIAS.map((c) => ({ value: c, label: t(CATEGORIA_LABEL_KEYS[c] ?? c) }))}
                      />
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

                  <div className="flex items-center justify-between mb-2">
                    <label className={labelClass}>Coordenadas</label>
                    <button
                      type="button"
                      onClick={() => setShowPoiMapPicker(true)}
                      className={btnSecondary + " py-1 text-xs"}
                    >
                      <MapPin size={12} />
                      {t("ubicacion.coordinates.selectOnMap")}
                    </button>
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  {poiErrors && (
                    <InlineError
                      message={poiErrors}
                      onRetry={() => setPoiErrors(null)}
                      variant="compact"
                    />
                  )}

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
                      onClick={() => deletePoiAction.execute(poi.id)}
                      disabled={deletePoiAction.loading}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                    >
                      {deletePoiAction.loading ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* AI Discovery Modal — Tabbed (Quick Search + Chat) */}
      <AnimatePresence>
        {discoveryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-4xl max-h-[85vh] bg-[var(--surface-1)] rounded-2xl border border-[var(--border-default)] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(var(--site-primary-rgb),0.15)] flex items-center justify-center">
                    <Sparkles size={16} className="text-[var(--site-primary)]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">{t("ubicacion.pois.discoverPOIs")}</h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      {t("ubicacion.pois.discoverHint")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDiscoveryOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-3)] transition-colors text-[var(--text-muted)] hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Tab bar */}
              <div className="flex items-center gap-0 px-6 py-3 border-b border-[var(--border-subtle)] bg-[var(--surface-2)]/50">
                <button
                  onClick={() => setDiscoveryTab("quick")}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    discoveryTab === "quick"
                      ? "bg-[var(--surface-3)] text-white"
                      : "text-[var(--text-tertiary)] hover:text-white"
                  }`}
                >
                  <Sparkles size={13} />
                  Búsqueda rápida
                </button>
                <button
                  onClick={() => setDiscoveryTab("chat")}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    discoveryTab === "chat"
                      ? "bg-[var(--surface-3)] text-white"
                      : "text-[var(--text-tertiary)] hover:text-white"
                  }`}
                >
                  <MessageCircle size={13} />
                  Chat con IA
                </button>
              </div>

              {/* Content area */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {discoveryTab === "quick" ? (
                  // ── Quick Search Tab ──
                  <>
                    {/* Category pills */}
                    <div className="px-6 py-4 border-b border-[var(--border-subtle)] overflow-x-auto">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => searchCategory(null)}
                          disabled={!!searchingCategory}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                            searchingCategory === "Todas"
                              ? "bg-[var(--site-primary)] text-black"
                              : searchedCategories.size === CATEGORIAS.length
                                ? "bg-[var(--surface-3)] text-[var(--text-muted)] border border-[var(--border-subtle)]"
                                : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)] hover:text-white border border-[var(--border-subtle)]"
                          }`}
                        >
                          {searchingCategory === "Todas" ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : searchedCategories.size === CATEGORIAS.length ? (
                            <Check size={12} />
                          ) : (
                            <Sparkles size={12} />
                          )}
                          Todas
                        </button>
                        {CATEGORIAS.map((cat) => {
                          const isSearching = searchingCategory === cat;
                          const wasSearched = searchedCategories.has(cat);
                          return (
                            <button
                              key={cat}
                              onClick={() => searchCategory(cat)}
                              disabled={!!searchingCategory}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                                isSearching
                                  ? "bg-[var(--site-primary)] text-black"
                                  : wasSearched
                                    ? "bg-[var(--surface-3)] text-[var(--text-muted)] border border-[var(--border-subtle)]"
                                    : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)] hover:text-white border border-[var(--border-subtle)]"
                              }`}
                            >
                              {isSearching ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : wasSearched ? (
                                <Check size={12} />
                              ) : null}
                              {t(CATEGORIA_LABEL_KEYS[cat] ?? cat)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Results area */}
                    <div className="flex-1 overflow-y-auto">
                      {discoveryResults.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="w-12 h-12 rounded-full bg-[var(--surface-3)] flex items-center justify-center mb-3">
                            <MapPin size={20} className="text-[var(--text-muted)]" />
                          </div>
                          <p className="text-sm text-[var(--text-secondary)] mb-1">
                            {t("ubicacion.pois.noResults")}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] max-w-xs">
                            {t("ubicacion.pois.discoverHint2")}
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 space-y-1">
                          {/* Select all / none */}
                          <div className="flex items-center justify-between px-2 py-1">
                            <span className="text-xs text-[var(--text-muted)]">
                              {selectedDiscovered.size} de {discoveryResults.length} seleccionados
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  setSelectedDiscovered(
                                    new Set(discoveryResults.map((_, i) => i))
                                  )
                                }
                                className="text-xs text-[var(--site-primary)] hover:underline"
                              >
                                Todos
                              </button>
                              <span className="text-[var(--text-muted)]">·</span>
                              <button
                                onClick={() => setSelectedDiscovered(new Set())}
                                className="text-xs text-[var(--text-muted)] hover:text-white hover:underline"
                              >
                                Ninguno
                              </button>
                            </div>
                          </div>

                          {/* POI list grouped by category */}
                          {CATEGORIAS.filter((cat) =>
                            discoveryResults.some((p) => p.categoria === cat)
                          ).map((cat) => (
                            <div key={cat}>
                              <div className="px-2 pt-3 pb-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                                  {t(CATEGORIA_LABEL_KEYS[cat] ?? cat)}
                                </span>
                              </div>
                              {discoveryResults
                                .map((poi, originalIdx) => ({
                                  poi,
                                  originalIdx,
                                }))
                                .filter(({ poi }) => poi.categoria === cat)
                                .map(({ poi, originalIdx }) => (
                                  <label
                                    key={originalIdx}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-[var(--surface-2)] transition-colors"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedDiscovered.has(
                                        originalIdx
                                      )}
                                      onChange={() => {
                                        setSelectedDiscovered((prev) => {
                                          const next = new Set(prev);
                                          if (next.has(originalIdx))
                                            next.delete(originalIdx);
                                          else next.add(originalIdx);
                                          return next;
                                        });
                                      }}
                                      className="w-4 h-4 rounded accent-[var(--site-primary)] shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm">
                                        {poi.nombre}
                                      </span>
                                      {poi.descripcion && (
                                        <p className="text-xs text-[var(--text-muted)] truncate">
                                          {poi.descripcion}
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="text-xs text-[var(--text-tertiary)]">
                                        {poi.distancia_km != null
                                          ? `${poi.distancia_km} km`
                                          : ""}
                                      </span>
                                      {poi.tiempo_minutos != null && (
                                        <span className="text-xs text-[var(--text-muted)] ml-1">
                                          · {poi.tiempo_minutos} min
                                        </span>
                                      )}
                                    </div>
                                  </label>
                                ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  // ── Chat Tab ──
                  <>
                    {/* Chat messages area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {chatMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="w-12 h-12 rounded-full bg-[rgba(var(--site-primary-rgb),0.1)] flex items-center justify-center mb-3">
                            <Sparkles size={20} className="text-[var(--site-primary)]" />
                          </div>
                          <p className="text-sm text-[var(--text-secondary)] mb-1">
                            Hola! Puedo buscar lugares de interés cerca de tu proyecto.
                          </p>
                          <p className="text-xs text-[var(--text-muted)] max-w-xs mb-4">
                            Prueba preguntas como: "busca hospitales", "hay parques a 2km?" o "qué restaurantes hay?"
                          </p>
                          <div className="flex gap-2 flex-wrap justify-center">
                            {[
                              "Hospitales y clínicas",
                              "Parques y recreación",
                              "Colegios y universidades",
                            ].map((suggestion) => (
                              <button
                                key={suggestion}
                                onClick={() => sendChatMessage(suggestion)}
                                disabled={chatSending}
                                className="text-xs px-2.5 py-1 rounded-full bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-3)] transition-colors border border-[var(--border-subtle)]"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <>
                          {chatMessages.map((msg, idx) => (
                            <div key={idx}>
                              {msg.role === "user" ? (
                                <div className="flex justify-end">
                                  <div className="max-w-xs bg-[var(--site-primary)] text-black px-3 py-2 rounded-lg text-sm">
                                    {msg.text}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-start">
                                  <div className="max-w-2xl bg-[var(--surface-2)] text-white px-3 py-2 rounded-lg space-y-2">
                                    <p className="text-sm">{msg.text}</p>
                                    {msg.pois && msg.pois.length > 0 && (
                                      <div className="space-y-1 pt-1 border-t border-[var(--border-subtle)]">
                                        {msg.pois.map((poi, poiIdx) => {
                                          const fullIdx = discoveryResults.indexOf(poi);
                                          return (
                                            <label
                                              key={poiIdx}
                                              className="flex items-center gap-2 text-xs cursor-pointer hover:bg-[var(--surface-3)] px-2 py-1.5 rounded transition-colors"
                                            >
                                              <input
                                                type="checkbox"
                                                checked={selectedDiscovered.has(
                                                  fullIdx
                                                )}
                                                onChange={() => {
                                                  setSelectedDiscovered(
                                                    (prev) => {
                                                      const next = new Set(
                                                        prev
                                                      );
                                                      if (next.has(fullIdx))
                                                        next.delete(fullIdx);
                                                      else next.add(fullIdx);
                                                      return next;
                                                    }
                                                  );
                                                }}
                                                className="w-3 h-3 rounded accent-[var(--site-primary)] shrink-0"
                                              />
                                              <div className="flex-1 min-w-0">
                                                <div className="font-medium text-white">
                                                  {poi.nombre}
                                                </div>
                                                {poi.descripcion && (
                                                  <div className="text-[var(--text-muted)] truncate">
                                                    {poi.descripcion}
                                                  </div>
                                                )}
                                                <div className="text-[var(--text-tertiary)] text-[10px] mt-0.5">
                                                  {poi.distancia_km != null &&
                                                    `${poi.distancia_km} km`}{" "}
                                                  {poi.tiempo_minutos !=
                                                    null &&
                                                    `· ${poi.tiempo_minutos} min`}
                                                </div>
                                              </div>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                          {chatSending && (
                            <div className="flex justify-start">
                              <div className="bg-[var(--surface-2)] px-3 py-2 rounded-lg">
                                <div className="flex gap-1">
                                  <div className="w-2 h-2 rounded-full bg-[var(--site-primary)] animate-bounce" style={{ animationDelay: "0ms" }} />
                                  <div className="w-2 h-2 rounded-full bg-[var(--site-primary)] animate-bounce" style={{ animationDelay: "150ms" }} />
                                  <div className="w-2 h-2 rounded-full bg-[var(--site-primary)] animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat input */}
                    <div className="border-t border-[var(--border-subtle)] p-3 flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendChatMessage(chatInput);
                          }
                        }}
                        placeholder="Describe lo que buscas..."
                        disabled={chatSending}
                        className="flex-1 bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--site-primary)]"
                      />
                      <button
                        onClick={() => sendChatMessage(chatInput)}
                        disabled={!chatInput.trim() || chatSending}
                        className={`px-3 py-2 rounded-lg flex items-center justify-center transition-all ${
                          !chatInput.trim() || chatSending
                            ? "bg-[var(--surface-3)] text-[var(--text-muted)] cursor-not-allowed"
                            : "bg-[var(--site-primary)] text-black hover:brightness-110"
                        }`}
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Shared footer */}
              {discoveryResults.length > 0 && (
                <div className="px-6 py-4 border-t border-[var(--border-subtle)] flex items-center justify-between bg-[var(--surface-2)]/50">
                  <p className="text-xs text-[var(--text-muted)]">
                    {selectedDiscovered.size} de {discoveryResults.length} seleccionados
                  </p>
                  <button
                    onClick={addDiscoveredPois}
                    disabled={addingSaving || selectedDiscovered.size === 0}
                    className={btnPrimary}
                  >
                    {addingSaving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    Agregar {selectedDiscovered.size}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
