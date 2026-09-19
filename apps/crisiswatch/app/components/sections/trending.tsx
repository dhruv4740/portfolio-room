"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "../ui/glass-card";
import { GradientText, Badge } from "../ui/gradient-text";
import { FadeIn } from "../animations/motion";

interface TrendingClaim {
  id: string;
  claim: string;
  verdict: "TRUE" | "FALSE" | "MOSTLY_FALSE" | "MOSTLY_TRUE" | "MIXED" | "UNVERIFIABLE";
  confidence: number;
  category: string;
  checked_count: number;
  checked_at: string;
}

interface TrendingResponse {
  claims: TrendingClaim[];
  categories: string[];
  total: number;
}

const CATEGORIES = [
  { id: "all", label: "All", icon: "" },
  { id: "politics", label: "Politics", icon: "🏛️" },
  { id: "health", label: "Health", icon: "🏥" },
  { id: "tech", label: "Tech", icon: "💻" },
  { id: "climate", label: "Climate", icon: "" },
  { id: "finance", label: "Finance", icon: "" },
  { id: "social", label: "Social", icon: "" },
];

const verdictConfig = {
  TRUE: { label: "NO CAP", color: "text-green-400", bg: "bg-green-500/20", border: "border-green-500/30" },
  FALSE: { label: "THAT'S CAP", color: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/30" },
  MOSTLY_FALSE: { label: "MOSTLY CAP", color: "text-orange-400", bg: "bg-orange-500/20", border: "border-orange-500/30" },
  MOSTLY_TRUE: { label: "LOWKEY TRUE", color: "text-lime-400", bg: "bg-lime-500/20", border: "border-lime-500/30" },
  MIXED: { label: "IT'S COMPLICATED", color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/30" },
  UNVERIFIABLE: { label: "CAN'T TELL", color: "text-gray-400", bg: "bg-gray-500/20", border: "border-gray-500/30" },
};

// Mock data for when backend endpoint is not ready
const MOCK_TRENDING: TrendingClaim[] = [
  {
    id: "1",
    claim: "NASA confirms asteroid will hit Earth in 2025",
    verdict: "FALSE",
    confidence: 98,
    category: "tech",
    checked_count: 2847,
    checked_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "2",
    claim: "New study shows coffee extends lifespan by 10 years",
    verdict: "MOSTLY_FALSE",
    confidence: 89,
    category: "health",
    checked_count: 1923,
    checked_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "3",
    claim: "Government announces free WiFi for all citizens",
    verdict: "UNVERIFIABLE",
    confidence: 45,
    category: "politics",
    checked_count: 1456,
    checked_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: "4",
    claim: "Electric vehicles cause more pollution than diesel cars",
    verdict: "FALSE",
    confidence: 94,
    category: "climate",
    checked_count: 3201,
    checked_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: "5",
    claim: "AI will replace 50% of jobs by 2030",
    verdict: "MIXED",
    confidence: 62,
    category: "tech",
    checked_count: 2105,
    checked_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "6",
    claim: "Drinking 8 glasses of water daily is essential for health",
    verdict: "MOSTLY_TRUE",
    confidence: 78,
    category: "health",
    checked_count: 1678,
    checked_at: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
  },
];

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return num.toString();
}

function TrendingCard({ claim, index }: { claim: TrendingClaim; index: number }) {
  const verdict = verdictConfig[claim.verdict] || verdictConfig.UNVERIFIABLE;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <GlassCard className="p-5 h-full group cursor-pointer">
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className={`text-xs px-2.5 py-1 rounded-full border ${verdict.bg} ${verdict.border} ${verdict.color} font-medium`}>
            {verdict.label}
          </span>
          <span className="text-xs text-dark-500 whitespace-nowrap">
            {formatTimeAgo(claim.checked_at)}
          </span>
        </div>
        
        <p className="text-sm text-dark-200 mb-4 line-clamp-3 group-hover:text-white transition-colors">
          "{claim.claim}"
        </p>
        
        <div className="flex items-center justify-between text-xs text-dark-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {claim.confidence}% sure
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {formatNumber(claim.checked_count)} checks
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-white/[0.05] capitalize">
            {claim.category}
          </span>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export function Trending() {
  const [claims, setClaims] = useState<TrendingClaim[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrending = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/trending?category=${selectedCategory}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch trending claims");
      }
      
      const data: TrendingResponse = await response.json();
      setClaims(data.claims);
    } catch (err) {
      console.error("Trending fetch error:", err);
      // Use mock data as fallback
      const filtered = selectedCategory === "all" 
        ? MOCK_TRENDING 
        : MOCK_TRENDING.filter(c => c.category === selectedCategory);
      setClaims(filtered);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  const filteredClaims = selectedCategory === "all" 
    ? claims 
    : claims.filter(c => c.category === selectedCategory);

  return (
    <section id="trending" className="relative py-24 overflow-hidden">
      {/* Background - matching hero style */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0b] via-[#0d0c0a] to-[#0a0a0b]" />
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
          backgroundSize: "50px 50px",
        }}
      />
      
      {/* Warm accent glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[180px]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-red-900/5 rounded-full blur-[150px]" />
      <div className="absolute top-1/2 right-0 w-80 h-80 bg-primary-500/5 rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <FadeIn>
            <Badge variant="gradient">Trending Now</Badge>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-display-md md:text-display-lg font-display font-bold mt-6 mb-4">
              <span className="text-white">What's Getting </span>
              <GradientText gradient="primary">Fact-Checked</GradientText>
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="text-lg text-dark-400 max-w-2xl mx-auto">
              See what claims others are checking. No personal data stored - just the facts.
            </p>
          </FadeIn>
        </div>

        {/* Category Filters */}
        <FadeIn delay={0.3}>
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                  selectedCategory === cat.id
                    ? "bg-primary-500/20 border-primary-500/50 text-primary-300"
                    : "bg-white/[0.03] border-white/[0.08] text-dark-400 hover:text-white hover:border-white/[0.15]"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="mr-1.5">{cat.icon}</span>
                {cat.label}
              </motion.button>
            ))}
          </div>
        </FadeIn>

        {/* Claims Grid */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-40 rounded-3xl bg-white/[0.03] animate-pulse" />
              ))}
            </motion.div>
          ) : filteredClaims.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/[0.03] flex items-center justify-center">
                <span className="text-2xl text-dark-400">?</span>
              </div>
              <p className="text-dark-400">No trending claims in this category yet.</p>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {filteredClaims.map((claim, index) => (
                <TrendingCard key={claim.id} claim={claim} index={index} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Footer */}
        <FadeIn delay={0.4}>
          <div className="mt-12 text-center">
            <GlassCard className="inline-flex flex-row items-center gap-4 sm:gap-6 px-4 sm:px-8 py-4" hoverEffect={false}>
              <div className="text-center min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-white">{formatNumber(claims.reduce((sum, c) => sum + c.checked_count, 0))}</p>
                <p className="text-xs text-dark-500 whitespace-nowrap">Total Checks</p>
              </div>
              <div className="w-px h-8 sm:h-10 bg-white/[0.1] flex-shrink-0" />
              <div className="text-center min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-white">{claims.length}</p>
                <p className="text-xs text-dark-500 whitespace-nowrap">Claims Tracked</p>
              </div>
              <div className="w-px h-8 sm:h-10 bg-white/[0.1] flex-shrink-0" />
              <div className="text-center min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-red-400">
                  {claims.filter(c => c.verdict === "FALSE" || c.verdict === "MOSTLY_FALSE").length}
                </p>
                <p className="text-xs text-dark-500 whitespace-nowrap">Debunked</p>
              </div>
            </GlassCard>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
