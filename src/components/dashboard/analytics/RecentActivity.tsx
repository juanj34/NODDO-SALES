"use client";

import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Activity,
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  Search,
  MousePointer,
} from "lucide-react";

interface ActivityEvent {
  id: string;
  event_type: string;
  user_role: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

interface Props {
  events: ActivityEvent[];
}

const EVENT_CONFIG: Record<string, { icon: React.ComponentType<{ size?: number }>; label: string; color: string }> = {
  dashboard_view: { icon: Eye, label: "Visitó dashboard", color: "text-blue-400" },
  projects_view: { icon: Eye, label: "Visitó proyectos", color: "text-blue-400" },
  project_create: { icon: Plus, label: "Creó proyecto", color: "text-green-400" },
  project_edit: { icon: Edit, label: "Editó proyecto", color: "text-amber-400" },
  project_delete: { icon: Trash2, label: "Eliminó proyecto", color: "text-red-400" },
  project_clone: { icon: Copy, label: "Clonó proyecto", color: "text-purple-400" },
  projects_search: { icon: Search, label: "Buscó", color: "text-cyan-400" },
  shortcut_leads_click: { icon: MousePointer, label: "Click en Leads", color: "text-indigo-400" },
  shortcut_analytics_click: { icon: MousePointer, label: "Click en Analytics", color: "text-green-400" },
  project_table_row_select: { icon: MousePointer, label: "Seleccionó fila", color: "text-gray-400" },
};

export function RecentActivity({ events }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="
        bg-gradient-to-br from-[var(--surface-1)] to-[var(--surface-2)]
        border border-[var(--border-subtle)]
        rounded-2xl
        overflow-hidden
      "
    >
      <div className="p-6 border-b border-[var(--border-subtle)]">
        <h3 className="font-ui text-xs font-bold uppercase tracking-wider text-white mb-1">
          Actividad reciente
        </h3>
        <p className="font-mono text-xs text-[var(--text-tertiary)]">
          Últimos {events.length} eventos
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-center text-[var(--text-muted)] text-sm py-12">
            No hay actividad reciente
          </p>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {events.map((event, idx) => {
              const config = EVENT_CONFIG[event.event_type] || {
                icon: Activity,
                label: event.event_type,
                color: "text-gray-400",
              };
              const Icon = config.icon;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * idx, duration: 0.2 }}
                  className="
                    px-6 py-3
                    hover:bg-[var(--surface-2)]
                    transition-colors
                  "
                >
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div
                      className={`w-8 h-8 rounded-lg bg-[var(--surface-3)] flex items-center justify-center shrink-0 ${config.color}`}
                    >
                      <Icon size={14} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-white mb-0.5">
                        {config.label}
                        {event.metadata?.project_name && (
                          <span className="text-[var(--text-tertiary)]">
                            {" "}
                            · {event.metadata.project_name}
                          </span>
                        )}
                        {event.metadata?.query && (
                          <span className="text-[var(--text-tertiary)]">
                            {" "}
                            · &quot;{event.metadata.query}&quot;
                          </span>
                        )}
                      </p>
                      <p className="font-mono text-[10px] text-[var(--text-muted)]">
                        {formatDistanceToNow(new Date(event.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                        {event.user_role && (
                          <span className="ml-2 px-1.5 py-0.5 bg-[var(--surface-3)] rounded text-[9px] uppercase tracking-wider">
                            {event.user_role}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
