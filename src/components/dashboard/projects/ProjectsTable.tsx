"use client";

import { motion } from "framer-motion";
import { FolderOpen } from "lucide-react";
import { ProjectTableRow } from "./ProjectTableRow";
import type { ProyectoWithStats } from "@/types";

interface Props {
  projects: ProyectoWithStats[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onClone?: (id: string) => void;
  isAdmin: boolean;
}

export function ProjectsTable({
  projects,
  loading,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onClone,
  isAdmin,
}: Props) {
  if (loading) {
    return (
      <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 px-5 py-4 border-b border-[var(--border-subtle)] last:border-0"
          >
            <div className="h-10 w-16 bg-[var(--surface-2)] rounded animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-[var(--surface-2)] rounded animate-pulse" />
              <div className="h-3 w-32 bg-[var(--surface-2)] rounded animate-pulse" />
            </div>
            <div className="h-6 w-20 bg-[var(--surface-2)] rounded-full animate-pulse" />
            <div className="h-4 w-12 bg-[var(--surface-2)] rounded animate-pulse" />
            <div className="h-4 w-12 bg-[var(--surface-2)] rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="
          flex flex-col items-center justify-center
          py-20 px-6
          bg-[var(--surface-1)]
          border-2 border-dashed border-[var(--border-subtle)]
          rounded-2xl
        "
      >
        <div className="
          w-16 h-16 mb-4
          rounded-2xl
          bg-[rgba(var(--site-primary-rgb),0.08)]
          border border-[rgba(var(--site-primary-rgb),0.15)]
          flex items-center justify-center
        ">
          <FolderOpen size={28} className="text-[var(--site-primary)]" />
        </div>

        <h3 className="font-heading text-xl font-light text-white mb-2">
          No se encontraron proyectos
        </h3>

        <p className="font-mono text-sm text-[var(--text-tertiary)] text-center max-w-md">
          Intenta ajustar los filtros o crea un nuevo proyecto
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table
          className="w-full"
          role="table"
          aria-label="Tabla de proyectos"
        >
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              <th scope="col" className="text-left px-5 py-3 font-ui text-[10px] text-[var(--text-tertiary)] tracking-wider uppercase font-bold">
                Imagen
              </th>
              <th scope="col" className="text-left px-5 py-3 font-ui text-[10px] text-[var(--text-tertiary)] tracking-wider uppercase font-bold">
                Nombre
              </th>
              <th scope="col" className="text-left px-5 py-3 font-ui text-[10px] text-[var(--text-tertiary)] tracking-wider uppercase font-bold">
                Estado
              </th>
              <th scope="col" className="text-center px-5 py-3 font-ui text-[10px] text-[var(--text-tertiary)] tracking-wider uppercase font-bold hidden md:table-cell">
                Unidades
              </th>
              <th scope="col" className="text-center px-5 py-3 font-ui text-[10px] text-[var(--text-tertiary)] tracking-wider uppercase font-bold hidden lg:table-cell">
                Leads 7d
              </th>
              <th scope="col" className="text-center px-5 py-3 font-ui text-[10px] text-[var(--text-tertiary)] tracking-wider uppercase font-bold hidden xl:table-cell">
                Visitas 7d
              </th>
              <th scope="col" className="text-left px-5 py-3 font-ui text-[10px] text-[var(--text-tertiary)] tracking-wider uppercase font-bold hidden sm:table-cell">
                Creado
              </th>
              <th scope="col" className="text-right px-5 py-3 font-ui text-[10px] text-[var(--text-tertiary)] tracking-wider uppercase font-bold">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.map((proyecto) => (
              <ProjectTableRow
                key={proyecto.id}
                proyecto={proyecto}
                isSelected={selectedId === proyecto.id}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
                onClone={onClone}
                isAdmin={isAdmin}
              />
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
