"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { MagneticButton } from "../ui/magnetic-button";
import { Badge, GradientText } from "../ui/gradient-text";
import { FadeIn } from "../animations/motion";

// Fake news headlines for Matrix effect
const fakeHeadlines = [
  "BREAKING: Earthquake predicted for tomorrow by anonymous source",
  "Scientists confirm 5G causes health issues - EXPOSED",
  "Miracle cure discovered in remote village - doctors hate this",
  "Government hiding truth about recent disaster",
  "Viral video proves conspiracy theory correct",
  "Famous celebrity confirms shocking health rumor",
  "New study reveals water is dangerous - must read",
  "Secret document leaked: what they don't want you to know",
  "Emergency alert: evacuate immediately (unverified)",
  "Hospitals overwhelmed - system collapse imminent",
  "Food shortage warning: stock up now before it's too late",
  "Radiation levels spiking - mainstream media silent",
  "Cure for disease found but being suppressed",
  "Eyewitness claims government cover-up in disaster zone",
  "Shocking truth about vaccines exposed by insider",
  "Climate disaster imminent - flee coastal areas now",
  "Banking system to collapse within hours - withdraw cash",
  "Military mobilizing in secret - civil unrest expected",
  "Toxic chemicals found in everyday products - EXPOSED",
  "Underground bunkers being prepared for elite only",
];

interface FallingHeadline {
  id: number;
  text: string;
  column: number;
  speed: number;
  delay: number;
  opacity: number;
  stamped: boolean;
  stampType: "FALSE" | "TRUE" | "UNVERIFIED";
  stampDelay: number;
  rotation: number;
}

