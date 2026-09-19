"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

// Badge definitions
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  color: string;
  gradient: string;
}

export const BADGES: Badge[] = [
  {
    id: "first_check",
    name: "First Check",
    description: "Checked your first claim",
    icon: "🎯",
    requirement: 1,
    color: "#22c55e",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    id: "myth_buster",
    name: "Myth Buster",
    description: "Busted 10 myths",
    icon: "💥",
    requirement: 10,
    color: "#f97316",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    id: "truth_seeker",
    name: "Truth Seeker",
    description: "Sought truth 25 times",
    icon: "🔍",
    requirement: 25,
    color: "#6366f1",
    gradient: "from-indigo-500 to-violet-500",
  },
  {
    id: "cap_detective",
    name: "Cap Detective",
    description: "Detected 50 caps",
    icon: "🕵️",
    requirement: 50,
    color: "#ec4899",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    id: "fact_champion",
    name: "Fact Champion",
    description: "Checked 100 claims",
    icon: "🏆",
    requirement: 100,
    color: "#eab308",
    gradient: "from-yellow-500 to-amber-500",
  },
];

interface GamificationState {
  claimsChecked: number;
  unlockedBadges: string[];
  lastCheckTime: number;
  lastStreakDate: string; // YYYY-MM-DD format for tracking actual days
  streak: number;
  factScore: number;
  todayChecks: number; // Track checks done today
  capsFound: number; // Track how many false/misleading claims detected
}

interface GamificationContextType {
  state: GamificationState;
  incrementClaimsChecked: (isCap?: boolean) => void;
  resetStats: () => void;
  getBadges: () => Badge[];
  getUnlockedBadges: () => Badge[];
  getNextBadge: () => Badge | null;
  getProgress: () => number;
  getCapRate: () => number;
}

// Helper to get date string in YYYY-MM-DD format
const getDateString = (date: Date = new Date()) => {
  return date.toISOString().split('T')[0];
};

// Helper to check if two dates are consecutive
const isConsecutiveDay = (prevDate: string, currentDate: string) => {
  const prev = new Date(prevDate);
  const curr = new Date(currentDate);
  const diffTime = curr.getTime() - prev.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
};

const DEFAULT_STATE: GamificationState = {
  claimsChecked: 0,
  unlockedBadges: [],
  lastCheckTime: 0,
  lastStreakDate: '',
  streak: 0,
  factScore: 0,
  todayChecks: 0,
  capsFound: 0,
};

const GamificationContext = createContext<GamificationContextType | null>(null);

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error("useGamification must be used within GamificationProvider");
  }
  return context;
}

// Fire canvas-confetti celebration
function fireConfetti() {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  // Fire multiple bursts for a spectacular effect
  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ["#22c55e", "#6366f1"],
  });
  fire(0.2, {
    spread: 60,
    colors: ["#f97316", "#ec4899"],
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    colors: ["#eab308", "#06b6d4"],
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    colors: ["#22c55e", "#6366f1", "#f97316"],
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    colors: ["#ec4899", "#eab308", "#06b6d4"],
  });

  // Side cannons for extra flair
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: ["#22c55e", "#6366f1", "#f97316"],
      zIndex: 9999,
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: ["#ec4899", "#eab308", "#06b6d4"],
      zIndex: 9999,
    });
  }, 250);
}

