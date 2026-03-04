"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { FolderOpen, Users, LogOut, Loader2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { href: "/proyectos", label: "Proyectos", icon: FolderOpen },
  { href: "/leads", label: "Leads", icon: Users },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

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

  // Login page gets its own layout
  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#C9A96E]" size={32} />
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-black/40 flex flex-col">
        <div className="p-6 border-b border-white/5">
          <Link
            href="/proyectos"
            className="text-lg font-light tracking-widest"
          >
            NODESITES
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-white/5 text-white"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-[#C9A96E]/20 flex items-center justify-center text-[#C9A96E] text-xs font-bold">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <span className="text-xs text-white/50 truncate flex-1">
              {user?.email || "—"}
            </span>
            <button
              onClick={handleLogout}
              className="text-white/30 hover:text-white transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
