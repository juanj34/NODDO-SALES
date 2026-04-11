"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/dashboard/Toast";
import { useConfirm } from "@/components/dashboard/ConfirmModal";
import {
  Receipt,
  Plus,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Loader2,
  Search,
  Filter,
} from "lucide-react";

/* ── Types ── */

interface Invoice {
  id: string;
  user_id: string;
  proyecto_id: string | null;
  invoice_number: string;
  plan: string;
  amount: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  billing_period_start: string | null;
  billing_period_end: string | null;
  due_date: string | null;
  paid_at: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  user_email: string;
  proyecto_nombre: string | null;
}

/* ── Status config ── */

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  draft: { label: "Borrador", icon: FileText, color: "text-neutral-400 bg-neutral-500/15 border-neutral-500/20" },
  sent: { label: "Enviada", icon: Send, color: "text-blue-400 bg-blue-500/15 border-blue-500/20" },
  paid: { label: "Pagada", icon: CheckCircle, color: "text-green-400 bg-green-500/15 border-green-500/20" },
  overdue: { label: "Vencida", icon: AlertTriangle, color: "text-red-400 bg-red-500/15 border-red-500/20" },
  cancelled: { label: "Cancelada", icon: XCircle, color: "text-neutral-400 bg-neutral-500/15 border-neutral-500/20" },
};

const STATUS_FILTERS = ["all", "draft", "sent", "paid", "overdue", "cancelled"] as const;

/* ── Helpers ── */

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount);
}

/* ── Page ── */

