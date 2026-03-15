"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Plus, FolderOpen } from "lucide-react";
import { useTranslation } from "@/i18n";
import { EnhancedProjectCard } from "./EnhancedProjectCard";
import type { Proyecto } from "@/types";

interface Props {
  projects: Proyecto[];
  totalCount: number;
  isAdmin: boolean;
  onDelete?: (id: string, name: string) => void;
  onClone?: (id: string) => void;
  onCreateProject?: () => void;
}

export function RecentProjectsPreview({
  projects,
  totalCount,
  isAdmin,
  onDelete = () => {},
  onClone,
  onCreateProject,
}: Props) {
  const { t } = useTranslation("dashboard");

  // Show only first 3 projects
  const recentProjects = projects.slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-ui text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {t("home.recentProjects")}
          </span>
          {totalCount > 0 && (
            <span className="
              inline-flex items-center justify-center
              min-w-[24px] h-6 px-2
              bg-[rgba(var(--site-primary-rgb),0.15)]
              border border-[rgba(var(--site-primary-rgb),0.25)]
              text-[var(--site-primary)]
              rounded-full
              font-mono text-xs font-bold
            ">
              {totalCount}
            </span>
          )}
        </div>

        {totalCount > 3 && (
          <Link
            href="/proyectos"
            className="
              flex items-center gap-2
              px-3 py-1.5
              text-xs font-ui font-bold uppercase tracking-wider
              text-[var(--text-secondary)]
              hover:text-[var(--site-primary)]
              transition-colors
            "
          >
            Ver todos
            <ArrowRight size={14} />
          </Link>
        )}
      </div>

      {/* Projects Grid or Empty State */}
      {recentProjects.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProjects.map((proyecto, idx) => (
              <EnhancedProjectCard
                key={proyecto.id}
                proyecto={proyecto}
                index={idx}
                isAdmin={isAdmin}
                onDelete={onDelete}
                onClone={onClone}
              />
            ))}
          </div>

          {/* Footer - Ver todos button (if more than 3) */}
          {totalCount > 3 && (
            <div className="pt-2">
              <Link
                href="/proyectos"
                className="
                  group
                  flex items-center justify-center gap-2
                  w-full py-3
                  bg-[var(--surface-1)]
                  border-2 border-dashed border-[var(--border-default)]
                  rounded-xl
                  hover:border-[rgba(var(--site-primary-rgb),0.4)]
                  hover:bg-[var(--surface-2)]
                  transition-all
                "
              >
                <span className="font-ui text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] group-hover:text-[var(--site-primary)] transition-colors">
                  Ver todos los proyectos
                </span>
                <ArrowRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--site-primary)] group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="
            flex flex-col items-center justify-center
            py-16 px-6
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
            {isAdmin ? "Aún no tienes proyectos" : "No hay proyectos disponibles"}
          </h3>

          <p className="font-mono text-sm text-[var(--text-tertiary)] text-center max-w-md mb-6">
            {isAdmin
              ? "Crea tu primer proyecto para empezar a gestionar tus desarrollos inmobiliarios"
              : "El administrador aún no ha creado proyectos"}
          </p>

          {isAdmin && onCreateProject && (
            <button
              onClick={onCreateProject}
              className="
                flex items-center gap-2
                px-6 py-3
                bg-[var(--site-primary)]
                text-[#141414]
                rounded-[0.75rem]
                font-ui text-xs font-bold uppercase tracking-[0.1em]
                hover:brightness-110
                transition-all
                shadow-[0_4px_16px_rgba(var(--site-primary-rgb),0.2)]
              "
            >
              <Plus size={16} />
              Crear Proyecto
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
