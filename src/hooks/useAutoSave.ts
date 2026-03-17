"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutoSaveOptions<T> {
  /** Data to watch for changes */
  data: T;
  /** Function to call to save data */
  onSave: (data: T) => Promise<void>;
  /** Debounce delay in ms (default: 1000) */
  delay?: number;
  /** Skip auto-save if this returns false */
  shouldSave?: (data: T) => boolean;
  /** Called when save completes successfully */
  onSaveSuccess?: () => void;
  /** Called when save fails */
  onSaveError?: (error: Error) => void;
}

/**
 * Hook for auto-saving form data with debounce.
 * Returns status indicator for UI feedback.
 */
export function useAutoSave<T>({
  data,
  onSave,
  delay = 1000,
  shouldSave,
  onSaveSuccess,
  onSaveError,
}: UseAutoSaveOptions<T>) {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [lastSavedData, setLastSavedData] = useState<T>(data);
  const isSavingRef = useRef(false);
  const isFirstRenderRef = useRef(true);

  // Debounce data changes
  const debouncedData = useDebounce(data, delay);

  // Save function with status updates
  const save = useCallback(async () => {
    // Skip if already saving
    if (isSavingRef.current) return;

    // Check if we should save
    if (shouldSave && !shouldSave(debouncedData)) {
      setStatus("idle");
      return;
    }

    isSavingRef.current = true;
    setStatus("saving");

    try {
      await onSave(debouncedData);
      setLastSavedData(debouncedData);
      setStatus("saved");
      onSaveSuccess?.();

      // Reset to idle after 2s
      setTimeout(() => {
        setStatus((current) => (current === "saved" ? "idle" : current));
      }, 2000);
    } catch (error) {
      console.error("[AutoSave] Error:", error);
      setStatus("error");
      onSaveError?.(error as Error);
    } finally {
      isSavingRef.current = false;
    }
  }, [debouncedData, onSave, shouldSave, onSaveSuccess, onSaveError]);

  // Trigger save when debounced data changes
  useEffect(() => {
    // Skip first render
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    // Skip if data hasn't actually changed
    if (JSON.stringify(debouncedData) === JSON.stringify(lastSavedData)) {
      return;
    }

    save();
  }, [debouncedData, save, lastSavedData]);

  // Manual save trigger (for forcing save before navigation, etc.)
  const saveNow = useCallback(async () => {
    if (JSON.stringify(data) === JSON.stringify(lastSavedData)) return;
    await save();
  }, [data, lastSavedData, save]);

  return {
    status,
    saveNow,
    hasUnsavedChanges: JSON.stringify(data) !== JSON.stringify(lastSavedData),
  };
}