// Floating news icons component
function FloatingNewsElements() {
  const elements = useMemo(() => [
    // Newspapers
    { type: "newspaper", x: "8%", y: "15%", size: 40, delay: 0, duration: 20 },
    { type: "newspaper", x: "85%", y: "25%", size: 35, delay: 2, duration: 18 },
    { type: "newspaper", x: "12%", y: "70%", size: 30, delay: 4, duration: 22 },
    // TVs
    { type: "tv", x: "75%", y: "65%", size: 45, delay: 1, duration: 19 },
    { type: "tv", x: "20%", y: "40%", size: 35, delay: 3, duration: 21 },
    // Phones with notifications
    { type: "phone", x: "90%", y: "45%", size: 32, delay: 2.5, duration: 17 },
    { type: "phone", x: "5%", y: "55%", size: 28, delay: 0.5, duration: 23 },
    // Alert triangles
    { type: "alert", x: "70%", y: "12%", size: 28, delay: 1.5, duration: 16 },
    { type: "alert", x: "25%", y: "80%", size: 24, delay: 3.5, duration: 20 },
    // Magnifying glass
    { type: "search", x: "60%", y: "75%", size: 36, delay: 2, duration: 18 },
    { type: "search", x: "35%", y: "18%", size: 30, delay: 4.5, duration: 22 },
  ], []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {elements.map((el, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: el.x, top: el.y }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: [0.1, 0.25, 0.1],
            y: [0, -20, 0],
            rotate: [-5, 5, -5],
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: el.duration,
            delay: el.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {el.type === "newspaper" && (
            <svg width={el.size} height={el.size} viewBox="0 0 24 24" fill="none" className="text-amber-500/30">
              <rect x="2" y="3" width="20" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 7h10M7 11h6M7 15h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="14" y="11" width="4" height="5" rx="0.5" stroke="currentColor" strokeWidth="1"/>
            </svg>
          )}
          {el.type === "tv" && (
            <svg width={el.size} height={el.size} viewBox="0 0 24 24" fill="none" className="text-blue-400/25">
              <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 21h8M12 19v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="18" cy="8" r="1" fill="currentColor" className="animate-pulse"/>
            </svg>
          )}
          {el.type === "phone" && (
            <svg width={el.size} height={el.size} viewBox="0 0 24 24" fill="none" className="text-green-400/25">
              <rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="12" cy="18" r="1" fill="currentColor"/>
              <motion.circle 
                cx="16" cy="5" r="3" 
                fill="rgba(239, 68, 68, 0.5)"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </svg>
          )}
          {el.type === "alert" && (
            <motion.svg 
              width={el.size} 
              height={el.size} 
              viewBox="0 0 24 24" 
              fill="none" 
              className="text-red-500/40"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <path d="M12 2L2 22h20L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M12 9v5M12 17v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </motion.svg>
          )}
          {el.type === "search" && (
            <motion.svg 
              width={el.size} 
              height={el.size} 
              viewBox="0 0 24 24" 
              fill="none" 
              className="text-primary-400/30"
              animate={{ x: [0, 10, 0], rotate: [0, 10, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            >
              <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M15 15l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </motion.svg>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// Binary/data rain effect (like Matrix but for misinformation)
function DataRain() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fixed values to prevent hydration mismatch
  const columns = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: `${5 + i * 8}%`,
      // Use deterministic values based on index
      chars: ["CAP", "FAKE", "NAH", "FALSE", "CAP", "SUS", "LIES", "HOAX"],
      speed: 10 + (i % 5) * 2,
      delay: (i % 4) * 1.2,
    })), []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.12]">
      {columns.map((col) => (
        <motion.div
          key={col.id}
          className="absolute top-0 font-mono text-sm font-bold whitespace-nowrap"
          style={{ left: col.x }}
          initial={{ y: "-100%" }}
          animate={{ y: "120vh" }}
          transition={{
            duration: col.speed,
            delay: col.delay,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {col.chars.map((char, i) => (
            <div 
              key={i} 
              className={`leading-relaxed ${i % 2 === 0 ? 'text-red-500' : 'text-orange-400'}`}
            >
              {char}
            </div>
          ))}
        </motion.div>
      ))}
    </div>
  );
}

// News ticker at bottom
function NewsTicker() {
  const tickerItems = [
    "UNVERIFIED CLAIM DETECTED",
    "FACT-CHECK IN PROGRESS",
    "MISINFORMATION ALERT",
    "VERIFIED BY 15+ SOURCES",
    "VIRAL HOAX SPREADING",
    "AI PROTECTION ACTIVE",
    "BREAKING: FAKE NEWS IDENTIFIED",
    "SOURCE RELIABILITY: CHECKING",
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 overflow-hidden">
      <div className="bg-gradient-to-r from-red-900/80 via-red-800/80 to-red-900/80 backdrop-blur-sm border-t border-red-500/30 py-2">
        <motion.div
          className="flex gap-12 whitespace-nowrap"
          animate={{ x: [0, -1200] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        >
          {[...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="text-xs font-bold text-red-200 uppercase tracking-wider">
              {item}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function MatrixHeadlines() {
  const [headlines, setHeadlines] = useState<FallingHeadline[]>([]);
  const columnCount = 5;

  useEffect(() => {
    const generateHeadline = (id: number): FallingHeadline => {
      const column = id % columnCount;
      return {
        id,
        text: fakeHeadlines[Math.floor(Math.random() * fakeHeadlines.length)],
        column,
        speed: 18 + Math.random() * 12,
        delay: Math.random() * 10,
        opacity: 0.4 + Math.random() * 0.3,
        stamped: Math.random() > 0.25,
        stampType: Math.random() > 0.12 ? "FALSE" : Math.random() > 0.5 ? "UNVERIFIED" : "TRUE",
        stampDelay: 1.5 + Math.random() * 2,
        rotation: -3 + Math.random() * 6,
      };
    };

    const initial: FallingHeadline[] = [];
    for (let i = 0; i < 12; i++) {
      initial.push(generateHeadline(i));
    }
    setHeadlines(initial);

    let counter = 12;
    const interval = setInterval(() => {
      setHeadlines(prev => {
        const filtered = prev.filter(h => h.id > counter - 18);
        return [...filtered, generateHeadline(counter++)];
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const columnPositions = useMemo(() => [
    "left-[3%]",
    "left-[22%]",
    "left-[41%]",
    "left-[60%]",
    "left-[79%]",
  ], []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <AnimatePresence>
        {headlines.map((headline) => (
          <motion.div
            key={headline.id}
            initial={{ y: "-100%", opacity: 0, rotate: headline.rotation }}
            animate={{ y: "120vh", opacity: headline.opacity, rotate: headline.rotation }}
            exit={{ opacity: 0 }}
            transition={{
              y: { duration: headline.speed, ease: "linear", delay: headline.delay },
              opacity: { duration: 1.5, delay: headline.delay },
            }}
            className={`absolute ${columnPositions[headline.column]} w-[17%]`}
            style={{ top: 0 }}
          >
            <div className="relative">
              {/* Newspaper clipping style */}
              <div 
                className="relative p-3 shadow-xl"
                style={{
                  background: "linear-gradient(135deg, #1a1814 0%, #12110e 100%)",
                  borderLeft: "3px solid rgba(180, 140, 80, 0.3)",
                  clipPath: "polygon(0 0, 100% 2%, 98% 100%, 2% 98%)",
                }}
              >
                {/* Paper texture overlay */}
                <div 
                  className="absolute inset-0 opacity-10 rounded"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
                  }}
                />
                <p className="text-[11px] text-amber-100/70 font-serif leading-relaxed line-clamp-3 relative z-10">
                  {headline.text}
                </p>
                {/* Torn edge effect */}
                <div className="absolute -bottom-1 left-0 right-0 h-2 bg-gradient-to-b from-transparent to-[#0d0c0a]" />
              </div>
              
              {/* Stamp overlay */}
              {headline.stamped && (
                <motion.div
                  initial={{ scale: 0, rotate: -25, opacity: 0 }}
                  animate={{ scale: 1, rotate: -15, opacity: 0.95 }}
                  transition={{
                    delay: headline.delay + headline.stampDelay,
                    type: "spring",
                    stiffness: 400,
                    damping: 12,
                  }}
                  className={`absolute -top-3 -right-3 px-2.5 py-1.5 rounded-sm text-[11px] font-black tracking-widest shadow-xl border-2 ${
                    headline.stampType === "FALSE"
                      ? "bg-red-600 text-white border-red-400 shadow-red-500/40"
                      : headline.stampType === "TRUE"
                      ? "bg-green-600 text-white border-green-400 shadow-green-500/40"
                      : "bg-yellow-500 text-black border-yellow-300 shadow-yellow-500/40"
                  }`}
                  style={{
                    textShadow: headline.stampType === "FALSE" ? "0 1px 2px rgba(0,0,0,0.5)" : "none",
                  }}
                >
                  {headline.stampType}
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24"
    >
      {/* Newsroom-style background */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, #15130f 0%, #0d0c0a 50%, #080807 100%)",
        }}
      />
      
      {/* Newsprint texture pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(180, 140, 80, 0.1) 2px, rgba(180, 140, 80, 0.1) 4px),
            repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(180, 140, 80, 0.05) 2px, rgba(180, 140, 80, 0.05) 4px)
          `,
          backgroundSize: "20px 20px",
        }}
      />

      {/* TV static/noise overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Data rain effect */}
      <DataRain />

      {/* Floating news icons */}
      <FloatingNewsElements />

      {/* Matrix-style falling headlines */}
      <MatrixHeadlines />

      {/* Red danger glow in corners */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-red-900/20 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-0 right-0 w-80 h-80 bg-orange-900/15 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-red-950/20 rounded-full blur-[180px]" />

      {/* Gradient orbs - warmer tones */}
      <motion.div
        animate={{ 
          scale: [1, 1.15, 1],
          opacity: [0.1, 0.18, 0.1]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 -left-32 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{ 
          scale: [1.1, 1, 1.1],
          opacity: [0.08, 0.15, 0.08]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/3 -right-32 w-[450px] h-[450px] bg-primary-500/10 rounded-full blur-[140px]"
      />

      {/* Scanning line effect - more dramatic */}
      <motion.div
        animate={{ y: ["-100%", "200%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 4 }}
        className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/60 to-transparent z-20"
        style={{ boxShadow: "0 0 20px 5px rgba(239, 68, 68, 0.3)" }}
      />

      {/* Vignette overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)",
        }}
      />

      {/* Content fade overlays */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#0d0c0a] via-[#0d0c0a]/80 to-transparent z-10" />
      <div className="absolute inset-x-0 bottom-12 h-32 bg-gradient-to-t from-[#0d0c0a] to-transparent z-10" />

      {/* News ticker */}
      <NewsTicker />

      {/* Main content */}
      <motion.div
        style={{ y, opacity, scale }}
        className="relative z-20 max-w-5xl mx-auto px-6 text-center"
      >
        {/* Badge */}
        <FadeIn delay={0.1}>
          <Badge variant="gradient" className="mb-8">
            <motion.span 
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 bg-green-400 rounded-full"
            />
            <span>Cap Detector Active</span>
          </Badge>
        </FadeIn>

        {/* Headline */}
        <div className="mb-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-display-lg md:text-display-xl lg:text-display-2xl font-display font-bold tracking-tight"
          >
            <span className="text-white">Is It </span>
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-green-400">
                Fact
              </span>
            </span>
            <span className="text-white"> or </span>
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-red-400">
                Cap
              </span>
            </span>
            <span className="text-white">?</span>
          </motion.h1>
        </div>

        {/* Subheadline */}
        <FadeIn delay={0.4}>
          <p className="text-lg md:text-xl text-dark-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Paste any <span className="text-primary-400">claim or rumor</span> and we'll verify it against
            <span className="text-green-400"> 15+ trusted sources</span> in seconds.
            Real-time AI fact-checking to <span className="text-accent-400">stop misinformation</span> before it spreads.
          </p>
        </FadeIn>

        {/* CTA Buttons */}
        <FadeIn delay={0.5}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <MagneticButton variant="primary" size="lg" href="#demo">
              <span className="flex items-center gap-2">
                Check if it's cap
                <motion.svg
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </motion.svg>
              </span>
            </MagneticButton>
            <MagneticButton variant="secondary" size="lg" href="#how-it-works">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              How it works 👀
            </MagneticButton>
          </div>
        </FadeIn>

        {/* Stats bar */}
        <FadeIn delay={0.6}>
          <div className="mt-12 flex items-center justify-center gap-8 md:gap-12">
            {[
              { value: "15+", label: "Sources checked" },
              { value: "~15s", label: "Avg response" },
              { value: "24/7", label: "Always on" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                className="text-center"
              >
                <div className="text-2xl md:text-3xl font-display font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-xs text-dark-500 uppercase tracking-wider">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </FadeIn>

        {/* Trust indicators */}
        <FadeIn delay={0.7}>
          <div className="mt-16 pt-8 border-t border-white/[0.05]">
            <p className="text-sm text-dark-500 mb-6">
              Trusted by crisis response organizations worldwide
            </p>
            <div className="flex items-center justify-center gap-6 md:gap-10 flex-wrap">
              {[
                { name: "Disaster Relief", icon: "🏥" },
                { name: "Health Agencies", icon: "⚕️" },
                { name: "News Media", icon: "📰" },
                { name: "Government", icon: "🏛️" },
                { name: "NGOs", icon: "🌍" },
              ].map((org, i) => (
                <motion.div
                  key={org.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 + i * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.05] cursor-default"
                >
                  <span className="text-lg">{org.icon}</span>
                  <span className="text-sm font-medium text-dark-400">{org.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </FadeIn>
      </motion.div>
    </section>
  );
}
