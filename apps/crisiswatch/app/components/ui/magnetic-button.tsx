"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef, type ReactNode, type MouseEvent } from "react";
import { cn } from "@/app/lib/utils";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export function MagneticButton({
  children,
  className = "",
  strength = 0.15,
  onClick,
  href,
  variant = "primary",
  size = "md",
  disabled = false,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement | HTMLAnchorElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: MouseEvent) => {
    if (!ref.current || disabled) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    x.set((e.clientX - centerX) * strength);
    y.set((e.clientY - centerY) * strength);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleMouseDown = () => {
    x.set(0);
    y.set(0);
  };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const baseStyles = cn(
    "relative inline-flex items-center justify-center font-semibold",
    "transition-all duration-300 rounded-full",
    "overflow-hidden group",
    {
      "px-5 py-2.5 text-sm": size === "sm",
      "px-8 py-4 text-base": size === "md",
      "px-10 py-5 text-lg": size === "lg",
    },
    {
      "bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 text-white shadow-glow hover:shadow-glow-lg":
        variant === "primary" && !disabled,
      "bg-gradient-to-r from-primary-600/50 via-primary-500/50 to-primary-600/50 text-white/60 cursor-not-allowed":
        variant === "primary" && disabled,
      "bg-white/[0.05] backdrop-blur-md border border-white/[0.1] text-white hover:bg-white/[0.1] hover:border-white/[0.2]":
        variant === "secondary" && !disabled,
      "bg-white/[0.02] backdrop-blur-md border border-white/[0.05] text-white/50 cursor-not-allowed":
        variant === "secondary" && disabled,
      "text-white hover:text-primary-400": variant === "ghost" && !disabled,
      "text-white/50 cursor-not-allowed": variant === "ghost" && disabled,
    },
    className
  );

  const Component = href ? motion.a : motion.button;

  return (
    <Component
      ref={ref as any}
      href={disabled ? undefined : href}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      style={{ x: springX, y: springY }}
      whileHover={disabled ? {} : { scale: 1.01 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={baseStyles}
      aria-disabled={disabled}
    >
      {/* Shine effect */}
      {variant === "primary" && !disabled && (
        <span className="absolute inset-0 overflow-hidden rounded-full">
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </span>
      )}

      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </Component>
  );
}

// Icon wrapper for magnetic effect
export function MagneticIcon({
  children,
  className = "",
  strength = 0.5,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 200 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    x.set((e.clientX - centerX) * strength);
    y.set((e.clientY - centerY) * strength);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={cn("inline-flex", className)}
    >
      {children}
    </motion.div>
  );
}
