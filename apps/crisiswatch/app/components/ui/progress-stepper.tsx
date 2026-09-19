"use client";

import { motion } from "framer-motion";

export interface ProgressStep {
  id: string;
  label: string;
  description?: string;
}

const defaultSteps: ProgressStep[] = [
  { id: "analyzing", label: "Analyzing", description: "Parsing claim..." },
  { id: "searching", label: "Searching", description: "Querying sources..." },
  { id: "cross-referencing", label: "Cross-Referencing", description: "Comparing evidence..." },
  { id: "generating", label: "Generating", description: "Creating verdict..." },
];

interface ProgressStepperProps {
  currentStep: number;
  steps?: ProgressStep[];
  className?: string;
}

export function ProgressStepper({ 
  currentStep, 
  steps = defaultSteps,
  className = "" 
}: ProgressStepperProps) {
  return (
    <div className={`w-full ${className}`}>
      {/* Step indicators */}
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <div key={step.id} className="flex-1 flex items-center">
              {/* Step circle */}
              <div className="relative flex flex-col items-center flex-1">
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isCompleted
                      ? "bg-primary-500 border-primary-500"
                      : isActive
                      ? "bg-primary-500/20 border-primary-500"
                      : "bg-white/[0.03] border-white/[0.12]"
                  }`}
                  initial={false}
                  animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                  transition={{ duration: 0.5, repeat: isActive ? Infinity : 0, repeatDelay: 0.5 }}
                >
                  {isCompleted ? (
                    <motion.svg
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-5 h-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </motion.svg>
                  ) : isActive ? (
                    <motion.div
                      className="w-4 h-4 rounded-full bg-primary-500"
                      animate={{ scale: [1, 0.8, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  ) : (
                    <span className="text-sm text-dark-500">{index + 1}</span>
                  )}
                </motion.div>
                
                {/* Step label */}
                <motion.span
                  className={`mt-2 text-xs font-medium transition-colors ${
                    isActive
                      ? "text-primary-400"
                      : isCompleted
                      ? "text-white"
                      : "text-dark-500"
                  }`}
                  animate={isActive ? { opacity: [0.7, 1, 0.7] } : { opacity: 1 }}
                  transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
                >
                  {step.label}
                </motion.span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-[2px] mx-2 bg-white/[0.08] relative overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-primary-500"
                    initial={{ width: "0%" }}
                    animate={{ width: isCompleted ? "100%" : isActive ? "50%" : "0%" }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Current step description */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="text-center"
      >
        <p className="text-dark-400 text-sm">
          {steps[currentStep]?.description || "Processing..."}
        </p>
        <div className="flex items-center justify-center gap-1 mt-2">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary-500"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Compact version for smaller spaces
interface CompactProgressProps {
  currentStep: number;
  totalSteps?: number;
  label?: string;
}

export function CompactProgress({ 
  currentStep, 
  totalSteps = 4, 
  label = "Analyzing..." 
}: CompactProgressProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-dark-400">{label}</span>
        <span className="text-xs text-dark-500">
          Step {currentStep + 1} of {totalSteps}
        </span>
      </div>
      <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// Connection status indicator
interface ConnectionStatusProps {
  isConnected: boolean | null;
  className?: string;
}

export function ConnectionStatus({ isConnected, className = "" }: ConnectionStatusProps) {
  if (isConnected === null) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <motion.div
          className="w-2 h-2 rounded-full bg-yellow-500"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <span className="text-xs text-dark-500">Checking connection...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.div
        className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring" }}
      />
      <span className={`text-xs ${isConnected ? "text-green-400" : "text-red-400"}`}>
        {isConnected ? "AI Backend Connected" : "Using Demo Mode"}
      </span>
    </div>
  );
}

// Error display with retry
interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorDisplay({ message, onRetry, className = "" }: ErrorDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center p-6 rounded-xl bg-red-500/10 border border-red-500/20 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
        <svg
          className="w-6 h-6 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <p className="text-red-400 text-sm text-center mb-4">{message}</p>
      {onRetry && (
        <motion.button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Try Again
          </span>
        </motion.button>
      )}
    </motion.div>
  );
}
