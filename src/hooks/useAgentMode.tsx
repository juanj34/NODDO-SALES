"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import type { ProyectoCompleto } from "@/types";
import { SiteProjectContext } from "@/hooks/useSiteProject";
import { createClient } from "@/lib/supabase/client";

/* ── Types ──────────────────────────────────────────────────────── */

interface AgentUser {
  id: string;
  email: string;
  nombre: string | null;
  apellido: string | null;
}

interface AgentModeContextValue {
  isAgentMode: boolean;
  agentUser: AgentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AgentModeContext = createContext<AgentModeContextValue>({
  isAgentMode: false,
  agentUser: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function useAgentMode() {
  return useContext(AgentModeContext);
}

/* ── Provider ───────────────────────────────────────────────────── */

interface AgentModeProviderProps {
  proyecto: ProyectoCompleto;
  basePath: string;
  children: React.ReactNode;
}

export function AgentModeProvider({
  proyecto,
  basePath,
  children,
}: AgentModeProviderProps) {
  const [agentUser, setAgentUser] = useState<AgentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const isAgentMode = !!agentUser;
  const config = proyecto.agent_mode_config;
  const enabled = config?.enabled ?? false;

  /* ── Verify session on mount ───────────────────────────────── */
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function checkSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session || cancelled) {
          setLoading(false);
          return;
        }

        const res = await fetch(
          `/api/agent-mode/verify?proyecto_id=${proyecto.id}`
        );
        if (!res.ok || cancelled) {
          setLoading(false);
          return;
        }

        const data = await res.json();
        if (data.allowed && !cancelled) {
          setAgentUser({
            id: data.user.id,
            email: data.user.email,
            nombre: data.user.nombre,
            apellido: data.user.apellido,
          });
        }
      } catch {
        // Silently fail — just stay in public mode
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    checkSession();

    // Listen for auth state changes (login / logout from other tabs)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: { user: { id: string } } | null) => {
      if (!session) {
        setAgentUser(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase, proyecto.id, enabled]);

  /* ── Login ─────────────────────────────────────────────────── */
  const login = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw new Error(error.message);

      // Verify access to this project
      const res = await fetch(
        `/api/agent-mode/verify?proyecto_id=${proyecto.id}`
      );
      if (!res.ok) {
        await supabase.auth.signOut();
        throw new Error("No tienes acceso a este proyecto");
      }

      const data = await res.json();
      if (!data.allowed) {
        await supabase.auth.signOut();
        throw new Error("No tienes acceso a este proyecto");
      }

      setAgentUser({
        id: data.user.id,
        email: data.user.email,
        nombre: data.user.nombre,
        apellido: data.user.apellido,
      });
    },
    [supabase, proyecto.id]
  );

  /* ── Logout ────────────────────────────────────────────────── */
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setAgentUser(null);
  }, [supabase]);

  /* ── Compute effective project with visibility overrides ──── */
  const effectiveProject = useMemo<ProyectoCompleto>(() => {
    if (!isAgentMode || !config) return proyecto;

    const overridden = { ...proyecto };

    // Override visibility fields
    if (config.mostrar_vendidas) {
      overridden.ocultar_vendidas = false;
    }
    if (config.mostrar_precio_vendidas) {
      overridden.ocultar_precio_vendidas = false;
    }
    if (config.mostrar_precios && overridden.tipologia_fields) {
      overridden.tipologia_fields = {
        ...overridden.tipologia_fields,
        precio: true,
      };
    }
    if (config.mostrar_todas_secciones && overridden.secciones_visibles) {
      const allVisible = { ...overridden.secciones_visibles };
      for (const key of Object.keys(allVisible) as (keyof typeof allVisible)[]) {
        allVisible[key] = true;
      }
      overridden.secciones_visibles = allVisible;
    }
    if (config.habilitar_cotizador) {
      overridden.cotizador_enabled = true;
    }

    return overridden;
  }, [isAgentMode, config, proyecto]);

  /* ── Context values ────────────────────────────────────────── */
  const agentCtx = useMemo<AgentModeContextValue>(
    () => ({ isAgentMode, agentUser, loading, login, logout }),
    [isAgentMode, agentUser, loading, login, logout]
  );

  const siteCtx = useMemo(
    () => ({ proyecto: effectiveProject, basePath }),
    [effectiveProject, basePath]
  );

  return (
    <AgentModeContext.Provider value={agentCtx}>
      <SiteProjectContext.Provider value={siteCtx}>
        {children}
      </SiteProjectContext.Provider>
    </AgentModeContext.Provider>
  );
}
