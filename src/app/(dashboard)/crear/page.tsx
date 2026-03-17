"use client";

export const dynamic = "force-dynamic";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Send,
  Upload,
  Loader2,
  Check,
  MapPin,
  Layers,
  Building2,
  ArrowLeft,
  Paperclip,
  X,
} from "lucide-react";
import { useTranslation } from "@/i18n";
import { useToast } from "@/components/dashboard/Toast";
import type { AIProjectData, AITipologiaData } from "@/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const generateSlug = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function AICreatorPage() {
  const router = useRouter();
  const { t } = useTranslation("dashboard");
  const toast = useToast();

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Extracted data
  const [projectData, setProjectData] = useState<AIProjectData>({
    nombre: null,
    descripcion: null,
    constructora_nombre: null,
    ubicacion_direccion: null,
    ubicacion_lat: null,
    ubicacion_lng: null,
    color_primario: null,
    color_secundario: null,
    color_fondo: null,
    tema_modo: null,
    whatsapp_numero: null,
    disclaimer: null,
    tipologias: [],
  });
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);

  // File uploads
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Creating project
  const [creating, setCreating] = useState(false);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  // Welcome message
  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: t("crear.welcome"),
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "media");
    formData.append("folder", "ai-creator");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const { url } = await res.json();
        setUploadedFiles((prev) => [...prev, url]);
        // Auto-send a message about the upload
        const uploadMsg = t("crear.fileUploaded", { filename: file.name });
        await sendMessage(uploadMsg);
      }
    } catch {
      // silent
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setThinking(true);

    try {
      const res = await fetch("/api/ai/create-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          fileUrls: uploadedFiles,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // Merge extracted data
        if (data.extractedData) {
          setProjectData((prev) => {
            const merged = { ...prev };
            const ext = data.extractedData;
            if (ext.nombre) merged.nombre = ext.nombre;
            if (ext.descripcion) merged.descripcion = ext.descripcion;
            if (ext.constructora_nombre) merged.constructora_nombre = ext.constructora_nombre;
            if (ext.ubicacion_direccion) merged.ubicacion_direccion = ext.ubicacion_direccion;
            if (ext.ubicacion_lat != null) merged.ubicacion_lat = ext.ubicacion_lat;
            if (ext.ubicacion_lng != null) merged.ubicacion_lng = ext.ubicacion_lng;
            if (ext.color_primario) merged.color_primario = ext.color_primario;
            if (ext.color_secundario) merged.color_secundario = ext.color_secundario;
            if (ext.color_fondo) merged.color_fondo = ext.color_fondo;
            if (ext.whatsapp_numero) merged.whatsapp_numero = ext.whatsapp_numero;
            if (ext.disclaimer) merged.disclaimer = ext.disclaimer;
            if (ext.tipologias && ext.tipologias.length > 0) {
              merged.tipologias = ext.tipologias;
            }
            return merged;
          });
        }

        if (data.followUpQuestions) {
          setFollowUpQuestions(data.followUpQuestions);
        }

        // Build assistant reply
        let reply = data.summary || t("crear.processed");
        if (data.followUpQuestions && data.followUpQuestions.length > 0) {
          reply +=
            "\n\n" + t("crear.questions") + "\n" +
            data.followUpQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n");
        }

        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: t("crear.processingError"),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: t("crear.connectionError"),
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleCreateProject = async () => {
    if (!projectData.nombre) return;
    setCreating(true);

    try {
      const slug = generateSlug(projectData.nombre);

      // 1. Create base project
      const projRes = await fetch("/api/proyectos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: projectData.nombre,
          slug,
          descripcion: projectData.descripcion,
          constructora_nombre: projectData.constructora_nombre,
          ubicacion_direccion: projectData.ubicacion_direccion,
          ubicacion_lat: projectData.ubicacion_lat,
          ubicacion_lng: projectData.ubicacion_lng,
          color_primario: projectData.color_primario || "#818CF8",
          color_secundario: projectData.color_secundario || "#F4F4F5",
          color_fondo: projectData.color_fondo || "#09090B",
          whatsapp_numero: projectData.whatsapp_numero,
          disclaimer: projectData.disclaimer || "",
        }),
      });

      if (!projRes.ok) {
        const err = await projRes.json();
        toast.error(err.error || t("crear.createError"));
        return;
      }

      const proyecto = await projRes.json();

      // 2. Create tipologias
      for (const tipo of projectData.tipologias) {
        await fetch("/api/tipologias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proyecto_id: proyecto.id,
            nombre: tipo.nombre,
            descripcion: tipo.descripcion,
            area_m2: tipo.area_m2,
            habitaciones: tipo.habitaciones,
            banos: tipo.banos,
            precio_desde: tipo.precio_desde,
            caracteristicas: tipo.caracteristicas || [],
            parqueaderos: tipo.parqueaderos,
            area_balcon: tipo.area_balcon,
            renders: [],
            hotspots: [],
          }),
        });
      }

      // 3. If location exists, discover POIs
      if (projectData.ubicacion_lat && projectData.ubicacion_lng) {
        try {
          const poisRes = await fetch("/api/ai/discover-pois", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: projectData.ubicacion_lat,
              lng: projectData.ubicacion_lng,
              projectName: projectData.nombre,
              address: projectData.ubicacion_direccion,
            }),
          });

          if (poisRes.ok) {
            const pois = await poisRes.json();
            for (const poi of pois) {
              await fetch("/api/puntos-interes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  proyecto_id: proyecto.id,
                  ...poi,
                }),
              });
            }
          }
        } catch {
          // POI discovery is optional, don't block project creation
        }
      }

      router.push(`/editor/${proyecto.id}`);
    } catch {
      toast.error(t("crear.createError"));
    } finally {
      setCreating(false);
    }
  };

  // Calculate completion
  const completionItems = [
    { label: "Nombre", filled: !!projectData.nombre },
    { label: "Constructora", filled: !!projectData.constructora_nombre },
    { label: "Ubicacion", filled: !!projectData.ubicacion_direccion },
    { label: "Tipologias", filled: projectData.tipologias.length > 0 },
  ];
  const completionPercent = Math.round(
    (completionItems.filter((i) => i.filled).length / completionItems.length) * 100
  );

  return (
    <div className="h-[calc(100vh-0px)] flex">
      {/* Left: Chat */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-[var(--border-subtle)]">
        {/* Chat header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--surface-1)]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/proyectos")}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <Bot size={18} className="text-[var(--site-primary)]" />
            <div>
              <h2 className="text-sm font-medium text-[var(--text-primary)]">{t("crear.title")}</h2>
              <p className="text-[10px] text-[var(--text-muted)]">
                {t("crear.description")}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-[var(--site-primary)] text-white rounded-br-md"
                    : "bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded-bl-md"
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}

          {/* Thinking indicator */}
          {thinking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-[var(--surface-2)] border border-[var(--border-subtle)] px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
                  <Loader2 size={14} className="animate-spin" />
                  {t("crear.analyzing")}
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Uploaded files badges */}
        <AnimatePresence>
          {uploadedFiles.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 pb-2 overflow-hidden"
            >
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((url, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-full text-[10px] text-[var(--text-tertiary)]"
                  >
                    <Paperclip size={10} />
                    {t("crear.file", { n: i + 1 })}
                    <button
                      onClick={() => setUploadedFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="text-[var(--text-muted)] hover:text-red-400"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input area */}
        <form onSubmit={handleSubmit} className="px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--surface-1)]">
          <div className="flex items-end gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="shrink-0 p-2.5 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-all"
            >
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={t("crear.placeholder")}
              rows={1}
              className="flex-1 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.50)] resize-none"
              style={{ minHeight: "42px", maxHeight: "120px" }}
            />
            <button
              type="submit"
              disabled={!input.trim() || thinking}
              className="shrink-0 p-2.5 bg-[var(--site-primary)] rounded-xl text-white hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>

      {/* Right: Preview Panel */}
      <div className="w-[380px] flex flex-col shrink-0 bg-[var(--surface-1)]">
        {/* Preview header */}
        <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">{t("crear.extractedData")}</h3>
            <span className="text-[10px] text-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.10)] px-2 py-0.5 rounded-full">
              {completionPercent}%
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1 bg-[var(--surface-3)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[var(--site-primary)] rounded-full"
              animate={{ width: `${completionPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Preview content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Basic info */}
          <div className="space-y-3">
            <PreviewField
              label={t("crear.projectName")}
              value={projectData.nombre}
              icon={<Building2 size={12} />}
              pendingText={t("crear.pending")}
            />
            <PreviewField
              label={t("crear.developer")}
              value={projectData.constructora_nombre}
              icon={<Building2 size={12} />}
              pendingText={t("crear.pending")}
            />
            <PreviewField
              label={t("crear.description2")}
              value={projectData.descripcion}
              multiline
              pendingText={t("crear.pending")}
            />
          </div>

          {/* Location */}
          <div className="border-t border-[var(--border-subtle)] pt-4 space-y-3">
            <h4 className="flex items-center gap-2 font-ui text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-bold">
              <MapPin size={12} />
              {t("crear.location")}
            </h4>
            <PreviewField label={t("crear.address")} value={projectData.ubicacion_direccion} pendingText={t("crear.pending")} />
            {projectData.ubicacion_lat && projectData.ubicacion_lng && (
              <p className="text-[10px] text-[var(--text-muted)] font-mono">
                {projectData.ubicacion_lat}, {projectData.ubicacion_lng}
              </p>
            )}
          </div>

          {/* Colors */}
          {(projectData.color_primario || projectData.color_secundario) && (
            <div className="border-t border-[var(--border-subtle)] pt-4">
              <h4 className="font-ui text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-bold mb-2">
                {t("crear.colors")}
              </h4>
              <div className="flex gap-2">
                {[
                  { label: t("crear.primaryColor"), color: projectData.color_primario },
                  { label: t("crear.secondaryColor"), color: projectData.color_secundario },
                  { label: t("crear.bgColor"), color: projectData.color_fondo },
                ].map(
                  (c) =>
                    c.color && (
                      <div key={c.label} className="flex items-center gap-1.5">
                        <div
                          className="w-5 h-5 rounded-md border border-white/10"
                          style={{ background: c.color }}
                        />
                        <span className="text-[10px] text-[var(--text-muted)]">{c.color}</span>
                      </div>
                    )
                )}
              </div>
            </div>
          )}

          {/* Tipologias */}
          <div className="border-t border-[var(--border-subtle)] pt-4 space-y-3">
            <h4 className="flex items-center gap-2 font-ui text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-bold">
              <Layers size={12} />
              {t("crear.typologies", { count: projectData.tipologias.length })}
            </h4>
            {projectData.tipologias.length === 0 && (
              <p className="text-xs text-[var(--text-muted)]">{t("crear.noTypologies")}</p>
            )}
            {projectData.tipologias.map((tipo: AITipologiaData, i: number) => (
              <div
                key={i}
                className="p-3 bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl space-y-1"
              >
                <p className="text-sm font-medium text-[var(--text-primary)]">{tipo.nombre}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[var(--text-tertiary)]">
                  {tipo.area_m2 && <span>{tipo.area_m2} {t("crear.m2")}</span>}
                  {tipo.habitaciones != null && <span>{tipo.habitaciones} {t("crear.hab")}</span>}
                  {tipo.banos != null && <span>{tipo.banos} {t("crear.banos")}</span>}
                  {tipo.precio_desde && <span>{t("crear.fromPrice", { price: tipo.precio_desde.toLocaleString() })}</span>}
                </div>
                {tipo.caracteristicas && tipo.caracteristicas.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tipo.caracteristicas.slice(0, 4).map((c: string, j: number) => (
                      <span
                        key={j}
                        className="px-1.5 py-0.5 bg-[rgba(var(--site-primary-rgb),0.1)] text-[rgba(var(--site-primary-rgb),0.7)] text-[9px] rounded"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Follow-up questions */}
          {followUpQuestions.length > 0 && (
            <div className="border-t border-[var(--border-subtle)] pt-4">
              <h4 className="font-ui text-[10px] text-amber-400/70 uppercase tracking-wider font-bold mb-2">
                {t("crear.pendingInfo")}
              </h4>
              <ul className="space-y-1">
                {followUpQuestions.map((q, i) => (
                  <li key={i} className="text-xs text-[var(--text-tertiary)] flex items-start gap-1.5">
                    <span className="text-amber-400/50 mt-0.5">?</span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Create button */}
        <div className="p-6 border-t border-[var(--border-subtle)]">
          <button
            onClick={handleCreateProject}
            disabled={!projectData.nombre || creating}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--site-primary)] text-white rounded-xl text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t("crear.creatingProject")}
              </>
            ) : (
              <>
                <Check size={16} />
                {t("crear.createProject")}
              </>
            )}
          </button>
          {!projectData.nombre && (
            <p className="text-[10px] text-[var(--text-muted)] text-center mt-2">
              {t("crear.needsName")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewField({
  label,
  value,
  icon,
  multiline,
  pendingText = "Pendiente",
}: {
  label: string;
  value: string | null;
  icon?: React.ReactNode;
  multiline?: boolean;
  pendingText?: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 font-ui text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-0.5">
        {icon}
        {label}
      </p>
      {value ? (
        <p className={`text-sm text-[var(--text-secondary)] ${multiline ? "line-clamp-3" : "truncate"}`}>
          {value}
        </p>
      ) : (
        <p className="text-xs text-[var(--text-muted)] italic">{pendingText}</p>
      )}
    </div>
  );
}
