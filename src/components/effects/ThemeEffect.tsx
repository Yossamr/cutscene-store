import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const franchiseThemes: Record<string, any> = {
  "michael": {
    primary: "#EAB308", dark: "#020617", quote: "You've been hit by a smooth criminal.", effect: "smoke", vignette: "rgba(2,6,23,0.8)", cursor: "default",
    bgImage: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=2000&auto=format&fit=crop" // Stage/concert lighting
  },
  "spider man": {
    primary: "#EF4444", dark: "#0f172a", quote: "With great power comes great responsibility.", effect: "glitch", vignette: "rgba(15,23,42,0.8)", cursor: "crosshair",
    bgImage: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2000&auto=format&fit=crop" // City at night/skyline
  },
  "the punisher": {
    primary: "#D4D4D8", dark: "#09090b", quote: "One batch, two batch. Penny and dime.", effect: "blood", vignette: "rgba(9,9,11,0.9)", cursor: "crosshair",
    bgImage: "https://images.unsplash.com/photo-1620288627223-53302f4e8c74?q=80&w=2000&auto=format&fit=crop" // Dark grunge texture
  },
  "attack on titan": {
    primary: "#dc2626", dark: "#2a0505", quote: "SHINZOU WO SASAGEYO!", effect: "embers", vignette: "rgba(69,10,10,0.7)", cursor: "crosshair",
    bgImage: "https://images.unsplash.com/photo-1542451313056-b7c8e626645f?q=80&w=2000&auto=format&fit=crop" // Huge wall / smoke aesthetic
  },
  "breaking bad": {
    primary: "#10B981", dark: "#064E3B", quote: "I am the danger.", effect: "smoke", vignette: "rgba(6,78,59,0.3)", cursor: "crosshair",
    bgImage: "https://images.unsplash.com/photo-1534063546747-d5ab7104b2b4?q=80&w=2000&auto=format&fit=crop" // Desert aesthetic
  },
  "dexter": {
    primary: "#DC2626", dark: "#450a0a", quote: "Tonight's the night.", effect: "blood", vignette: "rgba(69,10,10,0.5)", cursor: "crosshair",
    bgImage: "https://images.unsplash.com/photo-1506544777-64cfbea771e8?q=80&w=2000&auto=format&fit=crop" // Dark water / Miami night aesthetic
  },
  "fight club": {
    primary: "#EC4899", dark: "#111827", quote: "The first rule of Fight Club is: You do not talk about Fight Club.", effect: "glitch", vignette: "rgba(17,24,39,0.8)", cursor: "crosshair",
    bgImage: "https://images.unsplash.com/photo-1508802521199-3171cd2ea8f8?q=80&w=2000&auto=format&fit=crop" // Gritty basement / concrete
  },
  "game of thrones": {
    primary: "#60A5FA", dark: "#0f172a", quote: "Winter is coming.", effect: "snow", vignette: "rgba(15,23,42,0.8)", cursor: "default",
    bgImage: "https://images.unsplash.com/photo-1481504289871-3cb523f2ea71?q=80&w=2000&auto=format&fit=crop" // Snowy winter
  },
  "la casa de papel": {
    primary: "#EF4444", dark: "#171717", quote: "Bella Ciao.", effect: "money", vignette: "rgba(23,23,23,0.8)", cursor: "crosshair",
    bgImage: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=2000&auto=format&fit=crop" // Money / Vault aesthetic
  },
  "peaky blinders": {
    primary: "#D97706", dark: "#1c1917", quote: "By order of the Peaky Blinders.", effect: "embers", vignette: "rgba(28,25,23,0.8)", cursor: "crosshair",
    bgImage: "https://images.unsplash.com/photo-1510360814457-3c72b22bb3f3?q=80&w=2000&auto=format&fit=crop" // Vintage 1920s street / smoke
  },
  "stranger things": {
    primary: "#E11D48", dark: "#020617", quote: "Friends don't lie.", effect: "spores", vignette: "rgba(2,6,23,0.8)", cursor: "crosshair",
    bgImage: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2000&auto=format&fit=crop" // Upside down / dark red woods
  },
  "the godfather": {
    primary: "#B45309", dark: "#000000", quote: "I'm gonna make him an offer he can't refuse.", effect: "petals", vignette: "rgba(0,0,0,0.9)", cursor: "default",
    bgImage: "https://images.unsplash.com/photo-1498036882173-b41c28af5c6c?q=80&w=2000&auto=format&fit=crop" // Dark noir / office
  },
  "the walking dead": {
    primary: "#8b0000", dark: "#0f0f0f", quote: "Don't Open, Dead Inside.", effect: "blood_smoke", vignette: "rgba(30,30,30,0.9)", cursor: "crosshair",
    bgImage: "https://images.unsplash.com/photo-1478556606048-73595eb2fa0f?q=80&w=2000&auto=format&fit=crop"
  },
  "demon slayer": {
    primary: "#2dd4bf", dark: "#020617", quote: "Set your heart ablaze!", effect: "petals", vignette: "rgba(45,212,191,0.2)", cursor: "crosshair",
    bgImage: "https://images.unsplash.com/photo-1528164344705-47542687000d?q=80&w=2000&auto=format&fit=crop" // Japanese Shrine / Nature aesthetic
  }
};

