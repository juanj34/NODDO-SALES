"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Loader2,
  Users,
  FolderOpen,
  Package,
  Zap,
  Crown,
  Sparkles,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface UserRow {
  id: string;
  email: string;
  projectCount: number;
  plan: string | null;
  planStatus: string | null;
  maxProjects: number | null;
}

const PLAN_INFO: Record<string, { icon: typeof CreditCard; color: string; bg: string; label: string; price: string; limits: string }> = {
  trial: {
    icon: Sparkles,
    color: "text-neutral-400",
    bg: "bg-neutral-500/15 border-neutral-500/20",
    label: "Trial",
    price: "Gratis",
    limits: "1 proyecto, 50 unidades",
  },
  proyecto: {
    icon: FolderOpen,
    color: "text-blue-400",
    bg: "bg-blue-500/15 border-blue-500/20",
    label: "Proyecto",
    price: "$149/mes",
    limits: "1 micrositio, 200 unidades",
  },
  studio: {
    icon: Zap,
    color: "text-purple-400",
    bg: "bg-purple-500/15 border-purple-500/20",
    label: "Studio",
    price: "$399/mes",
    limits: "5 proyectos, unidades ilimitadas",
  },
  enterprise: {
    icon: Crown,
    color: "text-[var(--site-primary)]",
    bg: "bg-[rgba(var(--site-primary-rgb),0.15)] border-[rgba(var(--site-primary-rgb),0.20)]",
    label: "Enterprise",
    price: "Custom",
    limits: "Ilimitado, white-label",
  },
};

export default function AdminPlanesPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/usuarios");
      if (!res.ok) throw new Error();
      setUsers(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Calculate plan distribution
  const planCounts: Record<string, number> = { trial: 0, proyecto: 0, studio: 0, enterprise: 0, none: 0 };
  for (const u of users) {
    if (u.plan && planCounts[u.plan] !== undefined) {
      planCounts[u.plan]++;
    } else {
      planCounts.none++;
    }
  }

  const groupedByPlan: Record<string, UserRow[]> = { trial: [], proyecto: [], studio: [], enterprise: [], none: [] };
  for (const u of users) {
    const key = u.plan && groupedByPlan[u.plan] ? u.plan : "none";
    groupedByPlan[key].push(u);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-[var(--site-primary)]" size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle size={28} className="text-amber-400 mb-3" />
        <p className="text-sm text-[var(--text-secondary)] mb-1">Error al cargar planes</p>
        <p className="text-[11px] text-[var(--text-muted)] mb-4">Verifica tu conexión e intenta de nuevo</p>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-all"
        >
          <RefreshCw size={13} /> Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-light text-[var(--text-primary)]">
          Planes
        </h1>
        <p className="text-[var(--text-tertiary)] text-sm mt-1">
          Distribución de planes y usuarios
        </p>
      </div>

      {/* Plan tier cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(PLAN_INFO).map(([key, info], i) => {
          const Icon = info.icon;
          const count = planCounts[key] || 0;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-5 hover:border-[var(--border-default)] transition-all"
            >
              <div className={`w-10 h-10 rounded-lg ${info.bg} border flex items-center justify-center mb-4`}>
                <Icon size={18} className={info.color} />
              </div>
              <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] mb-1">
                {info.label}
              </h3>
              <p className="text-[11px] text-[var(--text-tertiary)] mb-3">{info.price}</p>
              <p className="text-[10px] text-[var(--text-muted)] mb-4">{info.limits}</p>
              <div className="flex items-center gap-2 pt-3 border-t border-[var(--border-subtle)]">
                <Users size={14} className={info.color} />
                <span className="font-heading text-lg font-light text-white">{count}</span>
                <span className="text-[10px] text-[var(--text-muted)]">usuarios</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Sin plan section */}
      {planCounts.none > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[var(--surface-3)] border border-[var(--border-subtle)] flex items-center justify-center">
              <Package size={14} className="text-[var(--text-muted)]" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[var(--text-primary)]">
                Sin plan asignado
              </h3>
              <p className="text-[10px] text-[var(--text-muted)]">
                {planCounts.none} usuario{planCounts.none !== 1 ? "s" : ""} sin plan.
                Asigna planes desde la sección de Usuarios.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {groupedByPlan.none.map((u) => (
              <span
                key={u.id}
                className="px-2.5 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-tertiary)]"
              >
                {u.email}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Users per plan */}
      {(["trial", "proyecto", "studio", "enterprise"] as const).map((planKey) => {
        const planUsers = groupedByPlan[planKey];
        if (planUsers.length === 0) return null;
        const info = PLAN_INFO[planKey];
        return (
          <motion.div
            key={planKey}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--surface-2)] flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md font-ui text-[10px] font-bold uppercase tracking-wider ${info.bg} border ${info.color}`}>
                {info.label}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">{planUsers.length} usuario{planUsers.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="divide-y divide-[var(--border-subtle)]">
              {planUsers.map((u) => (
                <div key={u.id} className="px-5 py-3 flex items-center justify-between hover:bg-[var(--surface-2)] transition-colors">
                  <span className="text-xs text-[var(--text-secondary)]">{u.email}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {u.projectCount} proyecto{u.projectCount !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
