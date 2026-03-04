"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProjects } from "@/hooks/useProject";
import {
  Plus,
  ExternalLink,
  Edit2,
  Trash2,
  Loader2,
  X,
} from "lucide-react";

const estadoColors: Record<string, string> = {
  publicado: "bg-green-500/20 text-green-400",
  borrador: "bg-yellow-500/20 text-yellow-400",
  archivado: "bg-gray-500/20 text-gray-400",
};

export default function ProyectosPage() {
  const { projects, loading, refresh } = useProjects();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    const res = await fetch("/api/proyectos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, slug }),
    });

    if (res.ok) {
      const proyecto = await res.json();
      router.push(`/editor/${proyecto.id}`);
    } else {
      const data = await res.json();
      alert(data.error || "Error al crear proyecto");
    }
    setCreating(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`))
      return;

    const res = await fetch(`/api/proyectos/${id}`, { method: "DELETE" });
    if (res.ok) refresh();
  };

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A96E]/50 transition-colors";

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-light tracking-wider">Proyectos</h1>
          <p className="text-white/40 text-sm mt-1">
            Gestiona tus micrositios inmobiliarios
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-[#C9A96E] text-black px-5 py-2.5 rounded-lg text-sm font-medium hover:brightness-110 transition-all"
        >
          <Plus size={16} />
          Nuevo Proyecto
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        >
          <motion.form
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onSubmit={handleCreate}
            className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 w-full max-w-md space-y-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-light">Nuevo Proyecto</h2>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="text-white/30 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">
                Nombre
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  setSlug(generateSlug(e.target.value));
                }}
                required
                placeholder="Alto de Yeguas"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">
                Slug (URL)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(generateSlug(e.target.value))}
                required
                placeholder="alto-de-yeguas"
                className={inputClass}
              />
              <p className="text-xs text-white/20 mt-1">
                /sites/{slug || "tu-proyecto"}
              </p>
            </div>
            <button
              type="submit"
              disabled={creating}
              className="w-full bg-[#C9A96E] text-black py-2.5 rounded-lg text-sm font-medium hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {creating && <Loader2 size={14} className="animate-spin" />}
              Crear Proyecto
            </button>
          </motion.form>
        </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#C9A96E]" size={32} />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/30 text-lg mb-4">
            No tienes proyectos aún
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="text-[#C9A96E] text-sm hover:underline"
          >
            Crea tu primer proyecto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proyecto, idx) => (
            <motion.div
              key={proyecto.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-white/5 border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all"
            >
              <div className="aspect-video relative overflow-hidden">
                {proyecto.render_principal_url ? (
                  <img
                    src={proyecto.render_principal_url}
                    alt={proyecto.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/20 text-sm">
                    Sin imagen
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] tracking-wider uppercase ${
                      estadoColors[proyecto.estado] || estadoColors.borrador
                    }`}
                  >
                    {proyecto.estado}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <h3 className="text-lg font-light tracking-wider mb-1">
                  {proyecto.nombre}
                </h3>
                <p className="text-white/30 text-xs mb-4">
                  {proyecto.constructora_nombre || "Sin constructora"} &bull; /
                  {proyecto.slug}
                </p>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/editor/${proyecto.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-white/10 rounded-lg text-xs text-white/50 hover:text-white hover:border-white/30 transition-all"
                  >
                    <Edit2 size={12} />
                    Editar
                  </Link>
                  {proyecto.estado === "publicado" && (
                    <Link
                      href={`/sites/${proyecto.slug}`}
                      target="_blank"
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-white/10 rounded-lg text-xs text-white/50 hover:text-white hover:border-white/30 transition-all"
                    >
                      <ExternalLink size={12} />
                      Ver sitio
                    </Link>
                  )}
                  <button
                    onClick={() =>
                      handleDelete(proyecto.id, proyecto.nombre)
                    }
                    className="ml-auto text-xs text-red-400/40 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
