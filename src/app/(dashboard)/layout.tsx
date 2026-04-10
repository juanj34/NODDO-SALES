"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  FolderOpen, Users, Settings, LogOut, Loader2, HelpCircle,
  Menu, X, Shield, ToggleLeft, Calculator, ContactRound,
  BarChart3, FileText, LayoutDashboard, CircleDollarSign, Clock,
  ExternalLink,
} from "lucide-react";
import { ToastProvider } from "@/components/dashboard/Toast";
import { ConfirmProvider } from "@/components/dashboard/ConfirmModal";
import { CommandPalette } from "@/components/dashboard/CommandPalette";
import { useTranslation } from "@/i18n";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { AuthContextProvider, useAuthRole } from "@/hooks/useAuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { ROLE_LABELS } from "@/lib/permissions";
import { NodDoLogo } from "@/components/ui/NodDoLogo";
import { useMobileDrawer } from "@/hooks/useMobileDrawer";
import { RouteProgressBar } from "@/components/ui/RouteProgressBar";
import { CrispSupport } from "@/components/dashboard/CrispSupport";
import { UploadProvider } from "@/contexts/UploadContext";
import { NotificationBell } from "@/components/dashboard/NotificationBell";

// SidebarProject interface removed - no longer using dropdown

/* ── Active link helper ─────────────────────────────────── */

function SidebarLink({
  href,
  icon: Icon,
  label,
  pathname,
  onClick,
  iconSize = 16,
  className: extraClass,
  exact,
}: {
  href: string;
  icon: React.ComponentType<{ size: number }>;
  label: string;
  pathname: string;
  onClick?: () => void;
  iconSize?: number;
  className?: string;
  exact?: boolean;
}) {
  const isActive = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-[0.625rem] font-ui text-xs font-semibold uppercase tracking-[0.08em] transition-all",
        isActive
          ? "bg-[var(--surface-2)] text-white border-l-2 border-[var(--site-primary)]"
          : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]",
        extraClass
      )}
      style={
        isActive
          ? { boxShadow: "inset 3px 0 8px -2px rgba(var(--site-primary-rgb), 0.15)" }
          : undefined
      }
    >
      <Icon size={iconSize} />
      {label}
    </Link>
  );
}

