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
  /**
   * When this value changes, re-baseline: adopt the current `data` as the
   * "last saved" snapshot WITHOUT firing a save. Use it when the form is
   * reloaded with a different record (e.g. selecting another item) so that
   * merely switching selection never triggers a spurious auto-save. Optional
   * and backward compatible — omit it to keep the previous behavior.
   */
  resetKey?: unknown;
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
  resetKey,
}: UseAutoSaveOptions<T>) {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [lastSavedData, setLastSavedData] = useState<T>(data);
  const isSavingRef = useRef(false);
  const isFirstRenderRef = useRef(true);
  // Re-baseline support: when `resetKey` changes we capture the freshly-loaded
  // `data` so the pending debounced tick re-baselines instead of saving.
  const resetKeyRef = useRef(resetKey);
  const resetBaselineRef = useRef<{ data: T } | null>(null);

  // Debounce data changes
  const debouncedData = useDebounce(data, delay);

  // Detect a resetKey change and capture the freshly-loaded data as the
  // pending baseline. The debounced tick that settles to this exact value will
  // re-baseline (no save); any different (edited) value falls through to a save.
  useEffect(() => {
    if (resetKeyRef.current !== resetKey) {
      resetKeyRef.current = resetKey;
      resetBaselineRef.current = { data };
    }
  }, [resetKey, data]);

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

  // Keep refs to latest values for unmount flush
  const dataRef = useRef(data);
  const lastSavedDataRef = useRef(lastSavedData);
  const onSaveRef = useRef(onSave);
  dataRef.current = data;
  lastSavedDataRef.current = lastSavedData;
  onSaveRef.current = onSave;

  // Trigger save when debounced data changes
  useEffect(() => {
    // Skip first render
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    // Pending re-baseline from a resetKey change (e.g. selecting another record).
    if (resetBaselineRef.current) {
      const baseline = resetBaselineRef.current.data;
      if (JSON.stringify(debouncedData) === JSON.stringify(baseline)) {
        // Debounce settled to the loaded record: adopt it as saved, don't save.
        resetBaselineRef.current = null;
        setLastSavedData(debouncedData);
        return;
      }
      // Debounced value differs → the user actually edited; drop the guard and
      // fall through to a normal save.
      resetBaselineRef.current = null;
    }

    // Skip if data hasn't actually changed
    if (JSON.stringify(debouncedData) === JSON.stringify(lastSavedData)) {
      return;
    }

    save();
  }, [debouncedData, save, lastSavedData]);

  // Flush pending unsaved data on unmount (prevents data loss on navigation)
  useEffect(() => {
    return () => {
      if (JSON.stringify(dataRef.current) !== JSON.stringify(lastSavedDataRef.current)) {
        onSaveRef.current(dataRef.current);
      }
    };
  }, []);

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
