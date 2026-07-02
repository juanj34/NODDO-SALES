"use client";

import { useAgentMode } from "@/hooks/useAgentMode";
import { AgentCotizadorModal } from "@/components/site/AgentCotizadorModal";
import type { Unidad, Tipologia, CotizadorConfig } from "@/types";

/**
 * Quotation entry point on the microsite.
 *
 * Quotes are an agent-only capability (platform decision 2026-07-02): the
 * public flow was retired, and agent mode mounts the full dashboard
 * CotizadorTool via AgentCotizadorModal. Props are kept identical to the
 * old public modal so callers don't change; non-agent renders nothing.
 */
interface CotizadorModalProps {
  isOpen: boolean;
  onClose: () => void;
  unidad: Unidad;
  tipologia: Tipologia | undefined;
  proyectoId: string;
  cotizadorConfig?: CotizadorConfig | null;
  cotizadorEnabled?: boolean;
  /** Available tipologías for multi-tipo lots (tipologia_mode === 'multiple') */
  availableTipologias?: Tipologia[];
  /** Project type — used for lotes pricing logic */
  tipoProyecto?: string;
}

export function CotizadorModal(props: CotizadorModalProps) {
  const { isAgentMode } = useAgentMode();
  if (!isAgentMode) return null;
  return <AgentCotizadorModal open={props.isOpen} onClose={props.onClose} />;
}
