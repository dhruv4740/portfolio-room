"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { GradientText } from "../ui/gradient-text";
import { MagneticButton } from "../ui/magnetic-button";

const footerLinks = {
  product: {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Pricing", href: "#pricing" },
      { label: "API Docs", href: "#" },
      { label: "Integrations", href: "#" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { label: "About Us", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Press Kit", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  resources: {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "Help Center", href: "#" },
      { label: "Community", href: "#" },
      { label: "Status", href: "#" },
      { label: "Changelog", href: "#" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Cookie Policy", href: "#" },
      { label: "GDPR", href: "#" },
    ],
  },
};



export function Footer() {
  return (
    <footer className="relative bg-[#0a0a0b] pt-20 pb-8 overflow-hidden">
      {/* Top border gradient - warmer tone */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

      {/* Background elements - warmer tones */}
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-amber-900/5 rounded-full blur-[200px]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-red-900/5 rounded-full blur-[200px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Main footer content */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12 mb-16">
          {/* Brand column */}
          <div className="col-span-2">
            <motion.a
              href="#"
              className="inline-flex items-center gap-2 text-2xl font-display font-bold mb-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <span className="text-xl font-bold">F</span>
              </div>
              <GradientText gradient="primary">Fact or Cap</GradientText>
            </motion.a>
            <p className="text-dark-400 text-sm mb-6 max-w-xs">
              AI-powered cap detection. 
              Stop getting finessed by fake news. No cap.
            </p>

            {/* Newsletter */}
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Get cap alerts"
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-dark-500 text-sm focus:outline-none focus:border-primary-500/50 transition-colors"
              />
              <MagneticButton variant="primary" size="sm">
                Subscribe
              </MagneticButton>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h3 className="text-white font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <motion.a
                      href={link.href}
                      className="text-dark-400 text-sm hover:text-white transition-colors"
                      whileHover={{ x: 4 }}
                    >
                      {link.label}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/[0.06]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-dark-500 text-sm">
              © {new Date().getFullYear()} Fact or Cap. All rights reserved.
            </p>

            {/* Status indicator */}
            <div className="flex items-center gap-2 text-sm text-dark-400">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Cap detector is online
            </div>
          </div>
        </div>

        {/* Large background text */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none select-none">
          <span className="text-[200px] font-display font-bold text-white/[0.01] whitespace-nowrap">
            Fact or Cap
          </span>
        </div>
      </div>
    </footer>
  );
}
