"use client";

import { motion } from "framer-motion";
import { cn } from "@/app/lib/utils";

interface GradientTextProps {
  children: string;
  className?: string;
  gradient?: "primary" | "accent" | "hero" | "rainbow";
  animated?: boolean;
}

export function GradientText({
  children,
  className = "",
  gradient = "primary",
  animated = false,
}: GradientTextProps) {
  const gradientClasses = {
    primary: "from-primary-400 via-accent-400 to-primary-400",
    accent: "from-accent-400 via-primary-400 to-accent-400",
    hero: "from-white via-primary-200 to-accent-300",
    rainbow: "from-primary-400 via-accent-400 to-secondary-400",
  };

  return (
    <span
      className={cn(
        "bg-clip-text text-transparent bg-gradient-to-r",
        gradientClasses[gradient],
        animated && "animate-gradient bg-[length:200%_auto]",
        className
      )}
    >
      {children}
    </span>
  );
}

// Animated gradient border
interface GradientBorderProps {
  children: React.ReactNode;
  className?: string;
  borderWidth?: number;
  rounded?: string;
}

export function GradientBorder({
  children,
  className = "",
  borderWidth = 1,
  rounded = "rounded-3xl",
}: GradientBorderProps) {
  return (
    <div className={cn("relative p-[1px]", rounded, className)}>
      {/* Animated gradient border */}
      <div
        className={cn(
          "absolute inset-0",
          rounded,
          "bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500",
          "animate-gradient bg-[length:200%_auto]"
        )}
      />
      
      {/* Inner content */}
      <div className={cn("relative bg-dark-950", rounded)}>
        {children}
      </div>
    </div>
  );
}

// Badge with gradient
interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "gradient" | "glass";
}

export function Badge({
  children,
  className = "",
  variant = "default",
}: BadgeProps) {
  const variantClasses = {
    default: "bg-primary-500/10 text-primary-400 border-primary-500/20",
    gradient: "bg-gradient-to-r from-primary-500/20 to-accent-500/20 text-white border-white/10",
    glass: "bg-white/[0.05] backdrop-blur-md text-white/80 border-white/10",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full",
        "text-sm font-medium border",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// Animated underline
export function AnimatedUnderline({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("relative group inline-block", className)}>
      {children}
      <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-300 group-hover:w-full" />
    </span>
  );
}

// Glow effect wrapper
export function GlowWrapper({
  children,
  className = "",
  color = "primary",
}: {
  children: React.ReactNode;
  className?: string;
  color?: "primary" | "accent" | "secondary";
}) {
  const glowColors = {
    primary: "shadow-glow",
    accent: "shadow-glow-accent",
    secondary: "shadow-[0_0_60px_-15px_rgba(249,115,22,0.4)]",
  };

  return (
    <div className={cn("relative", glowColors[color], className)}>
      {children}
    </div>
  );
}
