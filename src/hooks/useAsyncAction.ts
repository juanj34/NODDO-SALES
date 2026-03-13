import { useState, useCallback, useRef } from "react";

/**
 * Wraps an async function with loading state and double-click prevention.
 * While `loading` is true, calling `execute()` is a no-op.
 */
export function useAsyncAction<Args extends unknown[]>(
  fn: (...args: Args) => Promise<void>
): { execute: (...args: Args) => Promise<void>; loading: boolean } {
  const [loading, setLoading] = useState(false);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const execute = useCallback(async (...args: Args) => {
    if (loading) return;
    setLoading(true);
    try {
      await fnRef.current(...args);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  return { execute, loading };
}
