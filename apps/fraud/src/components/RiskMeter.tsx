import { motion } from 'framer-motion';

interface RiskMeterProps {
  score: number;
}

export default function RiskMeter({ score }: RiskMeterProps) {
  return (
    <div className="relative w-48 h-48 mx-auto">
      <motion.div
        className="absolute inset-0 rounded-full border-4 border-cyber-primary"
        style={{
          rotate: -90,
          scale: 1,
          transformOrigin: '50% 50%'
        }}
        animate={{
          strokeDashoffset: 440 - (440 * score) / 100
        }}
      >
        <svg viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            className="stroke-cyber-primary/20"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            className="stroke-cyber-primary"
            strokeDasharray="283"
            strokeDashoffset={`${283 - (283 * score) / 100}`}
          />
        </svg>
      </motion.div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold text-cyber-primary">{score}%</span>
      </div>
    </div>
  );
}