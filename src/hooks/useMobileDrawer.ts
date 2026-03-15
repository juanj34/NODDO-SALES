"use client";

import { useState, useEffect, useCallback } from "react";
import { useMediaQuery } from "./useMediaQuery";

export function useMobileDrawer(breakpoint = "(max-width: 767px)") {
  const isMobile = useMediaQuery(breakpoint);
  const [open, setOpen] = useState(false);

  // Close drawer when resizing to desktop
  useEffect(() => {
    if (!isMobile) {
      requestAnimationFrame(() => setOpen(false));
    }
  }, [isMobile]);

  // Scroll lock when drawer is open
  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.setProperty("--scroll-position", `-${scrollY}px`);
      document.body.classList.add("scroll-locked");
      return () => {
        document.body.classList.remove("scroll-locked");
        window.scrollTo(0, scrollY);
      };
    }
  }, [open]);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);
  const close = useCallback(() => setOpen(false), []);

  return { isMobile, open, toggle, close };
}
