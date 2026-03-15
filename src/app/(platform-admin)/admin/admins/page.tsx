"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useToast } from "@/components/dashboard/Toast";
import { useConfirm } from "@/components/dashboard/ConfirmModal";
import { useAuthRole } from "@/hooks/useAuthContext";
import type { PlatformAdmin } from "@/types";

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<PlatformAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const { confirm } = useConfirm();
  const { user } = useAuthRole();

  const fetchAdmins = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/admins");
      if (!res.ok) throw new Error();
      setAdmins(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAdd = async () => {
    if (!newEmail.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al agregar admin");
        return;
      }
      toast.success("Admin agregado correctamente");
      setShowModal(false);
      setNewEmail("");
      fetchAdmins();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (admin: PlatformAdmin) => {
    const ok = await confirm({
      title: "Remover administrador",
      message: `¿Remover a ${admin.email} como administrador de plataforma?`,
      confirmLabel: "Remover",
      variant: "danger",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/admins/${admin.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al remover admin");
        return;
      }
      toast.success("Admin removido");
      fetchAdmins();
    } catch {
      toast.error("Error de conexión");
    }
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-light text-[var(--text-primary)]">
            Administradores
          </h1>
          <p className="text-[var(--text-tertiary)] text-sm mt-1">
            Usuarios con acceso al panel de plataforma
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs font-ui font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-all"
        >
          <Plus size={13} />
          Agregar Admin
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-[var(--site-primary)]" size={28} />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertTriangle size={28} className="text-amber-400 mb-3" />
          <p className="text-sm text-[var(--text-secondary)] mb-1">Error al cargar administradores</p>
          <button
            onClick={fetchAdmins}
            className="flex items-center gap-2 px-4 py-2 mt-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-all"
          >
            <RefreshCw size={13} /> Reintentar
          </button>
        </div>
      ) : (
        <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-2)]">
                  <th className="text-left px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Agregado
                  </th>
                  <th className="text-right px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a, i) => {
                  const isSelf = a.user_id === user?.id;
                  return (
                    <motion.tr
                      key={a.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className={`border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--surface-2)] transition-colors ${isSelf ? "bg-[rgba(184,151,58,0.04)]" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                            style={{
                              background: "linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.1))",
                              boxShadow: "0 0 0 1.5px rgba(239,68,68,0.3)",
                              color: "#ef4444",
                            }}
                          >
                            {a.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs text-[var(--text-primary)]">{a.email}</span>
                            {isSelf && (
                              <span className="ml-2 px-1.5 py-0.5 rounded font-ui text-[8px] font-bold uppercase tracking-wider text-[var(--site-primary)] bg-[rgba(184,151,58,0.15)]">
                                Tú
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[var(--text-tertiary)]">{formatDate(a.created_at)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(a)}
                          disabled={isSelf}
                          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                          title={isSelf ? "No puedes removerte a ti mismo" : "Remover admin"}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {admins.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShieldCheck size={24} className="text-[var(--text-muted)] mb-3" />
              <p className="text-sm text-[var(--text-tertiary)]">No hay administradores registrados</p>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--surface-2)] border border-[var(--border-default)] rounded-xl p-6 w-full max-w-md mx-4 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-light text-white">Agregar Administrador</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mb-4">
              El usuario debe existir en la plataforma. Ingresa su email de registro.
            </p>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              className="input-glass w-full text-sm mb-4"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              autoFocus
            />
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-xs text-[var(--text-tertiary)] hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                disabled={!newEmail.trim() || submitting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--site-primary)] text-black font-ui text-xs font-bold uppercase tracking-wider disabled:opacity-50 hover:brightness-110 transition-all"
              >
                {submitting && <Loader2 size={12} className="animate-spin" />}
                Agregar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
