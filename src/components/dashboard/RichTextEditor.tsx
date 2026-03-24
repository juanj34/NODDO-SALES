"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import ImageExt from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Undo2,
  Redo2,
  ImagePlus,
  Youtube as YoutubeIcon,
  Loader2,
  Sparkles,
  ChevronDown,
  Check,
  X,
} from "lucide-react";

/* ── AI types & constants ── */

type ImprovementStyle = "expandir" | "resumir" | "tono_premium" | "corregir";
type ToneOption = "profesional" | "casual" | "lujo" | "tecnico" | "persuasivo";

interface AIDropdownItem {
  id: string;
  label: string;
  description: string;
  icon: string;
  kind: "advanced" | "direct";
  style?: ImprovementStyle;
}

const AI_ITEMS: AIDropdownItem[] = [
  { id: "generate", label: "Generate with AI", description: "Configuración avanzada con tono, idioma y objetivo", icon: "✨", kind: "advanced" },
  { id: "expandir", label: "Expandir texto", description: "Agregar detalles y elaborar el contenido", icon: "📝", kind: "direct", style: "expandir" },
  { id: "resumir", label: "Resumir texto", description: "Condensar a los puntos clave", icon: "✂️", kind: "direct", style: "resumir" },
  { id: "tono_premium", label: "Tono premium", description: "Elevar el vocabulario para mercado de lujo", icon: "💎", kind: "direct", style: "tono_premium" },
  { id: "corregir", label: "Corregir ortografía", description: "Arreglar gramática y ortografía", icon: "✓", kind: "direct", style: "corregir" },
];

const TONES: { value: ToneOption; label: string; desc: string }[] = [
  { value: "profesional", label: "Profesional", desc: "Formal, claro, apropiado para negocios" },
  { value: "casual", label: "Casual", desc: "Amigable, conversacional, cercano" },
  { value: "lujo", label: "Lujo", desc: "Sofisticado, exclusivo, mercado premium" },
  { value: "tecnico", label: "Técnico", desc: "Preciso, detallado, lenguaje arquitectónico" },
  { value: "persuasivo", label: "Persuasivo", desc: "Convincente, orientado a beneficios" },
];

/* ── Component props ── */

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Enable image upload + YouTube embed buttons (default false) */
  enableMedia?: boolean;
  /** Enable AI text improvement button in toolbar (default false) */
  enableAI?: boolean;
}

function ToolbarButton({
  icon: Icon,
  active,
  onClick,
  label,
  disabled,
}: {
  icon: typeof Bold;
  active: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className={cn(
        "p-1.5 rounded-md transition-all cursor-pointer",
        disabled && "opacity-30 cursor-not-allowed",
        active
          ? "text-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.12)]"
          : "text-[var(--text-tertiary)] hover:text-white hover:bg-[var(--surface-4)]"
      )}
    >
      <Icon size={15} strokeWidth={1.8} />
    </button>
  );
}

function Separator() {
  return <div className="w-px h-4 bg-[var(--border-subtle)] mx-0.5" />;
}

