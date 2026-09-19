"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/app/lib/utils";

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  decimals?: number;
}

export function AnimatedCounter({
  end,
  duration = 2,
  prefix = "",
  suffix = "",
  className = "",
  decimals = 0,
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isInView && !hasAnimated.current) {
      hasAnimated.current = true;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / (duration * 1000), 1);

        // Easing function (ease-out-expo)
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

        setCount(easeProgress * end);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isInView, end, duration]);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className={cn("tabular-nums", className)}
    >
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </motion.span>
  );
}

// Progress bar with animation
interface AnimatedProgressProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  label?: string;
}

export function AnimatedProgress({
  value,
  max = 100,
  className = "",
  barClassName = "",
  label,
}: AnimatedProgressProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const percentage = (value / max) * 100;

  return (
    <div ref={ref} className={cn("space-y-2", className)}>
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-dark-400">{label}</span>
          <span className="text-white font-medium">{value}%</span>
        </div>
      )}
      <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={isInView ? { width: `${percentage}%` } : { width: 0 }}
          transition={{ duration: 1.5, ease: [0.25, 0.4, 0.25, 1], delay: 0.2 }}
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500",
            barClassName
          )}
        />
      </div>
    </div>
  );
}

// Circular progress
interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
  className = "",
}: CircularProgressProps) {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      className={cn("transform -rotate-90", className)}
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={strokeWidth}
      />
      
      {/* Progress circle */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#gradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
        animate={
          isInView
            ? { strokeDashoffset: offset }
            : { strokeDashoffset: circumference }
        }
        transition={{ duration: 2, ease: [0.25, 0.4, 0.25, 1] }}
      />
      
      {/* Gradient definition */}
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
    </svg>
  );
}
