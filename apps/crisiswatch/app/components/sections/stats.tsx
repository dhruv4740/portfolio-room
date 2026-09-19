"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { GlassCard } from "../ui/glass-card";
import { AnimatedCounter } from "../ui/animated-counter";
import { GradientText } from "../ui/gradient-text";
import { FadeIn } from "../animations/motion";

const stats = [
  {
    value: 10,
    suffix: "+",
    label: "Sources Checked",
    description: "Wikipedia, news sites, fact-checkers & more",
  },
  {
    value: 15,
    suffix: "s",
    label: "Avg Check Time",
    description: "Fast AI-powered verification",
    decimals: 0,
  },
  {
    value: 95,
    suffix: "%",
    label: "Accuracy",
    description: "On known false claims detection",
  },
  {
    value: 100,
    suffix: "%",
    label: "Free",
    description: "No sign-up, no limits, no cap",
  },
];

export function Stats() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <section ref={containerRef} className="relative py-32 overflow-hidden">
      {/* Background - matching hero style */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d0c0a] via-[#0a0a0b] to-[#0d0c0a]" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
          backgroundSize: "50px 50px",
        }}
      />
      
      {/* Gradient orbs - warmer tones */}
      <motion.div
        style={{ y }}
        className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-amber-500/6 rounded-full blur-[180px]"
      />
      <motion.div
        style={{ y: useTransform(scrollYProgress, [0, 1], [-30, 30]) }}
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-900/5 rounded-full blur-[150px]"
      />
      <div className="absolute top-1/2 right-0 w-80 h-80 bg-primary-500/5 rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <FadeIn>
            <span className="text-sm text-primary-400 font-semibold uppercase tracking-wider">
              Impact
            </span>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-display-md md:text-display-lg font-display font-bold mt-4 mb-6">
              <span className="text-white">Protecting communities </span>
              <GradientText gradient="primary">at scale</GradientText>
            </h2>
          </FadeIn>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <GlassCard className="p-8 text-center h-full" hoverEffect={true}>
                <div className="text-5xl md:text-6xl font-display font-bold gradient-text mb-2">
                  <AnimatedCounter
                    end={stat.value}
                    suffix={stat.suffix}
                    decimals={stat.decimals || 0}
                  />
                </div>
                <div className="text-lg font-semibold text-white mb-2">
                  {stat.label}
                </div>
                <div className="text-sm text-dark-400">{stat.description}</div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Live indicator */}
        <FadeIn delay={0.5}>
          <div className="mt-16 flex justify-center">
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(34, 197, 94, 0.4)",
                  "0 0 0 20px rgba(34, 197, 94, 0)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-3 px-6 py-3 rounded-full bg-green-500/10 border border-green-500/20"
            >
              <span className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-green-400 font-medium">
                Powered by Gemini AI + LangGraph
              </span>
            </motion.div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
