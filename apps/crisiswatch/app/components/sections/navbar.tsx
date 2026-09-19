"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/app/lib/utils";
import { MagneticButton } from "../ui/magnetic-button";
import { BadgeDisplay } from "../ui/gamification";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Cap Check", href: "#demo" },
  { label: "Trending", href: "#trending" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  
  const backgroundColor = useTransform(
    scrollY,
    [0, 100],
    ["rgba(15, 23, 42, 0)", "rgba(15, 23, 42, 0.8)"]
  );
  
  const backdropBlur = useTransform(
    scrollY,
    [0, 100],
    ["blur(0px)", "blur(20px)"]
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.header
        style={{ backgroundColor, backdropFilter: backdropBlur }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50",
          "transition-all duration-300",
          isScrolled && "border-b border-white/[0.05]"
        )}
      >
        <nav className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div
                className="relative w-10 h-10"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Cap icon */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl rotate-45 group-hover:rotate-[50deg] transition-transform duration-300" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">F</span>
                </div>
              </motion.div>
              <span className="text-xl font-display font-bold text-white">
                Fact or Cap
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="relative text-sm text-dark-400 hover:text-white transition-colors duration-300 group"
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {/* Badge Display */}
              <BadgeDisplay />
              {/* Hackathon badge */}
              <span className="text-xs px-3 py-1.5 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-400 font-medium">
                Hackathon 2025
              </span>
              <MagneticButton size="sm" variant="primary" href="#demo">
                Check if it's cap
                <svg
                  className="w-4 h-4 ml-1"
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
                </svg>
              </MagneticButton>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden relative w-10 h-10 flex items-center justify-center"
            >
              <div className="flex flex-col gap-1.5">
                <motion.span
                  animate={{
                    rotate: isMobileMenuOpen ? 45 : 0,
                    y: isMobileMenuOpen ? 6 : 0,
                  }}
                  className="w-6 h-0.5 bg-white block"
                />
                <motion.span
                  animate={{ opacity: isMobileMenuOpen ? 0 : 1 }}
                  className="w-6 h-0.5 bg-white block"
                />
                <motion.span
                  animate={{
                    rotate: isMobileMenuOpen ? -45 : 0,
                    y: isMobileMenuOpen ? -6 : 0,
                  }}
                  className="w-6 h-0.5 bg-white block"
                />
              </div>
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div
              className="absolute inset-0 bg-dark-950/95 backdrop-blur-xl"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <nav className="relative pt-24 px-6">
              <div className="flex flex-col gap-6">
                {navItems.map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-2xl font-display font-semibold text-white hover:text-primary-400 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="pt-6 space-y-4"
                >
                  <span className="inline-flex text-xs px-3 py-1.5 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-400 font-medium">
                    Hackathon 2025
                  </span>
                  <MagneticButton variant="primary" className="w-full justify-center" href="#demo">
                    Try Demo
                  </MagneticButton>
                </motion.div>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
