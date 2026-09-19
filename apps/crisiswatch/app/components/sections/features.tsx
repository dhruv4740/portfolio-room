"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { FeatureCard } from "../ui/glass-card";
import { GradientText } from "../ui/gradient-text";
import { FadeIn, FadeInStagger } from "../animations/motion";

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
    ),
    title: "Cap Detection",
    description:
      "AI scans the internet 24/7 to catch fake news within minutes. We're always watching so you don't have to.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    title: "Got Receipts 📑",
    description:
      "We check 15+ sources including Wikipedia, news sites, and fact-checkers. No cap goes unchecked.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    ),
    title: "Real-Time Progress",
    description:
      "Watch us check each source live. Full verification in ~15 seconds with transparent progress updates.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    title: "Danger Detector 🚨",
    description:
      "We prioritize dangerous cap that could actually hurt people. Health misinformation gets flagged first.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
      </svg>
    ),
    title: "Speaks Your Language 🌍",
    description:
      "Works in English, Hindi, and more. Truth should be accessible to everyone, no gatekeeping.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    title: "Cap Stats",
    description:
      "Track what's trending in fake news. See the patterns and stay one step ahead of the BS.",
  },
];

export function Features() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);

  return (
    <section
      id="features"
      ref={containerRef}
      className="relative py-32 overflow-hidden"
    >
      {/* Background elements - matching hero style */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d0c0a] via-[#0a0a0b] to-[#0d0c0a]" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
          backgroundSize: "50px 50px",
        }}
      />
      
      {/* Warm accent glows */}
      <motion.div
        style={{ y }}
        className="absolute top-1/2 -left-40 w-96 h-96 bg-amber-500/8 rounded-full blur-[150px]"
      />
      <motion.div
        style={{ y: useTransform(scrollYProgress, [0, 1], [-50, 50]) }}
        className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary-500/8 rounded-full blur-[180px]"
      />
      <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-red-900/5 rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-20">
          <FadeIn>
            <span className="text-sm text-primary-400 font-semibold uppercase tracking-wider">
              Features
            </span>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-display-md md:text-display-lg font-display font-bold mt-4 mb-6">
              <span className="text-white">Why we're </span>
              <GradientText gradient="primary">built different</GradientText>
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="text-lg text-dark-400 max-w-2xl mx-auto">
              We use AI to find the receipts so you don't have to. 
              No more getting finessed by fake news. Here's how we do it.
            </p>
          </FadeIn>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              index={index}
            />
          ))}
        </div>

        {/* Bottom highlight */}
        <FadeIn delay={0.4}>
          <div className="mt-20 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/[0.03] border border-white/[0.08]">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-dark-300">
                Already caught <span className="text-white font-semibold">12,847</span> caps
                today
              </span>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
