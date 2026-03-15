"use client";

import { useEffect, useCallback, useRef, useState } from "react";

/**
 * Hook para detectar cambios sin guardar y prevenir navegación accidental
 * Muestra confirmación antes de salir de la página
 */
export function useUnsavedChanges(
  hasUnsavedChanges: boolean,
  message: string = "Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?"
) {
  const messageRef = useRef(message);

  useEffect(() => {
    messageRef.current = message;
  }, [message]);

  // Prevenir cierre/recarga del navegador
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        // Chrome requires returnValue to be set
        e.returnValue = messageRef.current;
        return messageRef.current;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Prevenir navegación interna (Next.js)
  const handleRouteChange = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(messageRef.current);
      if (!confirmLeave) {
        // Lanzar error para cancelar la navegación
        throw new Error("Route change cancelled by user");
      }
    }
  }, [hasUnsavedChanges]);

  return { handleRouteChange };
}

/**
 * Hook mejorado que también trackea el estado "saving" y "saved"
 */
export function useAutoSaveStatus() {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const markAsSaving = useCallback(() => {
    setStatus("saving");
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const markAsSaved = useCallback(() => {
    setStatus("saved");
    setLastSaved(new Date());

    // Reset to idle después de 2s
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setStatus("idle");
    }, 2000);
  }, []);

  const markAsError = useCallback(() => {
    setStatus("error");
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    status,
    lastSaved,
    markAsSaving,
    markAsSaved,
    markAsError,
  };
}

