import { motion } from "motion/react";
import { Gamepad2, Tv, Zap, Sparkles, CassetteTape, Gift } from "lucide-react";
import { Link } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import { EidCountdown } from "./EidCountdown";

export function HeroBanner() {
  const { settings } = useSettings();
  const isEidOffer = settings.eid_offer_enabled;
  const isPosterOffer = settings.free_poster_offer_enabled;

  if (isEidOffer) {
    return (
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#022c22] via-[#01140e] to-[#040c09] text-white shadow-2xl mt-4 md:mt-0 min-h-[380px] md:min-h-[460px] flex items-center border border-amber-500/20 mx-2 md:mx-0">
        
        {/* Luxury Decorative Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Soft shining gold stars */}
          <div 
            className="absolute inset-0 opacity-[0.12]" 
            style={{ 
              backgroundImage: `radial-gradient(circle at center, #f59e0b 1px, transparent 1px)`,
              backgroundSize: '20px 20px'
            }} 
          />
          
          {/* High-end ambient light beams */}
          <div className="absolute top-[-30%] left-[-15%] w-[60%] h-[60%] bg-emerald-500/10 blur-[90px] md:blur-[130px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-[-30%] right-[-15%] w-[60%] h-[60%] bg-amber-500/10 blur-[90px] md:blur-[130px] rounded-full mix-blend-screen" />
          <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-amber-500/5 blur-[80px] rounded-full" />
        </div>

        {/* Elegant Floating Celebration Elements */}
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden select-none">
          {/* Animated Floating Luxury Moon */}
          <motion.div 
            animate={{ 
              y: [0, -10, 0],
              rotate: [-5, 5, -5],
              filter: ["drop-shadow(0 0 10px rgba(245,158,11,0.2))", "drop-shadow(0 0 20px rgba(245,158,11,0.4))", "drop-shadow(0 0 10px rgba(245,158,11,0.2))"]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[8%] right-[8%] md:top-[12%] md:right-[10%] text-amber-300 text-4xl md:text-5xl"
          >
            🌙
          </motion.div>

          {/* Golden Sparkle Left */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[12%] left-[8%] text-amber-400"
          >
            <Sparkles className="w-7 h-7 md:w-10 md:h-10 text-amber-300" />
          </motion.div>

          {/* Exquisite Hanging Lantern Visual (CSS Minimal Vector) */}
          <div className="absolute top-0 left-[15%] hidden md:flex flex-col items-center opacity-40">
            <div className="w-[1px] h-20 bg-gradient-to-b from-amber-500 to-amber-500/20" />
            <div className="w-6 h-6 rounded-full border border-amber-500/40 bg-amber-500/10 flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse">
              <span className="text-[10px] text-amber-400">✨</span>
            </div>
          </div>

          <div className="absolute top-0 right-[22%] hidden md:flex flex-col items-center opacity-30">
            <div className="w-[1px] h-12 bg-gradient-to-b from-amber-500 to-amber-500/20" />
            <div className="w-5 h-5 rounded-full border border-amber-500/40 bg-amber-500/10 flex items-center justify-center animate-pulse">
              <span className="text-[8px] text-amber-400">✨</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="relative z-20 w-full px-4 sm:px-8 md:px-14 py-10 sm:py-14 md:py-16 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-[34rem] sm:max-w-xl md:max-w-2xl mx-auto flex flex-col items-center"
          >
            {/* Elegant Top Badge */}
            <div className="inline-flex items-center gap-2 py-1 px-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-5 shadow-sm">
              <Sparkles className="h-3 w-3 text-amber-400 animate-pulse" />
              <span className="text-[10px] sm:text-[11px] font-black tracking-widest text-[#10b981] font-mono leading-none">
                MUBARAK 🌙 عروض العيد الكبير
              </span>
            </div>

            {/* Display Headings with custom premium sizing */}
            <h1 className="font-brand text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight mb-4 text-white">
              كل المنتجات <span className="text-amber-400 italic font-medium">Pre-Order</span><br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-amber-200 to-emerald-400 font-extrabold">
                واحصل على بوستر هدية مجاناً! 🎁
              </span>
            </h1>

            {/* Clean Arabic prose with optimized reading metrics */}
            <p className="text-gray-200 text-xs sm:text-sm md:text-[15px] mb-8 max-w-[28rem] sm:max-w-md md:max-w-xl leading-relaxed font-semibold px-2 text-center select-text" style={{ direction: "rtl" }}>
              بمناسبة العيد السعيد، المتجر متاح بالكامل كـ 
              <span className="text-amber-400"> حجز مسبق (Pre-Order)</span> لضمان دقة التصنيع وعناية التفاصيل، ومع أي طلب ستحصل على <span className="text-emerald-400">بوستر هدية مجانية بالكامل</span> تختاره بنفسك من السلة!
            </p>

            {/* Premium Countdown integrated cleanly with spacious container */}
            <div className="w-full max-w-[22rem] mb-8 bg-black/40 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/5 shadow-xl transition-all hover:bg-black/50">
              <EidCountdown size="md" />
            </div>

            {/* Luxury Action Button */}
            <button 
              onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="group relative px-8 py-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-neutral-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl hover:scale-[1.04] active:scale-[0.98] transition-all duration-300 shadow-[0_4px_25px_rgba(245,158,11,0.25)] hover:shadow-[0_4px_35px_rgba(245,158,11,0.4)] flex items-center gap-2 overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              <span className="relative z-10 flex items-center gap-1.5 font-bold">
                احجز هديتك وتصفح المعروض الآن 🌙
              </span>
            </button>
          </motion.div>
        </div>
      </section>
    );
  }

  if (isPosterOffer) {
    return (
      <section className="relative overflow-hidden rounded-3xl md:rounded-[2.5rem] bg-gradient-to-r from-brand-dark via-black to-[#1a1a2e] text-white shadow-2xl mt-4 md:mt-0 min-h-[400px] md:min-h-[550px] flex items-center border border-white/5 mx-2 md:mx-0">
        <div className="absolute inset-0 z-0">
          {/* Subtle starfield or particles */}
          <div className="absolute inset-0 opacity-20" 
            style={{ 
              backgroundImage: `radial-gradient(circle at center, #ffffff 1px, transparent 1px)`,
              backgroundSize: '30px 30px'
            }} 
          />
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#ff006e]/20 blur-[100px] md:blur-[120px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-brand-primary/20 blur-[100px] md:blur-[120px] rounded-full mix-blend-screen" />
        </div>

        {/* Floating Elements for Poster Offer */}
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
          <motion.div 
            animate={{ y: [0, -10, 0], rotate: [-5, 5, -5] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[10%] right-[10%] md:top-[15%] md:right-[15%] opacity-30 md:opacity-40 text-[#ff006e]"
          >
            <Gift className="w-16 h-16 md:w-24 md:h-24" />
          </motion.div>
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute bottom-[15%] left-[5%] md:bottom-[20%] md:left-[10%] text-brand-primary"
          >
            <Sparkles className="w-12 h-12 md:w-16 md:h-16" />
          </motion.div>
        </div>

        {/* Content */}
        <div className="relative z-20 container mx-auto px-4 md:px-12 py-10 md:py-0 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 py-1.5 px-4 md:px-6 rounded-full bg-gradient-to-r from-[#ff006e] to-[#ffbe0b] shadow-[0_0_20px_rgba(255,0,110,0.4)] mb-6 md:mb-8">
              <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-white" />
              <span className="text-[10px] md:text-sm font-black uppercase tracking-widest text-white">
                عرض لفترة محدودة 🎁
              </span>
            </div>

            <h1 className="font-brand text-3xl sm:text-4xl md:text-7xl font-black italic tracking-tighter leading-[1.1] mb-6 md:mb-8 text-white drop-shadow-2xl px-2">
              اشتري أي أوردر..<br className="block md:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffbe0b] via-[#ff006e] to-[#ffbe0b] animate-gradient bg-[length:200%_auto]">
                واختار بوسترك هدية! 🖼️
              </span>
            </h1>

            <p className="text-white/90 text-base md:text-xl mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed font-medium drop-shadow-md px-4">
              جمع كل المنتجات اللي بتتمناها في الكارت، وقبل ما تأكد الطلب.. 
              <br className="hidden md:block"/>
              <strong className="text-[#ffbe0b]"> هنخليك تختار بوستر ديكور هدية مجاناً</strong> من تشكيلتنا التحفة!
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <button 
                onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="group relative px-8 md:px-10 py-4 md:py-5 bg-gradient-to-r from-[#ff006e] to-[#8338ec] rounded-2xl md:rounded-full text-white font-black text-base md:text-lg transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,0,110,0.4)] hover:shadow-[0_0_50px_rgba(255,0,110,0.7)] overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <span className="relative z-10 flex items-center gap-2">
                  تصفح المنتجات واكسب هديتك 🎉
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[2.5rem] bg-[#0a0a0a] text-white shadow-2xl mt-4 md:mt-0 min-h-[450px] md:min-h-[550px] flex items-center">
      {/* Cyberpunk Background Elements */}
      <div className="absolute inset-0 z-0">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-20" 
          style={{ 
            backgroundImage: `linear-gradient(to right, #3a86ff 1px, transparent 1px), linear-gradient(to bottom, #3a86ff 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} 
        />
        
        {/* Neon Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ff006e]/20 blur-[120px] rounded-full" />
        
        {/* Scanlines Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
          style={{ 
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 3px, #fff 3px)` 
          }} 
        />
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {/* VHS Tape 1 */}
        <motion.div 
          animate={{ 
            y: [0, -20, 0],
            rotate: [5, 15, 5],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] right-[10%] opacity-40 hidden md:block"
        >
          <CassetteTape className="w-24 h-24 text-brand-primary/60" />
        </motion.div>

        {/* VHS Tape 2 */}
        <motion.div 
          animate={{ 
            y: [0, 20, 0],
            rotate: [-10, -20, -10],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[20%] left-[5%] opacity-30 hidden md:block"
        >
          <CassetteTape className="w-20 h-20 text-[#ff006e]/50" />
        </motion.div>

        {/* Game Icons */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-[40%] right-[25%] text-brand-light/40"
        >
          <Gamepad2 className="w-12 h-12" />
        </motion.div>

        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[10%] right-[15%] text-brand-primary/30"
        >
          <Zap className="w-16 h-16" />
        </motion.div>

        <motion.div 
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-[10%] left-[20%] text-brand-primary/40"
        >
          <Sparkles className="w-8 h-8" />
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-6 md:px-12 flex flex-col items-center text-center md:items-start md:text-left">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl"
        >
          {/* Glitch Badge */}
          <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
            </span>
            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-brand-light">
              VCR Gaming Experience
            </span>
          </div>

          {/* Headline with Glitch Animation */}
          <h1 className="font-brand text-4xl md:text-6xl font-black italic tracking-tighter leading-[0.95] mb-6 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            العب.. جاوب..<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-brand-light to-brand-primary animate-pulse drop-shadow-[0_0_15px_rgba(58,134,255,0.4)]">
              واكسب خصومات حقيقية! 📼
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="text-white/90 text-sm md:text-base mb-10 max-w-lg leading-relaxed font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
            جرب حظك مع لعبة <span className="text-brand-primary font-black drop-shadow-[0_0_8px_rgba(58,134,255,0.5)]">CUTSCENE</span> واكسب أكواد خصم فورية توصل لـ <span className="text-brand-light font-black underline decoration-brand-primary/40 underline-offset-4">20%</span> وشحن مجاني.
          </p>

          {/* CTA Button with Neon Glow */}
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <a 
              href="https://yossamr.github.io/cutscene/" 
              target="_blank"
              rel="noopener noreferrer"
              className="group relative px-8 py-4 bg-brand-primary rounded-2xl text-white font-black uppercase tracking-widest text-sm transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(58,134,255,0.4)] hover:shadow-[0_0_35px_rgba(58,134,255,0.6)]"
            >
              <span className="relative z-10 flex items-center gap-2">
                جرب حظك دلوقتي 🕹️
              </span>
              <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
            </a>
            
            <button 
              onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl text-white font-bold text-sm hover:bg-white/10 transition-all"
            >
              تصفح المنتجات
            </button>
          </div>
        </motion.div>
      </div>

      {/* VHS Glitch Overlay (Bottom) */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary to-transparent opacity-50 animate-pulse" />
    </section>
  );
}
