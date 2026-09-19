"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { MagneticButton } from "../ui/magnetic-button";
import { GradientText } from "../ui/gradient-text";
import { FadeIn } from "../animations/motion";

export function CTA() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.5, 1, 1, 0.5]);

  return (
    <section
      ref={containerRef}
      id="cta"
      className="relative py-32 overflow-hidden"
    >
      {/* Background - matching hero style */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d0c0a] via-[#0a0a0b] to-[#0d0c0a]" />

      {/* Animated gradient mesh - warmer tones */}
      <motion.div
        style={{ y }}
        className="absolute inset-0 opacity-30"
      >
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[180px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-red-900/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-500/5 rounded-full blur-[200px]" />
      </motion.div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
          backgroundSize: "50px 50px",
        }}
      />

      <motion.div
        style={{ scale, opacity }}
        className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8"
      >
        {/* Main CTA card */}
        <div className="relative rounded-3xl overflow-hidden">
          {/* Gradient border */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 p-[1px]">
            <div className="absolute inset-[1px] rounded-3xl bg-dark-900" />
          </div>

          {/* Content */}
          <div className="relative z-10 p-12 md:p-16 lg:p-20 text-center">
            {/* Floating elements */}
            <div className="absolute top-8 left-8 w-20 h-20 rounded-full border border-primary-500/20 animate-float" />
            <div className="absolute bottom-12 right-12 w-16 h-16 rounded-full bg-accent-500/10 animate-float-delayed" />
            <div className="absolute top-1/2 right-8 w-3 h-3 rounded-full bg-secondary-400 animate-pulse-slow" />

            <FadeIn>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-primary-400 mb-6">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                CrisisWatch Hackathon 2025 • Misinformation Track
              </span>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h2 className="text-display-md md:text-display-lg lg:text-display-xl font-display font-bold mb-6">
                <span className="text-white">Fighting </span>
                <GradientText gradient="primary">misinformation</GradientText>
                <br />
                <span className="text-white">when it matters most</span>
              </h2>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="text-lg md:text-xl text-dark-400 max-w-2xl mx-auto mb-10">
                Built with Gemini AI, LangGraph, and multi-source verification.
                Real-time fact-checking for crisis response.
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <MagneticButton variant="primary" size="lg" href="#demo">
                  <span className="flex items-center gap-2">
                    Try It Now
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </span>
                </MagneticButton>
                <MagneticButton variant="secondary" size="lg" href="https://github.com" onClick={() => window.open('https://github.com', '_blank')}>
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  View GitHub
                </MagneticButton>
              </div>
            </FadeIn>

            <FadeIn delay={0.4}>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-dark-500">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Open Source</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Gemini AI Powered</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Real-time Verification</span>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
