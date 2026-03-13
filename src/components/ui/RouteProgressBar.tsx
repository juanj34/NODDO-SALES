"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Thin progress bar at the top of the viewport that animates during route transitions.
 * Mount once in the root layout — detects pathname changes automatically.
 */
export function RouteProgressBar({ color }: { color?: string }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const prevPath = useRef(pathname);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Pathname changed — transition complete
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      // Small delay so the bar reaches 100% visually before disappearing
      timerRef.current = setTimeout(() => setLoading(false), 150);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  // Intercept link clicks to start the bar before navigation begins
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        anchor.target === "_blank"
      ) return;

      // Only trigger for internal navigation that will change the path
      if (href !== pathname) {
        setLoading(true);
      }
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [pathname]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 0.8 }}
          exit={{ scaleX: 1, opacity: 0 }}
          transition={{
            scaleX: { duration: 8, ease: [0.2, 0.8, 0.2, 1] },
            opacity: { duration: 0.3, delay: 0 },
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            zIndex: 9999,
            transformOrigin: "left",
            background: color || "var(--site-primary, #b8973a)",
          }}
        />
      )}
    </AnimatePresence>
  );
}
