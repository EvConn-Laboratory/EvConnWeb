import type { Variants } from "framer-motion";

/** Cubic bezier used throughout the app */
export const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98];

/**
 * Fade + slide up. Accepts a custom delay index via the `custom` prop on the
 * motion element, e.g. `<motion.div variants={fadeUp} custom={2} />`.
 */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.07, ease: EASE },
  }),
};

/** Tighter fade-up for dense lists */
export const fadeUpSm: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.06, ease: EASE },
  }),
};

/** Fade only (no vertical movement) */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: (i: number = 0) => ({
    opacity: 1,
    transition: { duration: 0.35, delay: i * 0.06, ease: EASE },
  }),
};

/** Scale + fade in, great for cards popping in */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, delay: i * 0.07, ease: EASE },
  }),
};

/** Slide in from left */
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: (i: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, delay: i * 0.07, ease: EASE },
  }),
};

/** Slide in from right */
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  show: (i: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, delay: i * 0.07, ease: EASE },
  }),
};

/**
 * Container that staggers its children.
 * Use with any of the variants above on child elements.
 */
export const stagger: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

/** Faster stagger for tighter layouts */
export const staggerFast: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.04,
    },
  },
};

/** Hover lift — use with `whileHover` directly, not as a named variant */
export const hoverLift = {
  y: -4,
  transition: { duration: 0.2, ease: EASE },
};