const FilmGrain = () => (
  <div className="fixed inset-0 pointer-events-none z-[1] opacity-[0.08] mix-blend-screen"
       style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
  />
);

const Vignette = ({ color, bgImage }: { color: string, bgImage?: string }) => (
  <>
    {bgImage && (
      <div 
        className="fixed inset-0 pointer-events-none z-[1] bg-cover bg-center bg-no-repeat opacity-20 mix-blend-overlay"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
    )}
    <motion.div 
      className="fixed inset-0 pointer-events-none z-[2]"
      animate={{ opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      style={{ background: `radial-gradient(circle at center, transparent 20%, ${color} 150%)` }}
    />
  </>
);

export const InlineQuote = ({ franchise }: { franchise: string | null }) => {
  if (!franchise) return null;
  const normalizedFranchise = franchise.toLowerCase().trim();
  const theme = franchiseThemes[normalizedFranchise];
  if (!theme) return null;

  return (
    <motion.div 
      key={franchise}
      initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="w-full py-8 md:py-12 flex justify-center items-center pointer-events-none"
    >
      <div className="relative px-4 text-center">
        <p className="font-brand text-lg md:text-2xl lg:text-3xl font-black uppercase tracking-[0.3em] italic" style={{ color: theme.primary, textShadow: `0 0 20px ${theme.primary}80, 0 0 40px ${theme.primary}40` }}>
          "{theme.quote}"
        </p>
        <div className="h-px w-2/3 max-w-md mx-auto mt-6 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
    </motion.div>
  );
};

// --- Effect Components ---

const SnowEffect = React.memo(() => {
  const particles = React.useMemo(() => Array.from({ length: 150 }).map(() => ({
    width: Math.random() * 4 + 2 + "px",
    height: Math.random() * 4 + 2 + "px",
    opacity: Math.random() * 0.6 + 0.2,
    filter: `blur(${Math.random() * 2}px)`,
    initialX: Math.random() * window.innerWidth,
    animateX: `calc(${Math.random() * 100}vw + ${Math.random() * 200 - 100}px)`,
    duration: Math.random() * 10 + 5,
    delay: Math.random() * 5,
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute bg-blue-100 rounded-full"
          style={{ width: p.width, height: p.height, opacity: p.opacity, filter: p.filter }}
          initial={{ x: p.initialX, y: -20 }}
          animate={{ y: window.innerHeight + 20, x: p.animateX }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "linear", delay: p.delay }}
        />
      ))}
    </div>
  );
});

const BloodEffect = React.memo(() => {
  const particles = React.useMemo(() => Array.from({ length: 35 }).map(() => ({
    left: `${Math.random() * 100}%`,
    targetHeight: Math.random() * 400 + 100,
    duration: Math.random() * 4 + 2,
    delay: Math.random() * 7,
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute inset-0 bg-red-900/10 mix-blend-color-burn" />
      <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-red-900/30 to-transparent" />
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute top-0 w-1.5 bg-red-600/80 rounded-b-full shadow-[0_5px_15px_rgba(220,38,38,0.8)]"
          style={{ left: p.left }}
          initial={{ height: 0, opacity: 0.9 }}
          animate={{ height: p.targetHeight, opacity: [0.9, 0.9, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "easeIn", delay: p.delay }}
        />
      ))}
    </div>
  );
});

const SmokeEffect = React.memo(({ color }: { color?: string }) => {
  const particles = React.useMemo(() => Array.from({ length: 15 }).map((_, i) => ({
    left: `${Math.random() * 100}%`,
    width: Math.random() * 300 + 200 + "px",
    height: Math.random() * 300 + 200 + "px",
    filter: `blur(${Math.random() * 40 + 40}px)`,
    animateX: Math.random() * 400 - 200,
    duration: Math.random() * 15 + 15,
    delay: Math.random() * 10,
    opacity: Math.random() * 0.3 + 0.1
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-60">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute bottom-0 rounded-full mix-blend-screen"
          style={{ 
            left: p.left, 
            width: p.width, 
            height: p.height, 
            backgroundColor: color || 'rgba(255, 255, 255, 0.15)', 
            filter: p.filter 
          }}
          initial={{ y: 200, x: 0, opacity: 0, scale: 0.8 }}
          animate={{ y: -window.innerHeight - 200, x: p.animateX, opacity: [0, p.opacity, 0], scale: [0.8, 1.5, 2] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "linear", delay: p.delay }}
        />
      ))}
    </div>
  );
});

const EmbersEffect = React.memo(() => {
  const particles = React.useMemo(() => Array.from({ length: 80 }).map(() => ({
    width: Math.random() * 5 + 1 + "px",
    height: Math.random() * 5 + 1 + "px",
    backgroundColor: Math.random() > 0.5 ? '#f59e0b' : '#ef4444',
    boxShadow: `0 0 ${Math.random() * 15 + 5}px ${Math.random() > 0.5 ? '#f59e0b' : '#ef4444'}`,
    initialX: Math.random() * window.innerWidth,
    animateX: `calc(${Math.random() * 100}vw + ${Math.random() * 300 - 150}px)`,
    duration: Math.random() * 5 + 3,
    delay: Math.random() * 5,
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-black/40 to-transparent" />
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ width: p.width, height: p.height, backgroundColor: p.backgroundColor, boxShadow: p.boxShadow }}
          initial={{ x: p.initialX, y: window.innerHeight + 20, opacity: 1 }}
          animate={{ y: -20, x: p.animateX, opacity: [0, 1, 1, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "easeOut", delay: p.delay }}
        />
      ))}
    </div>
  );
});

const SporesEffect = React.memo(() => {
  const particles = React.useMemo(() => Array.from({ length: 100 }).map(() => ({
    width: Math.random() * 4 + 1 + "px",
    height: Math.random() * 4 + 1 + "px",
    backgroundColor: Math.random() > 0.8 ? '#ef4444' : '#d1d5db',
    opacity: Math.random() * 0.6 + 0.2,
    filter: `blur(${Math.random() * 2}px)`,
    initialX: Math.random() * window.innerWidth,
    initialY: Math.random() * window.innerHeight,
    animateY: Math.random() * window.innerHeight,
    animateX: Math.random() * window.innerWidth,
    duration: Math.random() * 30 + 15,
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden mix-blend-screen">
      <div className="absolute inset-0 bg-red-900/10 mix-blend-overlay" />
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ width: p.width, height: p.height, backgroundColor: p.backgroundColor, opacity: p.opacity, filter: p.filter }}
          initial={{ x: p.initialX, y: p.initialY }}
          animate={{ y: [null, p.animateY], x: [null, p.animateX] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
});

const MoneyEffect = React.memo(() => {
  const particles = React.useMemo(() => Array.from({ length: 40 }).map(() => ({
    width: Math.random() * 25 + 30 + "px",
    height: Math.random() * 12 + 15 + "px",
    initialX: Math.random() * window.innerWidth,
    animateX: `calc(${Math.random() * 100}vw + ${Math.random() * 400 - 200}px)`,
    duration: Math.random() * 7 + 5,
    delay: Math.random() * 7,
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute bg-green-600/40 border border-green-500/30 rounded-sm shadow-sm backdrop-blur-sm"
          style={{ width: p.width, height: p.height }}
          initial={{ x: p.initialX, y: -50, rotateX: 0, rotateY: 0, rotateZ: 0 }}
          animate={{ y: window.innerHeight + 50, x: p.animateX, rotateX: 720, rotateY: 360, rotateZ: 180 }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "linear", delay: p.delay }}
        />
      ))}
    </div>
  );
});

const GlitchEffect = React.memo(() => {
  const repeatDelay = React.useMemo(() => Math.random() * 3 + 1, []);
  
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden mix-blend-screen opacity-30">
      <motion.div 
        className="absolute inset-0 bg-pink-500/20"
        animate={{
          clipPath: [
            "inset(20% 0 80% 0)",
            "inset(60% 0 10% 0)",
            "inset(40% 0 50% 0)",
            "inset(80% 0 5% 0)",
            "inset(10% 0 70% 0)"
          ],
          x: [-15, 15, -10, 10, 0],
          filter: ["hue-rotate(0deg)", "hue-rotate(90deg)", "hue-rotate(180deg)"]
        }}
        transition={{
          duration: 0.2,
          repeat: Infinity,
          repeatType: "mirror",
          repeatDelay: repeatDelay
        }}
      />
    </div>
  );
});

const PetalsEffect = React.memo(({ color }: { color?: string }) => {
  const particles = React.useMemo(() => Array.from({ length: 45 }).map(() => ({
    width: Math.random() * 12 + 10 + "px",
    height: Math.random() * 12 + 10 + "px",
    filter: `blur(${Math.random() * 1}px)`,
    initialX: Math.random() * window.innerWidth,
    animateX: `calc(${Math.random() * 100}vw + ${Math.random() * 200 - 100}px)`,
    duration: Math.random() * 9 + 6,
    delay: Math.random() * 8,
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-tl-full rounded-br-full shadow-sm"
          style={{ backgroundColor: color || "#b91c1c", width: p.width, height: p.height, filter: p.filter }}
          initial={{ x: p.initialX, y: -50, rotate: 0, rotateX: 0 }}
          animate={{ y: window.innerHeight + 50, x: p.animateX, rotate: 720, rotateX: 360 }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "linear", delay: p.delay }}
        />
      ))}
    </div>
  );
});

// --- Main Component ---

export function ThemeEffect({ franchise }: { franchise: string | null }) {
  if (!franchise) return null;

  const normalizedFranchise = franchise.toLowerCase().trim();
  const theme = franchiseThemes[normalizedFranchise];

  const [clicks, setClicks] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const newClick = { id: Date.now(), x: e.clientX, y: e.clientY };
      setClicks((prev) => [...prev, newClick]);
      setTimeout(() => {
        setClicks((prev) => prev.filter((c) => c.id !== newClick.id));
      }, 1000);
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  if (!theme) return null;

  return (
    <>
      <style>
        {`
          :root {
            --color-brand-primary: ${theme.primary} !important;
            --color-brand-dark: ${theme.dark} !important;
          }
          body, main {
            background-color: ${theme.dark} !important;
            color: #ffffff !important;
            cursor: ${theme.cursor}, auto !important;
          }
          ::-webkit-scrollbar {
            width: 6px;
          }
          ::-webkit-scrollbar-track {
            background: #050505;
          }
          ::-webkit-scrollbar-thumb {
            background: ${theme.primary};
            border-radius: 10px;
          }
          .bg-white { 
            background-color: rgba(15, 15, 15, 0.5) !important; 
            backdrop-filter: blur(16px) !important; 
            border-color: rgba(255,255,255,0.05) !important;
            color: #ffffff !important;
          }
          .text-gray-900, .text-brand-dark { color: #ffffff !important; }
          .text-gray-500, .text-gray-600 { color: #a1a1aa !important; }
          .bg-gray-50, .bg-brand-card { background-color: rgba(255,255,255,0.02) !important; }
          .bg-gray-100 { background-color: rgba(255,255,255,0.05) !important; }
          .border-gray-100, .border-gray-200 { border-color: rgba(255,255,255,0.05) !important; }
          .shadow-sm, .shadow-md, .shadow-xl, .shadow-2xl { box-shadow: 0 10px 40px rgba(0,0,0,0.5) !important; }
        `}
      </style>
      
      <FilmGrain />
      <Vignette color={theme.vignette} bgImage={theme.bgImage} />

      {/* Click Effects */}
      <div className="fixed inset-0 pointer-events-none z-[99999]">
        <AnimatePresence>
          {clicks.map((click) => (
            <motion.div
              key={click.id}
              initial={{ opacity: 1, scale: 0 }}
              animate={{ opacity: 0, scale: 2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute rounded-full"
              style={{
                left: click.x - 10,
                top: click.y - 10,
                width: 20,
                height: 20,
                backgroundColor: theme.primary,
                boxShadow: `0 0 20px ${theme.primary}`,
                filter: theme.effect === "blood" ? "blur(2px)" : "blur(4px)",
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Visual Effect */}
      <div className="fixed inset-0 pointer-events-none z-[0]">
        {theme.effect === "snow" && <SnowEffect />}
        {(theme.effect === "blood" || theme.effect === "blood_smoke") && <BloodEffect />}
        {(theme.effect === "smoke" || theme.effect === "blood_smoke") && <SmokeEffect color={theme.primary} />}
        {theme.effect === "embers" && <EmbersEffect />}
        {theme.effect === "spores" && <SporesEffect />}
        {theme.effect === "money" && <MoneyEffect />}
        {theme.effect === "glitch" && <GlitchEffect />}
        {theme.effect === "petals" && <PetalsEffect color={theme.primary} />}
      </div>
    </>
  );
}
