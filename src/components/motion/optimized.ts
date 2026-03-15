/**
 * Optimized Framer Motion exports
 *
 * Import only what you need from here instead of importing from "framer-motion" directly.
 * This enables better tree-shaking and smaller bundles.
 */

// Core motion components
export { motion } from "framer-motion";

// Hooks (import individually for better tree-shaking)
export { useMotionValue, useTransform, useSpring, useScroll, useInView } from "framer-motion";

// AnimatePresence for conditional rendering
export { AnimatePresence } from "framer-motion";

// Layout animations
export { LayoutGroup } from "framer-motion";

/**
 * Common animation variants optimized for performance
 * Use these instead of creating new variants everywhere
 */

// Fade animations
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export const fadeInScale = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

// Stagger children
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// Slide animations
export const slideInFromLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
};

export const slideInFromRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
};

// Exit animations
export const exitAnimation = {
  opacity: 0,
  scale: 0.95,
  transition: { duration: 0.2 },
};

/**
 * Performance tips:
 *
 * 1. Use transform properties (x, y, scale, rotate) instead of layout properties
 *    ✅ Good: transform: translateX(100px)
 *    ❌ Bad: left: 100px
 *
 * 2. Use will-change sparingly and only during animation
 *    <motion.div style={{ willChange: "transform" }} />
 *
 * 3. Avoid animating:
 *    - width/height (use scale instead)
 *    - box-shadow (expensive)
 *    - filters (blur, etc.) - use sparingly
 *
 * 4. Use AnimatePresence efficiently:
 *    - Set mode="wait" if only one child at a time
 *    - Use initial={false} to prevent animation on mount
 *
 * 5. Reduce motion for accessibility:
 *    import { useReducedMotion } from "framer-motion"
 *    const shouldReduceMotion = useReducedMotion()
 */
