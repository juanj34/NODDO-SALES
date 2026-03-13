"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  CreditCard,
  ArrowLeft,
  LogOut,
  Loader2,
  Menu,
  X,
  Shield,
  MessageSquare,
  Activity,
  HardDrive,
  ShieldCheck,
} from "lucide-react";
import { ToastProvider } from "@/components/dashboard/Toast";
import { ConfirmProvider } from "@/components/dashboard/ConfirmModal";
import { AuthContextProvider, useAuthRole } from "@/hooks/useAuthContext";
import { NodDoLogo } from "@/components/ui/NodDoLogo";
import { AlertsBell } from "@/components/admin/AlertsBell";
import { createClient } from "@/lib/supabase/client";
import { useMobileDrawer } from "@/hooks/useMobileDrawer";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "/admin/proyectos", label: "Proyectos", icon: FolderOpen },
  { href: "/admin/leads", label: "Leads", icon: MessageSquare },
  { href: "/admin/planes", label: "Planes", icon: CreditCard },
  { href: "/admin/actividad", label: "Actividad", icon: Activity },
  { href: "/admin/storage", label: "Storage", icon: HardDrive },
  { href: "/admin/admins", label: "Admins", icon: ShieldCheck },
];

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isPlatformAdmin, loading, user } = useAuthRole();
  const [ready, setReady] = useState(false);
  const supabase = createClient();
  const { isMobile, open: drawerOpen, toggle: toggleDrawer, close: closeDrawer } = useMobileDrawer();

  useEffect(() => {
    if (!loading) {
      if (!isPlatformAdmin) {
        router.replace("/proyectos");
      } else {
        setReady(true);
      }
    }
  }, [loading, isPlatformAdmin, router]);

  if (loading || !ready) {
    return (
      <div className="min-h-screen bg-[var(--surface-0)] flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--site-primary)]" size={32} />
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen relative bg-[var(--surface-0)] text-white flex">
      {/* Atmosphere */}
      <div className="bg-grid-lines-subtle fixed inset-0 pointer-events-none z-0" />
      <div className="bg-noise fixed inset-0 pointer-events-none z-0" />

      {/* Mobile hamburger */}
      <button
        onClick={toggleDrawer}
        className="fixed top-4 left-4 z-50 md:hidden w-11 h-11 flex items-center justify-center bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl transition-colors hover:bg-[var(--surface-3)]"
        aria-label="Toggle menu"
      >
        {drawerOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeDrawer}
            className="fixed inset-0 z-[39] bg-black/60 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "w-64 bg-[var(--surface-1)] border-r border-[var(--border-subtle)] flex flex-col",
          "fixed inset-y-0 left-0 z-[40] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          "md:relative md:translate-x-0",
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo + Admin badge */}
        <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <Link href="/admin" className="hover:opacity-80 transition-opacity flex items-center gap-3" onClick={closeDrawer}>
            <NodDoLogo height={18} colorNod="var(--text-primary)" colorDo="var(--site-primary)" />
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/15 border border-red-500/20">
              <Shield size={10} className="text-red-400" />
              <span className="font-ui text-[9px] font-bold uppercase tracking-wider text-red-400">Admin</span>
            </span>
          </Link>
          <AlertsBell />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeDrawer}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-[0.625rem] font-ui text-xs font-semibold uppercase tracking-[0.08em] transition-all",
                  isActive
                    ? "bg-[var(--surface-2)] text-white border-l-2 border-[var(--site-primary)]"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                )}
                style={
                  isActive
                    ? { boxShadow: "inset 3px 0 8px -2px rgba(var(--site-primary-rgb), 0.15)" }
                    : undefined
                }
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Back to dashboard */}
        <div className="px-4 pb-2">
          <Link
            href="/proyectos"
            onClick={closeDrawer}
            className="flex items-center gap-3 px-3 py-2 rounded-[0.625rem] font-ui text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-all"
          >
            <ArrowLeft size={14} />
            Dashboard
          </Link>
        </div>

        {/* User section */}
        <div className="p-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{
                background: "linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.1))",
                boxShadow: "0 0 0 1.5px rgba(239,68,68,0.3)",
                color: "#ef4444",
              }}
            >
              {user?.email?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-[var(--text-tertiary)] truncate block">
                {user?.email || "\u2014"}
              </span>
              <span className="font-ui text-[10px] text-red-400 font-bold uppercase tracking-wider">
                Platform Admin
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-[var(--text-muted)] hover:text-red-400 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 relative z-10 bg-transparent overflow-y-auto pt-14 md:pt-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="min-h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AuthContextProvider>
          <AdminShell>{children}</AdminShell>
        </AuthContextProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}