export default function FacturacionPage() {
  const toast = useToast();
  const { confirm } = useConfirm();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create form state
  const [createForm, setCreateForm] = useState({
    user_id: "",
    proyecto_id: "",
    plan: "pro",
    amount: 249,
    currency: "USD",
    notes: "",
  });
  const [creating, setCreating] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/invoices?${params}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
      }
    } catch {
      toast.error("Error al cargar facturas");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handleCreateInvoice = async () => {
    if (!createForm.user_id) {
      toast.error("Selecciona un usuario");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: createForm.user_id,
          proyecto_id: createForm.proyecto_id || undefined,
          plan: createForm.plan,
          amount: createForm.amount,
          currency: createForm.currency,
          notes: createForm.notes || undefined,
        }),
      });
      if (res.ok) {
        toast.success("Factura creada");
        setShowCreateModal(false);
        setCreateForm({ user_id: "", proyecto_id: "", plan: "pro", amount: 249, currency: "USD", notes: "" });
        await fetchInvoices();
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al crear factura");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (invoiceId: string, newStatus: string, paymentMethod?: string) => {
    const res = await fetch(`/api/admin/invoices/${invoiceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, payment_method: paymentMethod }),
    });
    if (res.ok) {
      toast.success(`Factura actualizada a ${statusConfig[newStatus]?.label || newStatus}`);
      await fetchInvoices();
    } else {
      toast.error("Error al actualizar factura");
    }
  };

  const handleMarkPaid = async (invoice: Invoice) => {
    const ok = await confirm({
      title: "Marcar como pagada",
      message: `¿Confirmar pago de ${formatCurrency(invoice.amount, invoice.currency)} para ${invoice.user_email}?`,
      confirmLabel: "Confirmar pago",
    });
    if (!ok) return;
    await handleStatusChange(invoice.id, "paid", "manual");
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    await handleStatusChange(invoice.id, "sent");
  };

  // Filter invoices
  const filtered = invoices.filter((inv) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        inv.invoice_number.toLowerCase().includes(q) ||
        inv.user_email.toLowerCase().includes(q) ||
        (inv.proyecto_nombre || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPIs
  const totalMRR = invoices
    .filter((i) => i.status === "paid" || i.status === "sent")
    .reduce((sum, i) => sum + i.amount, 0);
  const pendingCount = invoices.filter((i) => i.status === "sent" || i.status === "draft").length;
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;
  const paidThisMonth = invoices
    .filter((i) => {
      if (i.status !== "paid" || !i.paid_at) return false;
      const paid = new Date(i.paid_at);
      const now = new Date();
      return paid.getMonth() === now.getMonth() && paid.getFullYear() === now.getFullYear();
    })
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-heading text-2xl font-light text-[var(--text-primary)]">Facturación</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            Gestiona facturas, pagos y cobros de suscripciones
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-warm py-2.5 px-5 text-xs inline-flex items-center gap-2"
        >
          <Plus size={14} />
          <span className="font-ui font-bold uppercase tracking-[0.08em]">Nueva Factura</span>
        </button>
      </motion.div>

      {/* KPI Strip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "MRR Activo", value: formatCurrency(totalMRR), icon: TrendingUp, color: "text-green-400" },
          { label: "Pendientes", value: String(pendingCount), icon: Clock, color: "text-blue-400" },
          { label: "Vencidas", value: String(overdueCount), icon: AlertTriangle, color: overdueCount > 0 ? "text-red-400" : "text-neutral-400" },
          { label: "Cobrado este mes", value: formatCurrency(paidThisMonth), icon: DollarSign, color: "text-[var(--site-primary)]" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-[1.25rem] p-4"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon size={14} className={kpi.color} />
              <span className="font-ui text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{kpi.label}</span>
            </div>
            <span className="font-mono text-xl font-medium text-[var(--text-primary)]">{kpi.value}</span>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
      >
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar factura, email, proyecto..."
            className="input-glass w-full pl-10 pr-4 py-2 text-xs"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-lg font-ui text-[10px] font-bold uppercase tracking-wider border transition-all",
                statusFilter === s
                  ? "bg-[var(--surface-3)] text-[var(--text-primary)] border-[var(--border-strong)]"
                  : "bg-transparent text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-secondary)]"
              )}
            >
              {s === "all" ? "Todas" : statusConfig[s]?.label || s}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Invoice Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-[1.25rem] overflow-hidden"
        style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[var(--site-primary)]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Receipt size={32} className="text-[var(--text-muted)] mb-3" />
            <p className="text-sm text-[var(--text-tertiary)]">No hay facturas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {["# Factura", "Cliente", "Proyecto", "Plan", "Monto", "Status", "Vencimiento", "Acciones"].map((h) => (
                    <th key={h} className="px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => {
                  const sc = statusConfig[inv.status] || statusConfig.draft;
                  const StatusIcon = sc.icon;
                  return (
                    <tr
                      key={inv.id}
                      className="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-2)]/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-[var(--text-primary)]">{inv.invoice_number}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[var(--text-secondary)]">{inv.user_email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[var(--text-tertiary)]">{inv.proyecto_nombre || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                          {inv.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-medium text-[var(--text-primary)]">
                          {formatCurrency(inv.amount, inv.currency)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-ui text-[10px] font-bold uppercase tracking-wider border ${sc.color}`}>
                          <StatusIcon size={10} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-[var(--text-tertiary)]">
                          {formatDate(inv.due_date)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {inv.status === "draft" && (
                            <button
                              onClick={() => handleSendInvoice(inv)}
                              className="px-2 py-1 rounded-md text-[10px] font-ui font-bold uppercase tracking-wider text-blue-400 hover:bg-blue-500/10 transition-colors"
                              title="Enviar factura"
                            >
                              Enviar
                            </button>
                          )}
                          {(inv.status === "sent" || inv.status === "overdue") && (
                            <button
                              onClick={() => handleMarkPaid(inv)}
                              className="px-2 py-1 rounded-md text-[10px] font-ui font-bold uppercase tracking-wider text-green-400 hover:bg-green-500/10 transition-colors"
                              title="Marcar como pagada"
                            >
                              Pagada
                            </button>
                          )}
                          {inv.status !== "cancelled" && inv.status !== "paid" && (
                            <button
                              onClick={() => handleStatusChange(inv.id, "cancelled")}
                              className="px-2 py-1 rounded-md text-[10px] font-ui font-bold uppercase tracking-wider text-neutral-400 hover:bg-neutral-500/10 transition-colors"
                              title="Cancelar"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowCreateModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-card w-full max-w-md p-6 mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-heading text-lg font-light text-[var(--text-primary)] mb-4">Nueva Factura</h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">User ID</label>
                <input
                  type="text"
                  value={createForm.user_id}
                  onChange={(e) => setCreateForm((f) => ({ ...f, user_id: e.target.value }))}
                  placeholder="UUID del usuario"
                  className="input-glass w-full text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Proyecto ID (opcional)</label>
                <input
                  type="text"
                  value={createForm.proyecto_id}
                  onChange={(e) => setCreateForm((f) => ({ ...f, proyecto_id: e.target.value }))}
                  placeholder="UUID del proyecto"
                  className="input-glass w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1 block">Plan</label>
                  <select
                    value={createForm.plan}
                    onChange={(e) => {
                      const plan = e.target.value;
                      const amount = plan === "pro" ? 249 : 199;
                      setCreateForm((f) => ({ ...f, plan, amount }));
                    }}
                    className="input-glass w-full text-xs"
                  >
                    <option value="basico">Básico ($199)</option>
                    <option value="pro">Pro ($249)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1 block">Monto</label>
                  <input
                    type="number"
                    value={createForm.amount}
                    onChange={(e) => setCreateForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                    className="input-glass w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Notas (opcional)</label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Notas internas..."
                  rows={2}
                  className="input-glass w-full text-xs resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-ghost py-2 px-4 text-xs font-ui font-bold uppercase tracking-[0.08em]"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateInvoice}
                disabled={creating}
                className="btn-warm py-2 px-5 text-xs inline-flex items-center gap-2"
              >
                {creating && <Loader2 size={12} className="animate-spin" />}
                <span className="font-ui font-bold uppercase tracking-[0.08em]">Crear Factura</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
