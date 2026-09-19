"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { type ReactNode, type MouseEvent } from "react";
import { cn } from "@/app/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
  glowColor?: string;
}

export function GlassCard({
  children,
  className = "",
  hoverEffect = true,
  glowColor = "rgba(99, 102, 241, 0.15)",
}: GlassCardProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const background = useMotionTemplate`
    radial-gradient(
      400px circle at ${mouseX}px ${mouseY}px,
      ${glowColor},
      transparent 80%
    )
  `;

  return (
    <motion.div
      onMouseMove={hoverEffect ? handleMouseMove : undefined}
      className={cn(
        "relative overflow-hidden rounded-3xl",
        "bg-white/[0.03] backdrop-blur-xl",
        "border border-white/[0.08]",
        "transition-all duration-500",
        hoverEffect && "hover:border-white/[0.15] hover:bg-white/[0.05]",
        className
      )}
      whileHover={hoverEffect ? { y: -5, scale: 1.01 } : undefined}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Hover glow effect */}
      {hoverEffect && (
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background }}
        />
      )}

      {/* Glass reflection */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

// Feature card with icon
interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
  index?: number;
}

export function FeatureCard({
  icon,
  title,
  description,
  className = "",
  index = 0,
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.25, 0.4, 0.25, 1],
      }}
    >
      <GlassCard className={cn("p-8 h-full group", className)}>
        {/* Icon */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-primary-500/20">
            <span className="text-2xl text-primary-400">{icon}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-primary-300 transition-colors duration-300">
          {title}
        </h3>

        {/* Description */}
        <p className="text-dark-400 leading-relaxed">{description}</p>
      </GlassCard>
    </motion.div>
  );
}

// Stats card with animated counter
interface StatsCardProps {
  value: string | number;
  label: string;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function StatsCard({
  value,
  label,
  suffix = "",
  prefix = "",
  className = "",
}: StatsCardProps) {
  return (
    <GlassCard className={cn("p-8 text-center", className)} hoverEffect={false}>
      <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
        {prefix}
        {value}
        {suffix}
      </div>
      <div className="text-dark-400 text-sm uppercase tracking-wider">
        {label}
      </div>
    </GlassCard>
  );
}
