import { useState, useEffect } from "react";
import { useSettings } from "../context/SettingsContext";
import { Timer, Sparkles } from "lucide-react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export function EidCountdown({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const { settings } = useSettings();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    if (!settings?.eid_offer_enabled) return;

    // Target is May 30th, 2026 (Summer time Egypt is UTC+3)
    const targetDate = new Date("2026-05-30T23:59:59+03:00").getTime();

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false
      };
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [settings?.eid_offer_enabled]);

  if (!settings?.eid_offer_enabled || timeLeft.isExpired) {
    return null;
  }

  // Mini version for card if needed anywhere
  if (size === "sm") {
    return (
      <div className="flex items-center gap-1.5 bg-emerald-950/90 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[9px] font-mono leading-none shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-bold">عرض العيد:</span>
        <span className="font-black text-emerald-100">
          {timeLeft.days}d {timeLeft.hours}h
        </span>
      </div>
    );
  }

  return (
    <div className="w-full select-none text-center">
      {/* Target Offer Date Label */}
      <div className="flex items-center justify-between text-[11px] text-emerald-400/90 mb-3 px-1 font-semibold" style={{ direction: "rtl" }}>
        <span className="flex items-center gap-1.5">
          <Timer className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
          <span>ينتهي العرض رابع أيام العيد إن شاء الله</span>
        </span>
        <div className="flex items-center gap-1 text-amber-400/95">
          <Sparkles className="h-3 w-3 animate-spin" style={{ animationDuration: "10s" }} />
          <span className="font-mono text-[9px] tracking-wider uppercase">COUNTDOWN</span>
        </div>
      </div>

      {/* Modern Compact Floating Digital Grid */}
      <div className="grid grid-cols-4 gap-2.5" style={{ direction: "ltr" }}>
        {/* Days */}
        <div className="relative overflow-hidden bg-black/45 backdrop-blur-md rounded-xl py-2 px-1 border border-white/5 shadow-inner">
          <span className="block font-mono text-2xl md:text-3xl font-bold text-white leading-none tracking-tight">
            {String(timeLeft.days).padStart(2, '0')}
          </span>
          <span className="text-[8px] sm:text-[9.5px] text-emerald-400/90 font-black tracking-wide uppercase mt-1.5 block">
            Days
          </span>
        </div>

        {/* Hours */}
        <div className="relative overflow-hidden bg-black/45 backdrop-blur-md rounded-xl py-2 px-1 border border-white/5 shadow-inner">
          <span className="block font-mono text-2xl md:text-3xl font-bold text-white leading-none tracking-tight">
            {String(timeLeft.hours).padStart(2, '0')}
          </span>
          <span className="text-[8px] sm:text-[9.5px] text-emerald-400/90 font-black tracking-wide uppercase mt-1.5 block">
            Hours
          </span>
        </div>

        {/* Minutes */}
        <div className="relative overflow-hidden bg-black/45 backdrop-blur-md rounded-xl py-2 px-1 border border-white/5 shadow-inner">
          <span className="block font-mono text-2xl md:text-3xl font-bold text-white leading-none tracking-tight">
            {String(timeLeft.minutes).padStart(2, '0')}
          </span>
          <span className="text-[8px] sm:text-[9.5px] text-emerald-400/90 font-black tracking-wide uppercase mt-1.5 block">
            Mins
          </span>
        </div>

        {/* Seconds */}
        <div className="relative overflow-hidden bg-gradient-to-b from-amber-500/10 to-amber-500/0 bg-black/45 backdrop-blur-md rounded-xl py-2 px-1 border border-amber-500/15 shadow-[0_0_15px_rgba(245,158,11,0.08)]">
          <span className="block font-mono text-2xl md:text-3xl font-bold text-amber-400 leading-none tracking-tight animate-pulse">
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <span className="text-[8px] sm:text-[9.5px] text-amber-400/90 font-black tracking-wide uppercase mt-1.5 block">
            Secs
          </span>
        </div>
      </div>
    </div>
  );
}
