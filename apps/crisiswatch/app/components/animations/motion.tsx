"use client";

import { motion, type Variants } from "framer-motion";
import { ReactNode } from "react";

// Animation variants
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.4, 0.25, 1] },
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.4, 0.25, 1] },
  },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.25, 0.4, 0.25, 1] },
  },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.25, 0.4, 0.25, 1] },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.2,
    },
  },
};

// Animated wrapper components
interface AnimatedProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export function FadeIn({
  children,
  className = "",
  delay = 0,
  duration = 0.8,
}: AnimatedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.4, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeInStagger({
  children,
  className = "",
  staggerDelay = 0.1,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SlideIn({
  children,
  className = "",
  direction = "up",
  delay = 0,
}: AnimatedProps & { direction?: "up" | "down" | "left" | "right" }) {
  const directionOffset = {
    up: { y: 60, x: 0 },
    down: { y: -60, x: 0 },
    left: { x: 60, y: 0 },
    right: { x: -60, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directionOffset[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.25, 0.4, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({
  children,
  className = "",
  delay = 0,
}: AnimatedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.25, 0.4, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function TextReveal({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  const words = children.split(" ");

  return (
    <motion.span
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={staggerContainer}
      className={className}
    >
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden">
          <motion.span
            className="inline-block"
            variants={{
              hidden: { y: "100%" },
              visible: {
                y: 0,
                transition: {
                  duration: 0.5,
                  ease: [0.25, 0.4, 0.25, 1],
                },
              },
            }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 && " "}
        </span>
      ))}
    </motion.span>
  );
}

// Parallax wrapper
export function ParallaxWrapper({
  children,
  className = "",
  speed = 0.5,
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
}) {
  return (
    <motion.div
      initial={{ y: 0 }}
      whileInView={{ y: 0 }}
      viewport={{ once: false }}
      style={{ y: 0 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Hover animations
export const hoverScale = {
  scale: 1.02,
  transition: { duration: 0.3, ease: "easeOut" },
};

export const hoverLift = {
  y: -8,
  transition: { duration: 0.3, ease: "easeOut" },
};

export const tapScale = {
  scale: 0.98,
  transition: { duration: 0.1 },
};
