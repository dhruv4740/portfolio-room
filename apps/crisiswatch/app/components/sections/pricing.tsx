"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "../ui/glass-card";
import { MagneticButton } from "../ui/magnetic-button";
import { GradientText, Badge } from "../ui/gradient-text";
import { FadeIn } from "../animations/motion";

const plans = [
  {
    name: "Starter",
    description: "For small teams and NGOs",
    price: { monthly: 199, annually: 159 },
    currency: "$",
    features: [
      "Up to 1,000 claim verifications/month",
      "Basic API access",
      "Email alerts",
      "English language support",
      "Standard response time",
      "Community support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    description: "For news organizations",
    price: { monthly: 499, annually: 399 },
    currency: "$",
    features: [
      "Up to 10,000 claim verifications/month",
      "Full API access",
      "Real-time webhooks",
      "English + Hindi support",
      "Priority response time",
      "Dedicated account manager",
      "Custom integrations",
      "Analytics dashboard",
    ],
    cta: "Get Started",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For government agencies",
    price: { monthly: null, annually: null },
    currency: "",
    features: [
      "Unlimited claim verifications",
      "Custom API endpoints",
      "White-label solution",
      "All languages supported",
      "Instant response time",
      "24/7 dedicated support",
      "On-premise deployment option",
      "Custom ML model training",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section id="pricing" className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950" />
      
      {/* Gradient orbs */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-primary-500/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-accent-500/10 rounded-full blur-[150px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <FadeIn>
            <span className="text-sm text-primary-400 font-semibold uppercase tracking-wider">
              Pricing
            </span>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-display-md md:text-display-lg font-display font-bold mt-4 mb-6">
              <span className="text-white">Plans that scale with </span>
              <GradientText gradient="primary">your mission</GradientText>
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="text-lg text-dark-400 max-w-2xl mx-auto mb-8">
              From startups to government agencies, we have a plan that fits your needs.
            </p>
          </FadeIn>

          {/* Billing toggle */}
          <FadeIn delay={0.3}>
            <div className="inline-flex items-center gap-4 p-1.5 rounded-full bg-white/[0.03] border border-white/[0.08]">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                  !isAnnual
                    ? "bg-primary-500 text-white"
                    : "text-dark-400 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  isAnnual
                    ? "bg-primary-500 text-white"
                    : "text-dark-400 hover:text-white"
                }`}
              >
                Annual
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </FadeIn>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={plan.popular ? "lg:-mt-4 lg:mb-4" : ""}
            >
              <GlassCard
                className={`p-8 h-full relative ${
                  plan.popular ? "border-primary-500/30" : ""
                }`}
                hoverEffect={true}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge variant="gradient">Most Popular</Badge>
                  </div>
                )}

                {/* Plan header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-display font-bold text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-dark-400 text-sm">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-8">
                  {plan.price.monthly !== null ? (
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-dark-400 text-2xl">
                        {plan.currency}
                      </span>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={isAnnual ? "annual" : "monthly"}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-5xl font-display font-bold text-white"
                        >
                          {isAnnual ? plan.price.annually : plan.price.monthly}
                        </motion.span>
                      </AnimatePresence>
                      <span className="text-dark-400">/mo</span>
                    </div>
                  ) : (
                    <span className="text-4xl font-display font-bold text-white">
                      Custom
                    </span>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-dark-300"
                    >
                      <svg
                        className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0"
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
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <MagneticButton
                  variant={plan.popular ? "primary" : "secondary"}
                  className="w-full justify-center"
                >
                  {plan.cta}
                </MagneticButton>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