// Badge unlock notification
function BadgeUnlockNotification({ badge, onClose }: { badge: Badge; onClose: () => void }) {
  useEffect(() => {
    // Fire confetti on mount
    fireConfetti();
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -20 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[101]"
      >
        <motion.div
          className={`relative px-8 py-6 rounded-2xl bg-gradient-to-r ${badge.gradient} shadow-2xl`}
          animate={{
            boxShadow: [
              `0 0 20px ${badge.color}40`,
              `0 0 40px ${badge.color}60`,
              `0 0 20px ${badge.color}40`,
            ],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="flex items-center gap-4">
            <motion.div
              className="text-5xl"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{ duration: 0.5, repeat: 3 }}
            >
              {badge.icon}
            </motion.div>
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Badge Unlocked!</p>
              <h3 className="text-white text-xl font-bold">{badge.name}</h3>
              <p className="text-white/70 text-sm">{badge.description}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GamificationState>(DEFAULT_STATE);
  const [newBadge, setNewBadge] = useState<Badge | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Load state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("crisiswatch-gamification");
      if (saved) {
        setState(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load gamification state:", e);
    }
    setIsLoaded(true);
  }, []);
  
  // Save state to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem("crisiswatch-gamification", JSON.stringify(state));
      } catch (e) {
        console.error("Failed to save gamification state:", e);
      }
    }
  }, [state, isLoaded]);
  
  const incrementClaimsChecked = useCallback((isCap: boolean = false) => {
    setState(prev => {
      const newCount = prev.claimsChecked + 1;
      const newCapsFound = isCap ? prev.capsFound + 1 : prev.capsFound;
      const now = Date.now();
      const today = getDateString();
      
      // Calculate streak based on actual calendar days
      let newStreak = prev.streak;
      let newLastStreakDate = prev.lastStreakDate;
      let newTodayChecks = prev.todayChecks;
      
      if (prev.lastStreakDate === '') {
        // First ever check
        newStreak = 1;
        newLastStreakDate = today;
        newTodayChecks = 1;
      } else if (prev.lastStreakDate === today) {
        // Same day - streak stays same, just increment today's count
        newTodayChecks = prev.todayChecks + 1;
      } else if (isConsecutiveDay(prev.lastStreakDate, today)) {
        // Consecutive day - increment streak!
        newStreak = prev.streak + 1;
        newLastStreakDate = today;
        newTodayChecks = 1;
      } else {
        // Streak broken - more than 1 day gap
        newStreak = 1;
        newLastStreakDate = today;
        newTodayChecks = 1;
      }
      
      // Calculate fact score (logarithmic growth)
      const newFactScore = Math.floor(100 * Math.log10(newCount + 1));
      
      // Check for new badges
      const newUnlockedBadges = [...prev.unlockedBadges];
      let earnedBadge: Badge | null = null;
      
      for (const badge of BADGES) {
        if (newCount >= badge.requirement && !newUnlockedBadges.includes(badge.id)) {
          newUnlockedBadges.push(badge.id);
          earnedBadge = badge;
        }
      }
      
      // Show notification for newly earned badge
      if (earnedBadge) {
        setTimeout(() => setNewBadge(earnedBadge), 500);
      }
      
      return {
        claimsChecked: newCount,
        unlockedBadges: newUnlockedBadges,
        lastCheckTime: now,
        lastStreakDate: newLastStreakDate,
        streak: newStreak,
        factScore: newFactScore,
        todayChecks: newTodayChecks,
        capsFound: newCapsFound,
      };
    });
  }, []);
  
  const getBadges = useCallback(() => BADGES, []);
  
  const getUnlockedBadges = useCallback(() => {
    return BADGES.filter(b => state.unlockedBadges.includes(b.id));
  }, [state.unlockedBadges]);
  
  const getNextBadge = useCallback(() => {
    return BADGES.find(b => !state.unlockedBadges.includes(b.id)) || null;
  }, [state.unlockedBadges]);
  
  const getProgress = useCallback(() => {
    const nextBadge = getNextBadge();
    if (!nextBadge) return 100;
    const prevBadge = BADGES.filter(b => state.unlockedBadges.includes(b.id)).pop();
    const start = prevBadge?.requirement || 0;
    const end = nextBadge.requirement;
    return Math.min(100, ((state.claimsChecked - start) / (end - start)) * 100);
  }, [state.claimsChecked, state.unlockedBadges, getNextBadge]);
  
  // Get percentage of claims that were caps (false/misleading)
  const getCapRate = useCallback(() => {
    if (state.claimsChecked === 0) return 0;
    return Math.round((state.capsFound / state.claimsChecked) * 100);
  }, [state.capsFound, state.claimsChecked]);
  
  // Reset all stats to default
  const resetStats = useCallback(() => {
    setState(DEFAULT_STATE);
    localStorage.removeItem("crisiswatch-gamification");
  }, []);
  
  return (
    <GamificationContext.Provider
      value={{
        state,
        incrementClaimsChecked,
        resetStats,
        getBadges,
        getUnlockedBadges,
        getProgress,
        getNextBadge,
        getCapRate,
      }}
    >
      {children}
      <AnimatePresence>
        {newBadge && (
          <BadgeUnlockNotification
            badge={newBadge}
            onClose={() => setNewBadge(null)}
          />
        )}
      </AnimatePresence>
    </GamificationContext.Provider>
  );
}