export function RichTextEditor({ content, onChange, placeholder, enableMedia, enableAI }: RichTextEditorProps) {
  const contentRef = useRef(content);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  /* ── AI state ── */
  const [aiDropdownOpen, setAiDropdownOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiImproved, setAiImproved] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiRemaining, setAiRemaining] = useState<number | null>(null);
  const [aiActionLabel, setAiActionLabel] = useState("");
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTone, setAiTone] = useState<ToneOption>("profesional");
  const [aiLang, setAiLang] = useState<"es" | "en">("es");
  const [aiGoal, setAiGoal] = useState("");
  const [aiBaseStyle, setAiBaseStyle] = useState<ImprovementStyle>("expandir");
  const aiDropRef = useRef<HTMLDivElement>(null);
  const aiBtnRef = useRef<HTMLButtonElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        code: false,
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || "",
      }),
      ...(enableMedia
        ? [
            ImageExt.configure({
              HTMLAttributes: {
                class: "rte-inline-image",
              },
            }),
            Youtube.configure({
              HTMLAttributes: {
                class: "rte-youtube-embed",
              },
              width: 0,
              height: 0,
            }),
          ]
        : []),
    ],
    content,
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      const cleaned = html === "<p></p>" ? "" : html;
      contentRef.current = cleaned;
      onChange(cleaned);
    },
  });

  // Re-sync content when parent changes it (e.g. switching from new → edit)
  useEffect(() => {
    if (editor && content !== contentRef.current) {
      contentRef.current = content;
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor || !file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "avances");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch {
      // silently fail — user can retry
    } finally {
      setUploading(false);
    }
  }, [editor]);

  // Handle file input change
  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
    e.target.value = "";
  }, [handleImageUpload]);

  // Handle paste/drop images
  useEffect(() => {
    if (!editor || !enableMedia) return;
    const handlePaste = (_: unknown, event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return false;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          event.preventDefault();
          const file = item.getAsFile();
          if (file) handleImageUpload(file);
          return true;
        }
      }
      return false;
    };
    const handleDrop = (_: unknown, event: DragEvent) => {
      const files = event.dataTransfer?.files;
      if (!files) return false;
      for (const file of files) {
        if (file.type.startsWith("image/")) {
          event.preventDefault();
          handleImageUpload(file);
          return true;
        }
      }
      return false;
    };
    editor.on("paste" as never, handlePaste);
    editor.on("drop" as never, handleDrop);
    return () => {
      editor.off("paste" as never, handlePaste);
      editor.off("drop" as never, handleDrop);
    };
  }, [editor, enableMedia, handleImageUpload]);

  /* ── AI: close dropdown on outside click ── */
  useEffect(() => {
    if (!aiDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        aiDropRef.current && !aiDropRef.current.contains(e.target as Node) &&
        aiBtnRef.current && !aiBtnRef.current.contains(e.target as Node)
      ) {
        setAiDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [aiDropdownOpen]);

  /* ── AI: API call ── */
  const callAIImprove = useCallback(
    async (
      text: string,
      style: ImprovementStyle,
      opts?: { tone?: ToneOption; language?: "es" | "en"; goal?: string }
    ): Promise<{ improved: string } | null> => {
      try {
        const res = await fetch("/api/ai/improve-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            style,
            ...(opts?.tone && { tone: opts.tone }),
            ...(opts?.language && { language: opts.language }),
            ...(opts?.goal && { goal: opts.goal }),
          }),
        });
        const rem = res.headers.get("X-RateLimit-Remaining");
        if (rem) setAiRemaining(Number(rem));
        if (!res.ok) {
          const data = await res.json();
          if (data.code === "RATE_LIMIT_EXCEEDED") {
            throw new Error("Límite diario alcanzado (50 mejoras/día). Intenta mañana.");
          }
          throw new Error(data.error || "Error al mejorar el texto");
        }
        const data = await res.json();
        return { improved: data.improved };
      } catch (err) {
        setAiError(err instanceof Error ? err.message : "Error desconocido");
        return null;
      }
    },
    []
  );

  /* ── AI: direct improvement from dropdown ── */
  const handleAIDirect = useCallback(
    async (style: ImprovementStyle, label: string) => {
      if (!editor) return;
      const text = editor.getText().trim();
      if (!text) {
        setAiError("Escribe algo de texto primero");
        return;
      }
      setAiDropdownOpen(false);
      setAiLoading(true);
      setAiError(null);
      setAiImproved(null);
      setAiActionLabel(label);
      const result = await callAIImprove(text, style);
      setAiLoading(false);
      if (result) setAiImproved(result.improved);
    },
    [editor, callAIImprove]
  );

  /* ── AI: advanced generate from modal ── */
  const handleAIGenerate = useCallback(async () => {
    if (!editor) return;
    const text = editor.getText().trim();
    if (!text) {
      setAiError("Escribe algo de texto primero");
      return;
    }
    setAiLoading(true);
    setAiError(null);
    setAiImproved(null);
    setAiActionLabel("Generate with AI");
    const result = await callAIImprove(text, aiBaseStyle, {
      tone: aiTone,
      language: aiLang,
      goal: aiGoal.trim() || undefined,
    });
    setAiLoading(false);
    if (result) setAiImproved(result.improved);
  }, [editor, callAIImprove, aiBaseStyle, aiTone, aiLang, aiGoal]);

  /* ── AI: apply improved text ── */
  const handleAIApply = useCallback(() => {
    if (!editor || !aiImproved) return;
    editor.commands.setContent(aiImproved);
    // Trigger onChange so parent gets updated
    const html = editor.getHTML();
    const cleaned = html === "<p></p>" ? "" : html;
    contentRef.current = cleaned;
    onChange(cleaned);
    setAiImproved(null);
    setAiModalOpen(false);
  }, [editor, aiImproved, onChange]);

  const handleAIDiscard = useCallback(() => {
    setAiImproved(null);
    setAiError(null);
  }, []);

  const openAIModal = useCallback(() => {
    if (!editor) return;
    const text = editor.getText().trim();
    if (!text) {
      setAiError("Escribe algo de texto primero");
      return;
    }
    setAiDropdownOpen(false);
    setAiModalOpen(true);
    setAiImproved(null);
    setAiError(null);
  }, [editor]);

  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL del enlace:", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addYoutube = () => {
    const url = window.prompt("URL del video de YouTube:", "https://www.youtube.com/watch?v=");
    if (!url) return;
    editor.commands.setYoutubeVideo({ src: url });
  };

  const hasText = !!editor.getText().trim();
  const inputCls = "w-full px-4 py-3 bg-[var(--surface-3)] border border-[var(--border-default)] rounded-[0.625rem] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--site-primary)] focus:ring-2 focus:ring-[rgba(var(--site-primary-rgb),0.15)] transition-colors";

  return (
    <div className="relative">
      <div
        className={cn(
          "rounded-[0.625rem] border border-[var(--border-default)] bg-[var(--surface-3)]",
          "focus-within:border-[rgba(var(--site-primary-rgb),0.5)]",
          "focus-within:shadow-[0_0_0_3px_rgba(var(--site-primary-rgb),0.10)]",
          "transition-all overflow-hidden"
        )}
      >
        {/* Toolbar */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[var(--border-subtle)] bg-[var(--surface-2)]/50">
          <ToolbarButton
            icon={Bold}
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            label="Bold"
          />
          <ToolbarButton
            icon={Italic}
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            label="Italic"
          />
          <Separator />
          <ToolbarButton
            icon={Heading2}
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            label="Heading 2"
          />
          <ToolbarButton
            icon={Heading3}
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            label="Heading 3"
          />
          <Separator />
          <ToolbarButton
            icon={List}
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            label="Bullet list"
          />
          <ToolbarButton
            icon={ListOrdered}
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            label="Ordered list"
          />
          <Separator />
          <ToolbarButton
            icon={Quote}
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            label="Blockquote"
          />
          <ToolbarButton
            icon={Link2}
            active={editor.isActive("link")}
            onClick={setLink}
            label="Link"
          />
          {enableMedia && (
            <>
              <Separator />
              <ToolbarButton
                icon={uploading ? Loader2 : ImagePlus}
                active={false}
                onClick={() => fileInputRef.current?.click()}
                label="Insertar imagen"
                disabled={uploading}
              />
              <ToolbarButton
                icon={YoutubeIcon}
                active={false}
                onClick={addYoutube}
                label="Insertar video YouTube"
              />
            </>
          )}
          <div className="ml-auto" />

          {/* AI sparkles button */}
          {enableAI && (
            <>
              <div className="relative">
                <button
                  ref={aiBtnRef}
                  type="button"
                  onClick={() => setAiDropdownOpen((p) => !p)}
                  disabled={!hasText || aiLoading}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1.5 rounded-md transition-all cursor-pointer",
                    "text-[var(--site-primary)] hover:bg-[rgba(var(--site-primary-rgb),0.1)]",
                    "disabled:opacity-30 disabled:cursor-not-allowed"
                  )}
                  title="Mejorar con IA (Ctrl+Shift+I)"
                >
                  <Sparkles size={15} strokeWidth={1.8} />
                  <ChevronDown
                    size={12}
                    className={cn("transition-transform", aiDropdownOpen && "rotate-180")}
                  />
                </button>

                {/* AI Dropdown */}
                <AnimatePresence>
                  {aiDropdownOpen && (
                    <motion.div
                      ref={aiDropRef}
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      role="menu"
                      className="absolute right-0 top-full mt-2 w-72 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[0.75rem] shadow-[var(--shadow-lg)] overflow-hidden z-50"
                    >
                      {AI_ITEMS.map((item, idx) => (
                        <button
                          key={item.id}
                          role="menuitem"
                          onClick={() => {
                            if (item.kind === "direct" && item.style) {
                              handleAIDirect(item.style, item.label);
                            } else {
                              openAIModal();
                            }
                          }}
                          className={cn(
                            "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[var(--surface-3)] transition-colors cursor-pointer",
                            idx === 0 && "border-b border-[var(--border-subtle)] bg-[rgba(var(--site-primary-rgb),0.05)]"
                          )}
                        >
                          <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-[var(--text-primary)] mb-0.5 flex items-center gap-2">
                              {item.label}
                              {idx === 0 && (
                                <span className="text-[9px] font-ui font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--site-primary)] text-black">
                                  Recomendado
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[var(--text-tertiary)] line-clamp-1">
                              {item.description}
                            </div>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Separator />
            </>
          )}

          <ToolbarButton
            icon={Undo2}
            active={false}
            onClick={() => editor.chain().focus().undo().run()}
            label="Undo"
          />
          <ToolbarButton
            icon={Redo2}
            active={false}
            onClick={() => editor.chain().focus().redo().run()}
            label="Redo"
          />
        </div>

        {/* Hidden file input for image upload */}
        {enableMedia && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />
        )}

        {/* Editor content */}
        <EditorContent editor={editor} className="px-4 py-2.5" />
      </div>

      {/* ── AI inline loading ── */}
      {enableAI && aiLoading && !aiModalOpen && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex items-center gap-2 text-sm text-[var(--text-secondary)]"
        >
          <Loader2 size={14} className="animate-spin text-[var(--site-primary)]" />
          <span>Procesando: {aiActionLabel}...</span>
        </motion.div>
      )}

      {/* ── AI inline error ── */}
      {enableAI && aiError && !aiLoading && !aiModalOpen && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between"
        >
          <span>{aiError}</span>
          <button onClick={() => setAiError(null)} className="ml-2 text-red-400/60 hover:text-red-400 cursor-pointer">
            <X size={14} />
          </button>
        </motion.div>
      )}

      {/* ── AI inline result preview ── */}
      {enableAI && aiImproved && !aiModalOpen && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-4 rounded-[0.75rem] bg-[var(--surface-2)] border border-[var(--border-default)]"
        >
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--site-primary)]">
              Texto mejorado
            </span>
            {aiRemaining !== null && (
              <p className="text-xs text-[var(--text-tertiary)]">
                {aiRemaining}/50 restantes hoy
              </p>
            )}
          </div>
          <div className="text-sm text-[var(--text-primary)] mb-3 max-h-32 overflow-y-auto leading-relaxed">
            {aiImproved}
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleAIDiscard}
              className="px-4 py-2 text-xs font-medium rounded-[0.625rem] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 border border-[var(--border-subtle)] transition-colors cursor-pointer"
            >
              Descartar
            </button>
            <button
              onClick={handleAIApply}
              className="px-4 py-2 text-xs font-semibold rounded-[0.625rem] bg-[var(--site-primary)] hover:bg-[var(--site-secondary)] text-black transition-colors shadow-[var(--glow-sm)] flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={14} />
              Aplicar
            </button>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* ── AI ADVANCED MODAL ("Generate with AI") ──      */}
      {/* ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {enableAI && aiModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          >
            {/* backdrop */}
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => { setAiModalOpen(false); setAiImproved(null); setAiError(null); }}
            />

            {/* card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[1.25rem] shadow-[var(--shadow-xl)]"
            >
              <div className="p-6">
                {/* header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-heading font-light text-[var(--text-primary)] flex items-center gap-2">
                      <Sparkles size={20} className="text-[var(--site-primary)]" />
                      Generate with AI
                    </h3>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      Configura el tono, idioma y objetivo para un resultado personalizado
                    </p>
                    {aiRemaining !== null && (
                      <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                        {aiRemaining}/50 mejoras restantes hoy
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => { setAiModalOpen(false); setAiImproved(null); setAiError(null); }}
                    className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* form (hidden while loading or showing result) */}
                {!aiLoading && !aiImproved && (
                  <div className="space-y-5">
                    {/* tone */}
                    <div>
                      <label className="text-[13px] text-[var(--text-secondary)] font-medium mb-1.5 block">Tono</label>
                      <select
                        value={aiTone}
                        onChange={(e) => setAiTone(e.target.value as ToneOption)}
                        className={inputCls}
                      >
                        {TONES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label} — {t.desc}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* language toggle */}
                    <div>
                      <label className="text-[13px] text-[var(--text-secondary)] font-medium mb-1.5 block">Idioma de salida</label>
                      <div className="flex gap-2">
                        {(["es", "en"] as const).map((l) => (
                          <button
                            key={l}
                            type="button"
                            onClick={() => setAiLang(l)}
                            className={cn(
                              "flex-1 px-4 py-3 rounded-[0.625rem] text-sm font-ui font-bold uppercase tracking-wider transition-all cursor-pointer",
                              aiLang === l
                                ? "bg-[var(--site-primary)] text-black shadow-[var(--glow-sm)]"
                                : "bg-[var(--surface-3)] text-[var(--text-tertiary)] border border-[var(--border-default)] hover:border-[var(--site-primary)]"
                            )}
                          >
                            {l === "es" ? "Español" : "English"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* goal */}
                    <div>
                      <label className="text-[13px] text-[var(--text-secondary)] font-medium mb-1.5 block">Objetivo (opcional)</label>
                      <textarea
                        value={aiGoal}
                        onChange={(e) => setAiGoal(e.target.value)}
                        rows={2}
                        maxLength={200}
                        placeholder="Describe el mensaje clave o propósito del texto..."
                        className={cn(inputCls, "resize-none")}
                      />
                      <div className="mt-1 text-xs font-mono tabular-nums text-[var(--text-tertiary)] text-right">
                        {aiGoal.length} / 200
                      </div>
                    </div>

                    {/* base style */}
                    <div>
                      <label className="text-[13px] text-[var(--text-secondary)] font-medium mb-1.5 block">Estilo base</label>
                      <select
                        value={aiBaseStyle}
                        onChange={(e) => setAiBaseStyle(e.target.value as ImprovementStyle)}
                        className={inputCls}
                      >
                        <option value="expandir">Expandir — Agregar más detalles</option>
                        <option value="resumir">Resumir — Condensar puntos clave</option>
                        <option value="tono_premium">Tono Premium — Vocabulario sofisticado</option>
                        <option value="corregir">Corregir — Solo gramática y ortografía</option>
                      </select>
                    </div>

                    {/* error inside modal */}
                    {aiError && (
                      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        <p>{aiError}</p>
                      </div>
                    )}

                    {/* actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                      <button
                        onClick={() => { setAiModalOpen(false); setAiError(null); }}
                        className="px-5 py-2.5 text-sm font-medium rounded-[0.75rem] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 border border-[var(--border-subtle)] transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleAIGenerate}
                        className="px-5 py-2.5 text-sm font-semibold rounded-[0.75rem] bg-[var(--site-primary)] hover:bg-[var(--site-secondary)] text-black transition-colors shadow-[var(--glow-sm)] flex items-center gap-2 cursor-pointer"
                      >
                        <Sparkles size={16} />
                        Generar
                      </button>
                    </div>
                  </div>
                )}

                {/* loading */}
                {aiLoading && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 size={32} className="text-[var(--site-primary)] animate-spin mb-4" />
                    <p className="text-sm text-[var(--text-secondary)]">Generando con IA...</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                      Tono: {TONES.find((t) => t.value === aiTone)?.label ?? aiTone} · {aiLang === "es" ? "Español" : "English"}
                    </p>
                  </div>
                )}

                {/* error after generate */}
                {aiError && !aiLoading && aiImproved === null && aiModalOpen && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    <p className="font-semibold mb-1">Error</p>
                    <p>{aiError}</p>
                    <button
                      onClick={handleAIGenerate}
                      className="mt-3 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors text-xs font-semibold cursor-pointer"
                    >
                      Reintentar
                    </button>
                  </div>
                )}

                {/* result comparison */}
                {aiImproved && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 block">Original</span>
                        <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] max-h-48 overflow-y-auto leading-relaxed">
                          {editor.getText()}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--site-primary)] mb-1.5 block">Mejorado</span>
                        <div className="p-3 rounded-lg bg-[rgba(var(--site-primary-rgb),0.05)] border border-[var(--site-primary)] text-sm text-[var(--text-primary)] max-h-48 overflow-y-auto leading-relaxed">
                          {aiImproved}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                      <button
                        onClick={handleAIDiscard}
                        className="px-5 py-2.5 text-sm font-medium rounded-[0.75rem] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 border border-[var(--border-subtle)] transition-colors cursor-pointer"
                      >
                        Descartar
                      </button>
                      <button
                        onClick={handleAIApply}
                        className="px-5 py-2.5 text-sm font-semibold rounded-[0.75rem] bg-[var(--site-primary)] hover:bg-[var(--site-secondary)] text-black transition-colors shadow-[var(--glow-sm)] flex items-center gap-2 cursor-pointer"
                      >
                        <Check size={16} />
                        Aplicar cambios
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
