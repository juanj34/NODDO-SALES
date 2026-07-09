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
   *
   * TRAP: pass a value that changes ONLY when `data` is genuinely reloaded
   * from a record. Do NOT pass a record id that can change WITHOUT a data
   * reload — e.g. an optimistic temp→real id promotion after a create POST.
   * If the user edits while that POST is in flight, the id flip would
   * re-baseline to the edited value without saving it: silent data loss
   * behind a false "saved" status. Use a dedicated load counter instead
   * (see tipologias/page.tsx `formLoadKey`).
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
  const resetBaselineRef = useRef<{ data: T; debouncedAtCapture: T } | null>(null);

  // Debounce data changes
  const debouncedData = useDebounce(data, delay);

  // Detect a resetKey change and capture the freshly-loaded data as the
  // pending baseline, together with the debounced value current at capture
  // time. The guard resolves on the FIRST debounce settle after the reload:
  // settling to the loaded record re-baselines (no save); settling to a
  // different (edited) value falls through to a save so the edit is kept.
  useEffect(() => {
    if (resetKeyRef.current !== resetKey) {
      resetKeyRef.current = resetKey;
      resetBaselineRef.current = { data, debouncedAtCapture: debouncedData };
    }
  }, [resetKey, data, debouncedData]);

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
      // This effect also re-runs on save-identity changes BEFORE the debounce
      // settles (debouncedData still holds the pre-reload value). Consuming the
      // guard there would let the eventual settle fire a spurious save — so
      // until debouncedData actually moves past its capture-time value, keep
      // the guard and suppress saves (the stale value has nothing to save).
      if (debouncedData === resetBaselineRef.current.debouncedAtCapture) {
        return;
      }
      // First settle after the reload → resolve the guard now.
      const baseline = resetBaselineRef.current.data;
      resetBaselineRef.current = null;
      if (JSON.stringify(debouncedData) === JSON.stringify(baseline)) {
        // Settled to the loaded record: adopt it as saved, don't save.
        setLastSavedData(debouncedData);
        return;
      }
      // Settled to a different value → the user edited during the debounce
      // window; fall through to a normal save so the edit is NOT lost.
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