/* ── Dashboard Shell ────────────────────────────────────── */

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation("dashboard");
  const { user, role, isPlatformAdmin, profile, loading } = useAuthRole();
  const { can, isAdmin, isCollaborator } = usePermissions();
  const { open: drawerOpen, toggle: toggleDrawer, close: closeDrawer } = useMobileDrawer();

  // Sidebar projects state removed - using simple link now

  // Editor gets its own layout (has its own sidebar)
  if (pathname.startsWith("/editor/")) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface-0)] flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--site-primary)]" size={32} />
      </div>
    );
  }

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  // isAdmin and can() now come from usePermissions()

  return (
    <div className="min-h-screen relative bg-[var(--surface-0)] text-white flex">
      {/* Gold grid + noise atmosphere */}
      <div className="bg-grid-lines-subtle fixed inset-0 pointer-events-none z-0" />
      <div className="bg-noise fixed inset-0 pointer-events-none z-0" />

      {/* Route progress bar */}
      <RouteProgressBar color="var(--site-primary)" />

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette />

      {/* Mobile hamburger button */}
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
          "md:sticky md:top-0 md:h-screen md:translate-x-0",
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo + Notifications */}
        <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <Link href="/dashboard" className="hover:opacity-80 transition-opacity" onClick={closeDrawer}>
            <NodDoLogo height={18} colorNod="var(--text-primary)" colorDo="var(--site-primary)" />
          </Link>
          <NotificationBell />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-hidden">
          {/* ── HOME ─────────────────────────────── */}
          <SidebarLink
            href="/dashboard"
            icon={LayoutDashboard}
            label={t("sidebar.home")}
            pathname={pathname}
            onClick={closeDrawer}
            exact
          />

          {/* ── PROYECTOS section ────────────────── */}
          <SidebarLink
            href="/proyectos"
            icon={FolderOpen}
            label={t("sidebar.projects")}
            pathname={pathname}
            onClick={closeDrawer}
          />

          {/* ── Divider ────────────────────────── */}
          <div className="!my-3 h-px bg-[var(--border-subtle)]" />

          {/* ── HERRAMIENTAS section ─────────────── */}
          <div className="px-3 py-1.5">
            <span className="font-ui text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {t("sidebar.tools")}
            </span>
          </div>
          <SidebarLink
            href="/disponibilidad"
            icon={ToggleLeft}
            label={t("sidebar.disponibilidad")}
            pathname={pathname}
            onClick={closeDrawer}
            iconSize={15}
          />
          <SidebarLink
            href="/cotizador"
            icon={Calculator}
            label={t("sidebar.cotizador")}
            pathname={pathname}
            onClick={closeDrawer}
            iconSize={15}
          />

          {/* ── Divider ────────────────────────── */}
          <div className="!my-3 h-px bg-[var(--border-subtle)]" />

          {/* ── DATOS section ──────────────────── */}
          <div className="px-3 py-1.5">
            <span className="font-ui text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {t("sidebar.data")}
            </span>
          </div>
          <SidebarLink
            href="/leads"
            icon={ContactRound}
            label={t("sidebar.registros")}
            pathname={pathname}
            onClick={closeDrawer}
            iconSize={15}
          />
          <SidebarLink
            href="/cotizaciones"
            icon={FileText}
            label="Cotizaciones"
            pathname={pathname}
            onClick={closeDrawer}
            iconSize={15}
          />
          {can("analytics.read") && (
            <SidebarLink
              href="/analytics"
              icon={BarChart3}
              label="Analytics"
              pathname={pathname}
              onClick={closeDrawer}
              iconSize={15}
            />
          )}
          {can("financiero.read") && (
            <SidebarLink
              href="/financiero"
              icon={CircleDollarSign}
              label={t("sidebar.financiero")}
              pathname={pathname}
              onClick={closeDrawer}
              iconSize={15}
            />
          )}
          {can("bitacora.read") && (
            <SidebarLink
              href="/bitacora"
              icon={Clock}
              label={t("sidebar.bitacora")}
              pathname={pathname}
              onClick={closeDrawer}
              iconSize={15}
            />
          )}

          {/* ── Divider ────────────────────────── */}
          <div className="!my-3 h-px bg-[var(--border-subtle)]" />

          {/* ── EQUIPO (admin only) ──────────────── */}
          {can("team.manage") && (
            <SidebarLink
              href="/equipo"
              icon={Users}
              label={t("sidebar.team")}
              pathname={pathname}
              onClick={closeDrawer}
            />
          )}

          {/* ── CUENTA ──────────────────────────── */}
          <SidebarLink
            href="/cuenta"
            icon={Settings}
            label={t("sidebar.settings")}
            pathname={pathname}
            onClick={closeDrawer}
          />
        </nav>

        {/* Platform Admin link */}
        {isPlatformAdmin && (
          <div className="px-4 pb-1">
            <Link
              href="/admin"
              onClick={closeDrawer}
              className="flex items-center gap-3 px-3 py-2 rounded-[0.625rem] font-ui text-xs font-semibold uppercase tracking-[0.08em] text-red-400/60 hover:text-red-400 hover:bg-red-500/8 transition-all"
            >
              <Shield size={14} />
              Admin
            </Link>
          </div>
        )}

        {/* Help — visible link */}
        <div className="px-4 pb-1">
          <a
            href="/ayuda"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-[0.625rem] font-ui text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] hover:text-[var(--site-primary)] hover:bg-[rgba(var(--site-primary-rgb),0.06)] transition-all"
          >
            <HelpCircle size={16} />
            {t("sidebar.help")}
            <ExternalLink size={10} className="ml-auto text-[var(--text-muted)]" />
          </a>
        </div>

        {/* Language toggle */}
        <div className="px-4 py-3 flex items-center justify-center">
          <LanguageToggle />
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-3 px-3 py-2">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-8 h-8 rounded-full object-cover shrink-0"
                style={{ boxShadow: `0 0 0 1.5px rgba(var(--site-primary-rgb), 0.3)` }}
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                  background: `linear-gradient(135deg, rgba(var(--site-primary-rgb), 0.3), rgba(var(--site-primary-rgb), 0.1))`,
                  boxShadow: `0 0 0 1.5px rgba(var(--site-primary-rgb), 0.3)`,
                  color: "var(--site-primary)",
                }}
              >
                {profile?.nombre ? profile.nombre.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {profile?.nombre ? (
                <>
                  <span className="text-xs text-[var(--text-primary)] font-medium truncate block">
                    {profile.nombre} {profile.apellido}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] truncate block">
                    {user?.email || "\u2014"}
                  </span>
                </>
              ) : (
                <span className="text-xs text-[var(--text-tertiary)] truncate block">
                  {user?.email || "\u2014"}
                </span>
              )}
              {isCollaborator && role && (
                <span className="font-ui text-[10px] text-[var(--site-primary)] font-bold uppercase tracking-wider">
                  {ROLE_LABELS[role]}
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="text-[var(--text-muted)] hover:text-red-400 transition-colors"
              title={t("sidebar.logout")}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 relative z-10 bg-transparent overflow-y-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AuthContextProvider>
          <UploadProvider>
            <DashboardShell>{children}</DashboardShell>
            <CrispSupport />
          </UploadProvider>
        </AuthContextProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}
