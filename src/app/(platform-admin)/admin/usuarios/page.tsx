"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Users,
  Search,
  Loader2,
  FolderOpen,
  MessageSquare,
  Ban,
  CheckCircle,
  X,
  AlertTriangle,
  RefreshCw,
  Trash2,
  ChevronRight,
  Mail,
  Calendar,
  Shield,
  Edit2,
  Download,
} from "lucide-react";
import { useToast } from "@/components/dashboard/Toast";
import { useConfirm } from "@/components/dashboard/ConfirmModal";

interface UserRow {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  projectCount: number;
  leadCount: number;
}

interface UserDetail {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  banned: boolean;
  projects: { id: string; nombre: string; slug: string; estado: string; created_at: string; render_principal_url: string | null }[];
  leadCount: number;
}

const estadoColors: Record<string, string> = {
  publicado: "text-emerald-400 bg-emerald-500/15 border-emerald-500/20",
  borrador: "text-amber-400 bg-amber-500/15 border-amber-500/20",
  archivado: "text-neutral-400 bg-neutral-500/15 border-neutral-500/20",
};

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const toast = useToast();
  const { confirm } = useConfirm();

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

  const fetchUserDetail = async (userId: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/usuarios/${userId}`);
      if (res.ok) {
        setUserDetail(await res.json());
      }
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleExpandUser = (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
      setUserDetail(null);
    } else {
      setExpandedUser(userId);
      fetchUserDetail(userId);
    }
  };

  const filtered = search
    ? users.filter((u) => u.email.toLowerCase().includes(search.toLowerCase()))
    : users;

  const handleToggleBan = async (userId: string, ban: boolean) => {
    const ok = await confirm({
      title: ban ? "Suspender usuario" : "Reactivar usuario",
      message: ban
        ? "El usuario no podrá acceder a su cuenta ni a sus proyectos."
        : "El usuario podrá acceder nuevamente a su cuenta.",
      confirmLabel: ban ? "Suspender" : "Reactivar",
      variant: ban ? "danger" : "warning",
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/usuarios/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ banned: ban }),
    });
    if (res.ok) {
      toast.success(ban ? "Usuario suspendido" : "Usuario reactivado");
      await fetchUsers();
      if (expandedUser === userId) fetchUserDetail(userId);
    } else {
      toast.error("Error al actualizar usuario");
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    const ok = await confirm({
      title: "Eliminar usuario",
      message: `Se eliminará "${email}" permanentemente. Sus proyectos serán archivados y sus datos de plan eliminados. Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar",
      variant: "danger",
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/usuarios/${userId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Usuario eliminado");
      setExpandedUser(null);
      setUserDetail(null);
      await fetchUsers();
    } else {
      const data = await res.json();
      toast.error(data.error || "Error al eliminar");
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
  };

  const handleExportCSV = () => {
    const headers = ["Email", "Proyectos", "Leads", "Fecha Registro"];
    const rows = filtered.map((u) => [
      u.email,
      u.projectCount,
      u.leadCount,
      u.created_at,
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usuarios-noddo-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} usuarios exportados`);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-light text-[var(--text-primary)]">
            Usuarios
          </h1>
          <p className="text-[var(--text-tertiary)] text-sm mt-1">
            {users.length} usuarios registrados
          </p>
        </div>
        {users.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs font-ui font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-all"
          >
            <Download size={13} />
            Exportar CSV
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por email..."
          className="input-glass w-full pl-10 text-sm"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-[var(--site-primary)]" size={28} />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertTriangle size={28} className="text-amber-400 mb-3" />
          <p className="text-sm text-[var(--text-secondary)] mb-1">Error al cargar usuarios</p>
          <p className="text-[11px] text-[var(--text-muted)] mb-4">Verifica tu conexión e intenta de nuevo</p>
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-all"
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
                  <th className="w-8" />
                  <th className="text-left px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Registro
                  </th>
                  <th className="text-left px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Último Acceso
                  </th>
                  <th className="text-center px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    <FolderOpen size={12} className="inline mr-1" />
                    Proy
                  </th>
                  <th className="text-center px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    <MessageSquare size={12} className="inline mr-1" />
                    Leads
                  </th>
                  <th className="text-right px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, i) => (
                  <>
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className={`border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--surface-2)] transition-colors cursor-pointer ${expandedUser === user.id ? "bg-[var(--surface-2)]" : ""}`}
                      onClick={() => handleExpandUser(user.id)}
                    >
                      <td className="pl-3 py-3">
                        <ChevronRight
                          size={14}
                          className={`text-[var(--text-muted)] transition-transform ${expandedUser === user.id ? "rotate-90" : ""}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[var(--text-primary)]">{user.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[var(--text-tertiary)]">
                          {formatDate(user.created_at)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.last_sign_in_at ? (
                          <span className="text-xs text-[var(--text-tertiary)]">
                            {formatDate(user.last_sign_in_at)}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-neutral-500/15 border border-neutral-500/20 font-ui text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                            Nunca
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-[var(--text-secondary)]">{user.projectCount}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-[var(--text-secondary)]">{user.leadCount}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleToggleBan(user.id, !userDetail?.banned)}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-ui font-bold uppercase tracking-wider text-[var(--text-tertiary)] hover:text-amber-400 hover:bg-[var(--surface-3)] transition-all"
                            title={userDetail?.banned ? "Reactivar" : "Suspender"}
                          >
                            <Ban size={11} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-ui font-bold uppercase tracking-wider text-[var(--text-tertiary)] hover:text-red-400 hover:bg-[var(--surface-3)] transition-all"
                            title="Eliminar"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>

                    {/* Expanded detail row */}
                    <AnimatePresence>
                      {expandedUser === user.id && (
                        <motion.tr
                          key={`${user.id}-detail`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-b border-[var(--border-subtle)]"
                        >
                          <td colSpan={7} className="p-0">
                            <div className="px-6 py-5 bg-[var(--surface-2)]/50">
                              {loadingDetail ? (
                                <div className="flex items-center justify-center py-8">
                                  <Loader2 className="animate-spin text-[var(--site-primary)]" size={20} />
                                </div>
                              ) : userDetail ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  {/* User info */}
                                  <div className="space-y-3">
                                    <h4 className="font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                      Información
                                    </h4>
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 text-xs">
                                        <Mail size={12} className="text-[var(--text-muted)]" />
                                        <span className="text-[var(--text-secondary)]">{userDetail.email}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs">
                                        <Calendar size={12} className="text-[var(--text-muted)]" />
                                        <span className="text-[var(--text-tertiary)]">Registrado: {formatDate(userDetail.created_at)}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs">
                                        <Calendar size={12} className="text-[var(--text-muted)]" />
                                        <span className="text-[var(--text-tertiary)]">
                                          Último acceso: {userDetail.last_sign_in_at ? formatDate(userDetail.last_sign_in_at) : "Nunca"}
                                        </span>
                                      </div>
                                      {userDetail.banned && (
                                        <div className="flex items-center gap-2 text-xs">
                                          <Shield size={12} className="text-red-400" />
                                          <span className="text-red-400 font-semibold">Suspendido</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex flex-wrap gap-2 pt-2">
                                      <button
                                        onClick={() => {
                                          const subject = encodeURIComponent("NODDO - Actualización de tu cuenta");
                                          const body = encodeURIComponent(`Hola,\n\nNos comunicamos desde NODDO respecto a tu cuenta.\n\nSaludos,\nEquipo NODDO`);
                                          window.location.href = `mailto:${userDetail.email}?subject=${subject}&body=${body}`;
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-ui font-bold uppercase tracking-wider text-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.1)] border border-[rgba(var(--site-primary-rgb),0.2)] hover:bg-[rgba(var(--site-primary-rgb),0.2)] transition-all"
                                      >
                                        <Mail size={11} />
                                        Enviar Email
                                      </button>
                                      <button
                                        onClick={() => handleToggleBan(userDetail.id, !userDetail.banned)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-ui font-bold uppercase tracking-wider border transition-all ${
                                          userDetail.banned
                                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20"
                                            : "text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20"
                                        }`}
                                      >
                                        {userDetail.banned ? <CheckCircle size={11} /> : <Ban size={11} />}
                                        {userDetail.banned ? "Reactivar" : "Suspender"}
                                      </button>
                                      <button
                                        onClick={() => handleDeleteUser(userDetail.id, userDetail.email)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-ui font-bold uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
                                      >
                                        <Trash2 size={11} />
                                        Eliminar
                                      </button>
                                    </div>
                                  </div>

                                  {/* Projects */}
                                  <div className="md:col-span-2 space-y-3">
                                    <h4 className="font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                      Proyectos ({userDetail.projects.length})
                                    </h4>
                                    {userDetail.projects.length > 0 ? (
                                      <div className="space-y-2">
                                        {userDetail.projects.map((proj) => (
                                          <div
                                            key={proj.id}
                                            className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-3)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all"
                                          >
                                            <div className="flex items-center gap-3">
                                              {proj.render_principal_url ? (
                                                <div className="w-10 h-7 rounded overflow-hidden bg-[var(--surface-4)] shrink-0">
                                                  <Image src={proj.render_principal_url} alt="undefined" fill className="w-full h-full object-cover" />
                                                </div>
                                              ) : (
                                                <div className="w-10 h-7 rounded bg-[var(--surface-4)] flex items-center justify-center shrink-0">
                                                  <FolderOpen size={12} className="text-[var(--text-muted)]" />
                                                </div>
                                              )}
                                              <div>
                                                <p className="text-xs text-[var(--text-primary)] font-medium">{proj.nombre}</p>
                                                <p className="text-[10px] text-[var(--text-muted)]">{proj.slug}.noddo.io</p>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className={`px-2 py-0.5 rounded-md font-ui text-[10px] font-bold uppercase tracking-wider border ${estadoColors[proj.estado] || estadoColors.borrador}`}>
                                                {proj.estado}
                                              </span>
                                              <Link
                                                href={`/editor/${proj.id}`}
                                                className="text-[var(--text-muted)] hover:text-[var(--site-primary)] transition-colors"
                                                title="Abrir editor"
                                              >
                                                <Edit2 size={12} />
                                              </Link>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-[11px] text-[var(--text-muted)] py-4 text-center">
                                        Sin proyectos
                                      </p>
                                    )}

                                    {/* Leads summary */}
                                    <div className="flex items-center gap-2 pt-2">
                                      <MessageSquare size={12} className="text-[var(--text-muted)]" />
                                      <span className="text-xs text-[var(--text-tertiary)]">
                                        {userDetail.leadCount} lead{userDetail.leadCount !== 1 ? "s" : ""} total
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users size={24} className="text-[var(--text-muted)] mb-3" />
              <p className="text-sm text-[var(--text-tertiary)]">
                {search ? "No se encontraron usuarios" : "No hay usuarios registrados"}
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