// Badge display component for the UI
export function BadgeDisplay({ className = "" }: { className?: string }) {
  const { state, getUnlockedBadges, getNextBadge, getProgress } = useGamification();
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const unlockedBadges = getUnlockedBadges();
  const nextBadge = getNextBadge();
  const progress = getProgress();
  
  // Close on scroll
  useEffect(() => {
    if (!isExpanded) return;
    
    const handleScroll = () => setIsExpanded(false);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isExpanded]);
  
  // Close on click outside
  useEffect(() => {
    if (!isExpanded) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };
    
    // Small delay to prevent immediate close on the click that opened it
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isExpanded]);
  
  // Close on escape key
  useEffect(() => {
    if (!isExpanded) return;
    
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsExpanded(false);
    };
    
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isExpanded]);
  
  return (
    <motion.div
      ref={containerRef}
      className={`relative ${className}`}
      initial={false}
    >
      {/* Collapsed view - just show count */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] hover:border-white/[0.2] transition-all"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-lg font-bold">F</span>
        <div className="text-left">
          <p className="text-xs text-dark-400">Fact Score</p>
          <p className="text-sm font-bold text-white">{state.factScore}</p>
        </div>
        <div className="flex -space-x-1 ml-2">
          {unlockedBadges.slice(0, 3).map(badge => (
            <span key={badge.id} className="text-sm" title={badge.name}>
              {badge.icon}
            </span>
          ))}
          {unlockedBadges.length > 3 && (
            <span className="text-xs text-dark-400 pl-1">+{unlockedBadges.length - 3}</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-dark-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </motion.button>
      
      {/* Expanded view */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="absolute top-full left-0 right-0 mt-2 p-4 rounded-xl bg-dark-900/95 backdrop-blur-xl border border-white/[0.1] shadow-xl z-50 min-w-[280px]"
          >
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                <p className="text-lg font-bold text-white">{state.todayChecks || 0}</p>
                <p className="text-[10px] text-dark-500">Today</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                <p className="text-lg font-bold text-orange-400">{state.streak}</p>
                <p className="text-[10px] text-dark-500">Day Streak</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                <p className="text-lg font-bold text-white">{state.claimsChecked}</p>
                <p className="text-[10px] text-dark-500">Total</p>
              </div>
            </div>
            
            {/* Progress to next badge */}
            {nextBadge && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-dark-400">Next: {nextBadge.name}</span>
                  <span className="text-dark-500">{state.claimsChecked}/{nextBadge.requirement}</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${nextBadge.gradient}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}
            
            {/* Badges grid */}
            <div className="grid grid-cols-5 gap-2">
              {BADGES.map(badge => {
                const isUnlocked = unlockedBadges.some(b => b.id === badge.id);
                return (
                  <motion.div
                    key={badge.id}
                    className={`relative p-2 rounded-lg text-center ${
                      isUnlocked
                        ? "bg-white/[0.05]"
                        : "bg-white/[0.02] opacity-40"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    title={`${badge.name}: ${badge.description}`}
                  >
                    <span className="text-xl">{badge.icon}</span>
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-dark-900/60 rounded-lg">
                        <span className="text-xs">🔒</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Hook to trigger gamification on claim check
export function useClaimCheck() {
  const { incrementClaimsChecked } = useGamification();
  
  const onClaimChecked = useCallback((verdict?: string) => {
    // Check if the verdict indicates false/misleading information (a "cap")
    // Handle both uppercase and lowercase verdicts from the API
    const v = (verdict || '').toLowerCase();
    const isCap = v === 'false' || v === 'mostly_false' || v === 'misleading';
    incrementClaimsChecked(isCap);
  }, [incrementClaimsChecked]);
  
  return { onClaimChecked };
}
