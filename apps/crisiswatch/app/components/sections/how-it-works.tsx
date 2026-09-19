"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { GlassCard } from "../ui/glass-card";
import { GradientText } from "../ui/gradient-text";
import { FadeIn, SlideIn } from "../animations/motion";

const steps = [
  {
    number: "01",
    title: "Monitor",
    description:
      "Our AI continuously scans Twitter, Facebook, WhatsApp groups, news sites, and YouTube for emerging claims about ongoing crises.",
    icon: "📡",
    color: "from-blue-500 to-cyan-500",
  },
  {
    number: "02",
    title: "Analyze",
    description:
      "Advanced NLP extracts claims, identifies entities, and determines the crisis type — earthquake, flood, health emergency, or civil unrest.",
    icon: "🧠",
    color: "from-purple-500 to-pink-500",
  },
  {
    number: "03",
    title: "Verify",
    description:
      "Cross-reference against WHO, government sources, Reuters, AFP, and trusted fact-checkers. Each claim gets a confidence score.",
    icon: "✓",
    color: "from-green-500 to-emerald-500",
  },
  {
    number: "04",
    title: "Correct",
    description:
      "Generate clear, shareable corrections in English and Hindi. Ready to deploy across platforms instantly.",
    icon: "📢",
    color: "from-orange-500 to-red-500",
  },
];

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      className="relative py-32 overflow-hidden"
    >
      {/* Background - matching hero style */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0b] via-[#0d0c0a] to-[#0a0a0b]" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
          backgroundSize: "50px 50px",
        }}
      />
      
      {/* Warm accent glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-900/5 rounded-full blur-[200px]" />
      
      {/* Animated line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-amber-500/20 to-transparent hidden lg:block" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-20">
          <FadeIn>
            <span className="text-sm text-primary-400 font-semibold uppercase tracking-wider">
              How It Works
            </span>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-display-md md:text-display-lg font-display font-bold mt-4 mb-6">
              <span className="text-white">From detection to </span>
              <GradientText gradient="accent">correction</GradientText>
              <span className="text-white"> in minutes</span>
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="text-lg text-dark-400 max-w-2xl mx-auto">
              Our AI pipeline processes thousands of claims daily, ensuring rapid
              response when accuracy matters most.
            </p>
          </FadeIn>
        </div>

        {/* Steps */}
        <div className="space-y-12 lg:space-y-0">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-16 ${
                index % 2 === 1 ? "lg:flex-row-reverse" : ""
              }`}
            >
              {/* Content */}
              <div className="flex-1 text-center lg:text-left">
                <div
                  className={`inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r ${step.color} bg-opacity-10 mb-4`}
                  style={{
                    background: `linear-gradient(to right, ${step.color.split(" ")[0].replace("from-", "")}15, ${step.color.split(" ")[1].replace("to-", "")}15)`,
                  }}
                >
                  <span className="text-2xl">{step.icon}</span>
                  <span className="text-sm font-bold text-white/80">
                    Step {step.number}
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-4">
                  {step.title}
                </h3>
                <p className="text-dark-400 text-lg leading-relaxed max-w-md mx-auto lg:mx-0">
                  {step.description}
                </p>
              </div>

              {/* Visual */}
              <div className="flex-1 w-full max-w-lg">
                <GlassCard className="p-8 relative overflow-hidden">
                  {/* Decorative gradient */}
                  <div
                    className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30 bg-gradient-to-r ${step.color}`}
                  />
                  
                  {/* Step number */}
                  <div className="relative">
                    <span
                      className={`text-8xl font-display font-bold bg-gradient-to-r ${step.color} bg-clip-text text-transparent opacity-20`}
                    >
                      {step.number}
                    </span>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-6xl">{step.icon}</span>
                    </div>
                  </div>

                  {/* Mini visualization based on step */}
                  <div className="mt-6 space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ width: "0%" }}
                        whileInView={{ width: `${60 + i * 15}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                        className={`h-2 rounded-full bg-gradient-to-r ${step.color} opacity-${30 + i * 20}`}
                        style={{ opacity: 0.3 + i * 0.2 }}
                      />
                    ))}
                  </div>
                </GlassCard>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
