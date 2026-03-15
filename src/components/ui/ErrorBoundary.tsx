"use client";

import { Component, ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary mejorado con retry y mejor UX
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    this.props.onError?.(error, errorInfo);

    // Enviar a Sentry si está configurado
    if (typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: { react: { componentStack: errorInfo.componentStack } },
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center p-8 min-h-[400px]"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
            style={{
              background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))",
              border: "1px solid rgba(239, 68, 68, 0.2)",
            }}
          >
            <AlertTriangle size={28} className="text-red-400" />
          </div>

          <h2 className="font-heading text-2xl font-light text-[var(--text-primary)] mb-3">
            Algo salió mal
          </h2>

          <p className="text-sm text-[var(--text-tertiary)] font-mono mb-6 max-w-md text-center">
            {this.state.error?.message || "Ha ocurrido un error inesperado"}
          </p>

          <button
            onClick={this.handleRetry}
            className="btn-warm flex items-center gap-2 px-6 py-3"
          >
            <RefreshCw size={16} />
            <span className="font-ui text-xs font-bold uppercase tracking-wider">
              Intentar de nuevo
            </span>
          </button>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook para retry con exponential backoff
 */
export function useRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    backoff?: number;
  } = {}
) {
  const { maxRetries = 3, delay = 1000, backoff = 2 } = options;

  const executeWithRetry = async (attempt = 0): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= maxRetries) {
        throw error;
      }

      const waitTime = delay * Math.pow(backoff, attempt);
      await new Promise((resolve) => setTimeout(resolve, waitTime));

      return executeWithRetry(attempt + 1);
    }
  };

  return { execute: executeWithRetry };
}

/**
 * Componente de error inline con retry
 */
export function InlineError({
  message,
  onRetry,
  variant = "default",
}: {
  message: string;
  onRetry?: () => void;
  variant?: "default" | "compact";
}) {
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
        <AlertTriangle size={14} className="text-red-400 shrink-0" />
        <p className="text-xs text-red-300 font-mono flex-1">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs text-red-400 hover:text-red-300 font-ui font-bold uppercase tracking-wider"
          >
            Reintentar
          </button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-red-500/10 border border-red-500/20"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-red-300 font-mono leading-relaxed mb-3">{message}</p>
          {onRetry && (
            <button onClick={onRetry} className="btn-outline-warm text-xs px-4 py-2">
              <RefreshCw size={14} className="mr-2" />
              Intentar de nuevo
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
