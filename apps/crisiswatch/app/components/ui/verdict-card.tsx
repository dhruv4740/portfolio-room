"use client";

import { useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface VerdictCardProps {
  claim: string;
  verdict: string;
  confidence: number;
  sources: number;
  evidence?: Array<{
    source: string;
    snippet?: string;
  }>;
  onClose?: () => void;
}

const verdictConfig: Record<string, { label: string; emoji: string; color: string; bgGradient: string; glowColor: string }> = {
  TRUE: { 
    label: "NO CAP", 
    emoji: "✅", 
    color: "#22c55e",
    bgGradient: "linear-gradient(145deg, #064e3b 0%, #022c22 50%, #0f1f1a 100%)",
    glowColor: "rgba(34, 197, 94, 0.4)"
  },
  FALSE: { 
    label: "THAT'S CAP", 
    emoji: "🧢", 
    color: "#ef4444",
    bgGradient: "linear-gradient(145deg, #7f1d1d 0%, #450a0a 50%, #1f0a0a 100%)",
    glowColor: "rgba(239, 68, 68, 0.4)"
  },
  MOSTLY_FALSE: { 
    label: "MOSTLY CAP", 
    emoji: "🧢", 
    color: "#f97316",
    bgGradient: "linear-gradient(145deg, #7c2d12 0%, #431407 50%, #1a0a03 100%)",
    glowColor: "rgba(249, 115, 22, 0.4)"
  },
  MOSTLY_TRUE: { 
    label: "LOWKEY TRUE", 
    emoji: "✅", 
    color: "#84cc16",
    bgGradient: "linear-gradient(145deg, #365314 0%, #1a2e05 50%, #0f1a03 100%)",
    glowColor: "rgba(132, 204, 22, 0.4)"
  },
  MIXED: { 
    label: "IT'S COMPLICATED", 
    emoji: "🤷", 
    color: "#eab308",
    bgGradient: "linear-gradient(145deg, #713f12 0%, #422006 50%, #1a0d03 100%)",
    glowColor: "rgba(234, 179, 8, 0.4)"
  },
  UNVERIFIABLE: { 
    label: "CAN'T TELL", 
    emoji: "🤔", 
    color: "#6b7280",
    bgGradient: "linear-gradient(145deg, #374151 0%, #1f2937 50%, #111827 100%)",
    glowColor: "rgba(107, 114, 128, 0.4)"
  },
};

export function VerdictCard({ claim, verdict, confidence, sources, evidence, onClose }: VerdictCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  
  const config = verdictConfig[verdict.toUpperCase().replace(/ /g, "_")] || verdictConfig.UNVERIFIABLE;
  
  const generateImage = useCallback(async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    
    // Instagram Story size: 1080x1920 (9:16 ratio) - perfect for stories
    // Or use 1200x630 for regular posts (1.91:1)
    const width = 1080;
    const height = 1350; // 4:5 ratio - works great for Instagram feed
    canvas.width = width;
    canvas.height = height;
    
    // Beautiful gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#0a0a0b");
    gradient.addColorStop(0.3, "#121214");
    gradient.addColorStop(0.7, "#0d0d0f");
    gradient.addColorStop(1, "#080809");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Decorative circles in background
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.beginPath();
    ctx.arc(width * 0.1, height * 0.2, 200, 0, Math.PI * 2);
    ctx.fillStyle = config.color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width * 0.9, height * 0.8, 250, 0, Math.PI * 2);
    ctx.fillStyle = config.color;
    ctx.fill();
    ctx.restore();
    
    // Subtle noise pattern overlay
    ctx.save();
    ctx.globalAlpha = 0.03;
    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      ctx.fillStyle = Math.random() > 0.5 ? "#ffffff" : "#000000";
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.restore();
    
    // Main glow effect behind verdict
    const glowGradient = ctx.createRadialGradient(width / 2, 280, 0, width / 2, 280, 350);
    glowGradient.addColorStop(0, config.color + "50");
    glowGradient.addColorStop(0.5, config.color + "20");
    glowGradient.addColorStop(1, "transparent");
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Top branding with icon
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "bold 24px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🧢 FACT OR CAP", width / 2, 60);
    
    // Verdict badge - main focus
    const badgeWidth = 500;
    const badgeHeight = 100;
    const badgeX = (width - badgeWidth) / 2;
    const badgeY = 150;
    
    // Badge shadow
    ctx.save();
    ctx.shadowColor = config.color;
    ctx.shadowBlur = 40;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = config.color + "40";
    roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 50);
    ctx.fill();
    ctx.restore();
    
    // Badge background
    ctx.fillStyle = config.color + "25";
    ctx.strokeStyle = config.color + "80";
    ctx.lineWidth = 3;
    roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 50);
    ctx.fill();
    ctx.stroke();
    
    // Verdict text with emoji
    ctx.fillStyle = config.color;
    ctx.font = "bold 48px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${config.emoji} ${config.label}`, width / 2, badgeY + badgeHeight / 2);
    
    // Claim text with quotes (styled)
    ctx.fillStyle = "#ffffff";
    ctx.font = "32px Georgia, serif";
    ctx.textAlign = "center";
    
    // Opening quote decoration
    ctx.fillStyle = config.color + "60";
    ctx.font = "120px Georgia, serif";
    ctx.fillText("\u201C", width / 2 - 350, 360);
    ctx.fillText("\u201D", width / 2 + 350, 520);
    
    // Claim text
    ctx.fillStyle = "#ffffff";
    ctx.font = "32px system-ui, -apple-system, sans-serif";
    const claimLines = wrapText(ctx, claim, width - 200);
    const claimStartY = 380;
    claimLines.slice(0, 5).forEach((line, index) => {
      ctx.fillText(line, width / 2, claimStartY + index * 44);
    });
    if (claimLines.length > 5) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fillText("...", width / 2, claimStartY + 5 * 44);
    }
    
    // Stats section - modern card design
    const statsY = 650;
    const cardWidth = 280;
    const cardHeight = 140;
    const gap = 40;
    const totalWidth = cardWidth * 3 + gap * 2;
    const startX = (width - totalWidth) / 2;
    
    // Confidence card
    drawModernStatCard(ctx, startX, statsY, cardWidth, cardHeight, `${confidence}%`, "CONFIDENCE", config.color);
    
    // Sources card
    drawModernStatCard(ctx, startX + cardWidth + gap, statsY, cardWidth, cardHeight, sources.toString(), "SOURCES", "#8b5cf6");
    
    // Verdict card
    const verdictIcon = verdict === "TRUE" ? "✓" : verdict === "FALSE" ? "✗" : "?";
    drawModernStatCard(ctx, startX + (cardWidth + gap) * 2, statsY, cardWidth, cardHeight, verdictIcon, "VERDICT", config.color);
    
    // Evidence sources (if available)
    if (evidence && evidence.length > 0) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "18px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      const topSources = evidence.slice(0, 3).map(e => e.source).join("  •  ");
      ctx.fillText("Sources: " + topSources, width / 2, 850);
    }
    
    // Confidence bar
    const barY = 920;
    const barWidth = 600;
    const barHeight = 20;
    const barX = (width - barWidth) / 2;
    
    // Bar background
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundRect(ctx, barX, barY, barWidth, barHeight, 10);
    ctx.fill();
    
    // Bar fill
    const fillWidth = (barWidth * confidence) / 100;
    const barGradient = ctx.createLinearGradient(barX, 0, barX + fillWidth, 0);
    barGradient.addColorStop(0, config.color);
    barGradient.addColorStop(1, config.color + "80");
    ctx.fillStyle = barGradient;
    roundRect(ctx, barX, barY, fillWidth, barHeight, 10);
    ctx.fill();
    
    // Confidence label
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "14px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Confidence Level", width / 2, barY + 45);
    
    // Decorative line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, 1020);
    ctx.lineTo(width - 100, 1020);
    ctx.stroke();
    
    // Call to action
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Check any claim instantly 👇", width / 2, 1080);
    
    // Website with styling
    ctx.save();
    ctx.fillStyle = config.color + "30";
    roundRect(ctx, (width - 400) / 2, 1120, 400, 60, 30);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
    ctx.fillText("crisiswatch-web.vercel.app", width / 2, 1158);
    ctx.restore();
    
    // Bottom branding
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "16px system-ui, -apple-system, sans-serif";
    ctx.fillText("Verified by AI • Trusted Sources • Real-time Analysis", width / 2, 1230);
    
    // Hashtag
    ctx.fillStyle = config.color;
    ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
    ctx.fillText("#FactOrCap #StopMisinformation", width / 2, 1280);
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png", 1.0);
    });
  }, [claim, verdict, confidence, sources, evidence, config]);
  
  const handleCopyImage = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateImage();
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob })
        ]);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy image:", err);
      // Fallback: download the image
      await handleDownload();
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateImage();
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `factorcap-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleShareTwitter = async () => {
    const verdictEmoji = verdict === "TRUE" ? "✅" : verdict === "FALSE" ? "🧢" : "🤔";
    const text = encodeURIComponent(
      `${verdictEmoji} ${config.label}!\n\n"${claim.slice(0, 100)}${claim.length > 100 ? "..." : ""}"\n\n` +
      `${confidence}% confidence • ${sources} sources\n\n` +
      `Checked with Fact or Cap 🧢\nhttps://crisiswatch-web.vercel.app`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };
  
  const handleShareWhatsApp = async () => {
    const verdictEmoji = verdict === "TRUE" ? "✅" : verdict === "FALSE" ? "🧢" : "🤔";
    const text = encodeURIComponent(
      `${verdictEmoji} *${config.label}*\n\n` +
      `📝 Claim: "${claim.slice(0, 150)}${claim.length > 150 ? "..." : ""}"\n\n` +
      `📊 Confidence: ${confidence}%\n` +
      `📚 Sources: ${sources}\n\n` +
      `🔍 Check any claim at:\nhttps://crisiswatch-web.vercel.app\n\n` +
      `#FactOrCap 🧢`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };
  
  const handleShareInstagram = async () => {
    // Instagram doesn't have a direct share API like Twitter/WhatsApp
    // Best we can do is download the image and guide user to share
    setIsGenerating(true);
    try {
      const blob = await generateImage();
      if (blob) {
        // On mobile, try native share
        if (navigator.share && navigator.canShare) {
          const file = new File([blob], `factorcap-${Date.now()}.png`, { type: "image/png" });
          const shareData = {
            files: [file],
            title: "Fact or Cap - Fact Check Result",
            text: `${config.emoji} ${config.label}! Check it out on Fact or Cap 🧢`,
          };
          
          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return;
          }
        }
        
        // Fallback: download and show instructions
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `factorcap-instagram-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show instructions toast
        alert("📸 Image downloaded! Open Instagram and share it to your Story or Feed.");
      }
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleNativeShare = async () => {
    if (!navigator.share) {
      handleDownload();
      return;
    }
    
    setIsGenerating(true);
    try {
      const blob = await generateImage();
      if (blob) {
        const file = new File([blob], `factorcap-${Date.now()}.png`, { type: "image/png" });
        const shareData = {
          files: [file],
          title: "Fact or Cap - Fact Check Result",
          text: `${config.emoji} ${config.label}! Verified with Fact or Cap 🧢 - https://crisiswatch-web.vercel.app`,
        };
        
        if (navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData);
        } else {
          // Fallback to text-only share
          await navigator.share({
            title: "Fact or Cap - Fact Check Result",
            text: `${config.emoji} ${config.label}!\n"${claim.slice(0, 100)}..."\n${confidence}% confidence`,
            url: "https://crisiswatch-web.vercel.app",
          });
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Share failed:", err);
        handleDownload();
      }
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="relative max-w-2xl w-full bg-dark-900 rounded-2xl border border-white/10 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h3 className="text-lg font-semibold text-white mb-4">Share Your Result</h3>
        
        {/* Preview card */}
        <div 
          className="relative aspect-[1.91/1] rounded-xl overflow-hidden mb-6"
          style={{ background: config.bgGradient }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <div 
              className="px-6 py-2 rounded-full mb-4 border"
              style={{ 
                backgroundColor: config.color + "30",
                borderColor: config.color + "60"
              }}
            >
              <span className="text-lg font-bold" style={{ color: config.color }}>
                {config.emoji} {config.label}
              </span>
            </div>
            <p className="text-white text-sm md:text-base mb-4 line-clamp-3">"{claim}"</p>
            <div className="flex gap-6 text-white/80 text-sm">
              <span>{confidence}% confidence</span>
              <span>•</span>
              <span>{sources} sources</span>
            </div>
          </div>
          <div className="absolute bottom-3 left-0 right-0 text-center text-white/40 text-xs">
            🧢 Fact or Cap
          </div>
        </div>
        
        {/* Hidden canvas for image generation */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Share buttons - 2 rows */}
        <div className="space-y-3">
          {/* Primary share buttons */}
          <div className="grid grid-cols-4 gap-3">
            <motion.button
              onClick={handleShareWhatsApp}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/30 transition-colors"
            >
              <svg className="w-6 h-6 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="text-xs text-[#25D366]">WhatsApp</span>
            </motion.button>
            
            <motion.button
              onClick={handleShareInstagram}
              disabled={isGenerating}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-[#833AB4]/20 via-[#E1306C]/20 to-[#F77737]/20 hover:from-[#833AB4]/30 hover:via-[#E1306C]/30 hover:to-[#F77737]/30 border border-[#E1306C]/30 transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="url(#instagram-gradient)">
                <defs>
                  <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#F77737"/>
                    <stop offset="50%" stopColor="#E1306C"/>
                    <stop offset="100%" stopColor="#833AB4"/>
                  </linearGradient>
                </defs>
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span className="text-xs bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] bg-clip-text text-transparent">Instagram</span>
            </motion.button>
            
            <motion.button
              onClick={handleShareTwitter}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 border border-[#1DA1F2]/30 transition-colors"
            >
              <svg className="w-6 h-6 text-[#1DA1F2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span className="text-xs text-[#1DA1F2]">X / Twitter</span>
            </motion.button>
            
            <motion.button
              onClick={handleNativeShare}
              disabled={isGenerating}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="text-xs text-white/80">More...</span>
            </motion.button>
          </div>
          
          {/* Secondary actions */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              onClick={handleCopyImage}
              disabled={isGenerating}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span className="text-sm text-white/80">
                {showCopied ? "Copied!" : "Copy Image"}
              </span>
            </motion.button>
            
            <motion.button
              onClick={handleDownload}
              disabled={isGenerating}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="text-sm text-white/80">Download</span>
            </motion.button>
          </div>
        </div>
        
        {isGenerating && (
          <div className="absolute inset-0 bg-dark-900/80 rounded-2xl flex items-center justify-center">
            <div className="flex items-center gap-3 text-white">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating image...
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// Helper functions for canvas drawing
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

function drawStatBox(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, value: string, label: string, color: string) {
  // Background
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  roundRect(ctx, x, y, width, 70, 12);
  ctx.fill();
  
  // Value
  ctx.fillStyle = color;
  ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(value, x + width / 2, y + 32);
  
  // Label
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = "12px system-ui, -apple-system, sans-serif";
  ctx.fillText(label, x + width / 2, y + 54);
}

function drawModernStatCard(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, value: string, label: string, color: string) {
  // Card background with glass effect
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, width, height, 16);
  ctx.fill();
  ctx.stroke();
  
  // Accent line at top
  ctx.fillStyle = color;
  roundRect(ctx, x + 20, y, width - 40, 3, 2);
  ctx.fill();
  
  // Value
  ctx.fillStyle = color;
  ctx.font = "bold 42px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(value, x + width / 2, y + height / 2 - 10);
  
  // Label
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = "bold 14px system-ui, -apple-system, sans-serif";
  ctx.fillText(label, x + width / 2, y + height - 25);
  ctx.restore();
}

// Export a simple share button that can be used in live-demo
export function ShareVerdictButton({ 
  result, 
  className = "" 
}: { 
  result: {
    claim: string;
    verdict: string;
    confidence: number;
    sources: number;
    evidence?: Array<{ source: string; snippet?: string }>;
  };
  className?: string;
}) {
  const [showCard, setShowCard] = useState(false);
  
  return (
    <>
      <motion.button
        onClick={() => setShowCard(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500/20 to-accent-500/20 border border-primary-500/30 text-primary-300 hover:border-primary-500/50 transition-all text-sm font-medium ${className}`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Create Card
      </motion.button>
      
      <AnimatePresence>
        {showCard && (
          <VerdictCard
            claim={result.claim}
            verdict={result.verdict}
            confidence={result.confidence}
            sources={result.sources}
            evidence={result.evidence}
            onClose={() => setShowCard(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
