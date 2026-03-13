"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { FolderOpen, Users, Settings, LogOut, Loader2, HelpCircle, Menu, X, Shield } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { ToastProvider } from "@/components/dashboard/Toast";
import { ConfirmProvider } from "@/components/dashboard/ConfirmModal";
import { CommandPalette } from "@/components/dashboard/CommandPalette";
import { useTranslation } from "@/i18n";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { AuthContextProvider, useAuthRole } from "@/hooks/useAuthContext";
import { NodDoLogo } from "@/components/ui/NodDoLogo";
import { useMobileDrawer } from "@/hooks/useMobileDrawer";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { t } = useTranslation("dashboard");
  const { role, isPlatformAdmin } = useAuthRole();
  const { isMobile, open: drawerOpen, toggle: toggleDrawer, close: closeDrawer } = useMobileDrawer();

  const navItems = useMemo(() => {
    const items = [
      { href: "/proyectos", label: t("sidebar.projects"), icon: FolderOpen },
    ];
    if (role === "admin") {
      items.push({ href: "/equipo", label: t("sidebar.team"), icon: Users });
    }
    items.push({ href: "/cuenta", label: t("sidebar.settings"), icon: Settings });
    return items;
  }, [role, t]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Editor gets its own layout (has its own sidebar)
  if (pathname.startsWith("/editor/")) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface-0)] flex items-center justify-center">
        <Loader2
          className="animate-spin text-[var(--site-primary)]"
          size={32}
        />
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen relative bg-[var(--surface-0)] text-white flex">
      {/* Gold grid + noise atmosphere */}
      <div className="bg-grid-lines-subtle fixed inset-0 pointer-events-none z-0" />
      <div className="bg-noise fixed inset-0 pointer-events-none z-0" />

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
          "md:relative md:translate-x-0",
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-[var(--border-subtle)]">
          <Link href="/proyectos" className="hover:opacity-80 transition-opacity" onClick={closeDrawer}>
            <NodDoLogo height={18} colorNod="var(--text-primary)" colorDo="var(--site-primary)" />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");
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
                    ? {
                      boxShadow:
                        "inset 3px 0 8px -2px rgba(var(--site-primary-rgb), 0.15)",
                    }
                    : undefined
                }
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
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

        {/* Help link */}
        <div className="px-4 pb-1">
          <Link
            href="/ayuda"
            onClick={closeDrawer}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-[0.625rem] font-ui text-xs font-semibold uppercase tracking-[0.08em] transition-all",
              pathname === "/ayuda"
                ? "bg-[var(--surface-2)] text-white border-l-2 border-[var(--site-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
            )}
            style={
              pathname === "/ayuda"
                ? {
                    boxShadow:
                      "inset 3px 0 8px -2px rgba(var(--site-primary-rgb), 0.15)",
                  }
                : undefined
            }
          >
            <HelpCircle size={14} />
            {t("sidebar.help")}
          </Link>
        </div>

        {/* Language Toggle */}
        <div className="px-4 py-2 flex justify-center">
          <LanguageToggle />
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-3 px-3 py-2">
            {/* Avatar with gradient ring */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{
                background: `linear-gradient(135deg, rgba(var(--site-primary-rgb), 0.3), rgba(var(--site-primary-rgb), 0.1))`,
                boxShadow: `0 0 0 1.5px rgba(var(--site-primary-rgb), 0.3)`,
                color: "var(--site-primary)",
              }}
            >
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-[var(--text-tertiary)] truncate block">
                {user?.email || "\u2014"}
              </span>
              {role === "colaborador" && (
                <span className="font-ui text-[10px] text-[var(--site-primary)] font-bold uppercase tracking-wider">
                  {t("sidebar.collaborator")}
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AuthContextProvider>
          <DashboardShell>{children}</DashboardShell>
        </AuthContextProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}
