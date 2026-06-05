import { motion, AnimatePresence } from "motion/react";
import { CinematicLoader } from "./CinematicLoader";
import { useEffect, useState } from "react";

export const SplashScreen = ({ onComplete, isSyncing }: { onComplete: () => void, isSyncing?: boolean }) => {
  const [count, setCount] = useState(3);
  const [phase, setPhase] = useState<"countdown" | "burn" | "action" | "logo">("countdown");

  useEffect(() => {
    if (phase === "countdown") {
      if (count > 0) {
        const timer = setTimeout(() => setCount(count - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setPhase("burn");
      }
    } else if (phase === "burn") {
      const timer = setTimeout(() => setPhase("action"), 400);
      return () => clearTimeout(timer);
    } else if (phase === "action") {
      const timer = setTimeout(() => setPhase("logo"), 1000);
      return () => clearTimeout(timer);
    } else if (phase === "logo") {
      // Only complete if the animation phase is logo AND synchronization is finished
      if (!isSyncing) {
        const timer = setTimeout(onComplete, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [count, phase, onComplete, isSyncing]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#1C2B34] overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      {/* ... layered textures ... */}
      {/* (Keep existing textures) */}
      <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.06] mix-blend-screen" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
      />
      
      <motion.div 
        className="absolute inset-0 z-40 pointer-events-none opacity-30"
        animate={{ x: [-2, 2, -1, 3, -2], y: [2, -2, 1, -3, 2] }}
        transition={{ duration: 0.08, repeat: Infinity }}
      >
        <div className="absolute top-0 left-[15%] w-[1px] h-full bg-brand-card/10 blur-[0.5px]" />
        <div className="absolute top-0 left-[85%] w-[1px] h-full bg-brand-dark/5" />
        <div className="absolute top-[45%] left-0 w-full h-[1px] bg-white/10 blur-[1px]" />
      </motion.div>

      <motion.div 
        className="absolute inset-0 bg-white opacity-0 z-40 pointer-events-none"
        animate={{ 
          opacity: [0, 0.03, 0, 0.05, 0.02, 0],
          scale: [1, 1.002, 1, 0.998, 1]
        }}
        transition={{ duration: 0.12, repeat: Infinity }}
      />

      <div className="absolute inset-0 z-30 pointer-events-none shadow-[inset_0_0_200px_rgba(0,0,0,1)]" />

      <AnimatePresence mode="wait">
        {/* ... existing phases ... */}
        {phase === "countdown" && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-20 flex flex-col items-center justify-center"
          >
            {/* SMPTE Style Film Leader - Responsive Sizes */}
            <div className="relative h-48 w-48 sm:h-64 sm:w-64 md:h-80 md:w-80 rounded-full border-2 border-brand-primary/20 flex items-center justify-center">
              {/* Rotating Sweep */}
              <motion.div 
                className="absolute inset-0 rounded-full border-t-4 border-brand-primary/60"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              
              {/* Technical Grid */}
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <div className="w-full h-[1px] bg-brand-primary" />
                <div className="h-full w-[1px] bg-brand-primary" />
                <div className="absolute w-full h-full border border-brand-primary/30 rounded-full scale-75" />
                <div className="absolute w-full h-full border border-brand-primary/30 rounded-full scale-50" />
              </div>
              
              {/* The Countdown Number - Responsive Text */}
              <motion.span 
                key={count}
                initial={{ scale: 2, opacity: 0, filter: "blur(10px)" }}
                animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                className="text-6xl sm:text-8xl md:text-[10rem] font-mono font-black text-brand-primary italic drop-shadow-[0_0_40px_rgba(58,134,255,0.7)]"
              >
                {count}
              </motion.span>
            </div>
            
            <motion.div 
              className="mt-8 sm:mt-12 md:mt-16 flex flex-col items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex gap-1.5 sm:gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-1 sm:h-1.5 w-8 sm:w-10 md:w-12 bg-brand-primary/10 rounded-full overflow-hidden border border-brand-dark/10">
                    {3-i <= count && (
                      <motion.div 
                        className="h-full bg-brand-primary shadow-[0_0_10px_#3a86ff]"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1, ease: "linear" }}
                      />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.4em] sm:tracking-[0.8em] text-brand-primary/50 ml-[0.4em] sm:ml-[0.8em]">
                Loading Reel
              </p>
            </motion.div>
          </motion.div>
        )}

        {phase === "burn" && (
          <motion.div
            key="burn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] pointer-events-none"
          >
            {/* Film Burn Effect */}
            <motion.div 
              className="absolute inset-0 bg-orange-500 mix-blend-screen"
              animate={{ 
                opacity: [0, 0.8, 0],
                scale: [1, 1.5, 2],
                filter: ["blur(0px)", "blur(40px)", "blur(100px)"]
              }}
              transition={{ duration: 0.4 }}
            />
          </motion.div>
        )}

        {phase === "action" && (
          <motion.div
            key="action"
            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 1.5, opacity: 0, filter: "blur(20px)" }}
            className="relative z-20 flex flex-col items-center"
          >
            {/* Custom Built Clapperboard - Responsive Sizes */}
            <div className="w-48 h-36 sm:w-56 sm:h-42 md:w-64 md:h-48 bg-white/10 border-2 sm:border-4 border-white/15 rounded-lg sm:rounded-xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] sm:shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
              {/* Top Bar (Moving) */}
              <motion.div 
                className="h-8 sm:h-10 md:h-12 w-full bg-brand-dark flex origin-bottom-left border-b-2 sm:border-b-4 border-brand-dark/20"
                initial={{ rotate: -35 }}
                animate={{ rotate: [null, 0] }}
                transition={{ delay: 0.3, duration: 0.1, ease: "easeIn" }}
              >
                {/* Stripes */}
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={`flex-1 h-full ${i % 2 === 0 ? 'bg-white' : 'bg-black'} skew-x-[-20deg]`} />
                ))}
              </motion.div>
              
              {/* Bottom Bar (Static) */}
              <div className="h-8 sm:h-10 md:h-12 w-full bg-brand-dark flex border-b border-brand-dark/5">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={`flex-1 h-full ${i % 2 === 0 ? 'bg-white' : 'bg-black'} skew-x-[-20deg]`} />
                ))}
              </div>

              {/* Info Area */}
              <div className="flex-1 p-2 sm:p-4 grid grid-cols-2 gap-1 sm:gap-2 font-mono text-[6px] sm:text-[8px] uppercase tracking-tighter text-white/40">
                <div className="border border-white/5 p-0.5 sm:p-1">PROD: CUTSCENE</div>
                <div className="border border-white/5 p-0.5 sm:p-1">ROLL: 01</div>
                <div className="border border-white/5 p-0.5 sm:p-1">SCENE: 1A</div>
                <div className="border border-white/5 p-0.5 sm:p-1">TAKE: 1</div>
              </div>
            </div>

            {/* ACTION Flash */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 3, 4] }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="absolute inset-0 bg-brand-primary/30 blur-[80px] sm:blur-[120px] rounded-full z-[-1]"
            />

            {/* ACTION Text - Responsive Typography */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.5 }}
              animate={{ opacity: 1, y: -100, scale: 1.1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              className="absolute left-1/2 -translate-x-1/2"
            >
              <span className="text-5xl sm:text-7xl md:text-8xl font-brand font-black italic text-white tracking-tighter drop-shadow-[0_0_30px_rgba(58,134,255,0.8)]">
                ACTION!
              </span>
            </motion.div>
          </motion.div>
        )}

        {phase === "logo" && (
          <motion.div
            key="logo"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-20 flex flex-col items-center px-4"
          >
            <motion.div
              animate={{ 
                filter: ["brightness(1) contrast(1)", "brightness(1.3) contrast(1.1)", "brightness(1) contrast(1)"],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-center"
            >
              <h1 className="text-5xl sm:text-7xl md:text-9xl font-brand font-black text-white tracking-tighter italic leading-none drop-shadow-[0_0_50px_rgba(58,134,255,0.2)]">
                cut<span className="text-brand-primary">s</span>cene
              </h1>
              
              <motion.div 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "100%", opacity: 1 }}
                transition={{ delay: 0.4, duration: 1 }}
                className="h-[1px] sm:h-[2px] bg-gradient-to-r from-transparent via-brand-primary to-transparent mt-4 sm:mt-6 mb-3 sm:mb-4"
              />
              
              <div className="flex flex-col items-center gap-2">
                <p className="text-[8px] sm:text-[10px] md:text-xs font-black uppercase tracking-[0.4em] sm:tracking-[0.8em] text-brand-primary/70 ml-[0.4em] sm:ml-[0.8em]">
                  The Director's Cut
                </p>
                
                {isSyncing && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4 mt-8"
                  >
                    <CinematicLoader size="sm" label="Syncing Database" />
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Cinematic Volumetric Light */}
            <div className="absolute -inset-40 sm:-inset-60 bg-radial-[circle_at_50%_50%] from-brand-primary/10 to-transparent blur-[100px] sm:blur-[150px] z-[-1]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Film Strip Sidebars (Enhanced & Responsive) */}
      <div className="absolute left-0 top-0 bottom-0 w-6 sm:w-10 md:w-12 flex flex-col justify-around items-center py-4 sm:py-6 z-40 bg-black/80 border-r border-brand-dark/5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-3 h-5 sm:w-5 sm:h-8 md:w-6 md:h-10 border border-brand-primary/30 rounded-sm sm:rounded-md bg-black/90 shadow-[inset_0_0_10px_rgba(58,134,255,0.1)]" />
        ))}
      </div>
      <div className="absolute right-0 top-0 bottom-0 w-6 sm:w-10 md:w-12 flex flex-col justify-around items-center py-4 sm:py-6 z-40 bg-black/80 border-l border-brand-dark/5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-3 h-5 sm:w-5 sm:h-8 md:w-6 md:h-10 border border-brand-primary/30 rounded-sm sm:rounded-md bg-black/90 shadow-[inset_0_0_10px_rgba(58,134,255,0.1)]" />
        ))}
      </div>

      {/* Subtle Camera Shake */}
      <motion.div 
        className="fixed inset-0 pointer-events-none z-[1000]"
        animate={{ 
          x: [0, 0.5, -0.5, 0.2, 0],
          y: [0, -0.3, 0.3, -0.1, 0]
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* Skip Intro Button */}
      <div className="absolute top-8 right-16 md:right-24 z-[9999]">
        <button
          onClick={() => {
            if (!isSyncing) {
              onComplete();
            }
          }}
          disabled={isSyncing}
          className="px-4 py-2 bg-black/60 backdrop-blur-md text-brand-light/80 hover:text-white border border-brand-primary/30 rounded-full font-brand text-xs uppercase tracking-widest transition-all hover:bg-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed group flex items-center gap-2"
        >
          {isSyncing ? "Syncing..." : "Skip Intro"}
          {!isSyncing && <span className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-1">→</span>}
        </button>
      </div>
    </motion.div>
  );
};

import { Loader2 } from "lucide-react";



