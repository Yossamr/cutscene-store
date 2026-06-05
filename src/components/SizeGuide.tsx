import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ruler, X, Calculator } from 'lucide-react';
import { cn } from '../lib/utils';

const SIZES = [
  { size: 'M', dimensions: '50x70', targetWeight: 65, minWeight: 0, maxWeight: 70 },
  { size: 'L', dimensions: '52.5x72', targetWeight: 75, minWeight: 71, maxWeight: 80 },
  { size: 'XL', dimensions: '55x74', targetWeight: 85, minWeight: 81, maxWeight: 90 },
  { size: 'XXL', dimensions: '57.5x76', targetWeight: 95, minWeight: 91, maxWeight: 100 },
  { size: 'XXXL', dimensions: '60x78', targetWeight: 105, minWeight: 101, maxWeight: 200 },
];

export const SizeGuide = React.forwardRef<
  { open: () => void },
  {}
>((_, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [recommendedSize, setRecommendedSize] = useState<string | null>(null);

  React.useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true),
  }));

  const calculateSize = () => {
    const w = parseFloat(weight);
    if (isNaN(w)) return;
    
    const size = SIZES.find(s => w >= s.minWeight && w <= s.maxWeight);
    setRecommendedSize(size ? size.size : 'XXXL');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40, rotateX: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40, rotateX: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg max-h-[90vh] rounded-[2rem] md:rounded-[3rem] bg-white p-6 md:p-12 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-y-auto border border-white/20 custom-scrollbar"
            onClick={e => e.stopPropagation()}
          >
            {/* Cinematic Background Elements */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />
            
            <div className="relative flex items-center justify-between mb-8 md:mb-12">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-[1.2rem] md:rounded-[1.5rem] bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                  <Ruler className="h-6 w-6 md:h-7 md:w-7" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-brand-dark italic leading-none mb-1">Size Guide</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">The Premiere Fit</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="group p-3 md:p-4 rounded-2xl bg-gray-100 hover:bg-brand-dark hover:text-white transition-all duration-500"
              >
                <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />
              </button>
            </div>

            <div className="relative mb-8 md:mb-12 p-6 md:p-8 bg-gray-50 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-inner">
              <div className="flex items-center gap-2 mb-6 md:mb-8">
                <div className="h-1 w-8 bg-blue-600 rounded-full" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-dark/40 italic">Smart AI Assistant</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                <div className="space-y-2 md:space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/60 ml-4">Height (cm)</label>
                  <input
                    type="number"
                    placeholder="175"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full p-4 md:p-5 rounded-2xl bg-white border-none text-base font-bold shadow-sm focus:ring-4 focus:ring-blue-600/20 transition-all placeholder:text-gray-300"
                  />
                </div>
                <div className="space-y-2 md:space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/60 ml-4">Weight (kg)</label>
                  <input
                    type="number"
                    placeholder="75"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full p-4 md:p-5 rounded-2xl bg-white border-none text-base font-bold shadow-sm focus:ring-4 focus:ring-blue-600/20 transition-all placeholder:text-gray-300"
                  />
                </div>
              </div>
              
              <button
                onClick={calculateSize}
                className="w-full py-4 md:py-5 rounded-2xl bg-brand-dark text-white text-[11px] font-black uppercase tracking-[0.3em] hover:bg-blue-600 hover:text-white transition-all duration-500 flex items-center justify-center gap-3 shadow-xl shadow-brand-dark/20 active:scale-95 group"
              >
                <Calculator className="h-4 w-4 group-hover:scale-110 transition-transform" />
                Analyze My Fit
              </button>
              
              <AnimatePresence>
                {recommendedSize && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="mt-6 md:mt-8 text-center p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-blue-600 text-white font-black text-3xl md:text-4xl italic shadow-2xl shadow-blue-600/30 relative overflow-hidden group"
                  >
                    <motion.div 
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                    />
                    <span className="text-[10px] uppercase tracking-[0.5em] text-white/60 block mb-2 not-italic font-black">Your Perfect Match</span>
                    {recommendedSize}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-6 mb-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-dark/30 italic">Size Matrix</h4>
                <div className="h-px flex-1 bg-gray-100 mx-4" />
              </div>
              
              <div className="space-y-3 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                {SIZES.map((s) => (
                  <motion.div 
                    key={s.size} 
                    whileHover={{ x: 10 }}
                    className={cn(
                      "group grid grid-cols-3 gap-4 px-6 md:px-8 py-4 md:py-5 rounded-2xl text-xs font-bold transition-all duration-500 cursor-default border",
                      recommendedSize === s.size 
                        ? "bg-blue-600/10 border-blue-600/20 text-blue-600" 
                        : "bg-white border-gray-100 text-brand-dark hover:border-blue-600/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all duration-500",
                        recommendedSize === s.size ? "bg-blue-600 scale-150" : "bg-gray-200 group-hover:bg-blue-600/50"
                      )} />
                      <span className="font-black text-base md:text-lg italic">{s.size}</span>
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-[8px] uppercase tracking-widest opacity-40 mb-0.5">Dimensions</span>
                      <span className="font-black">{s.dimensions} cm</span>
                    </div>
                    <div className="flex flex-col justify-center items-end">
                      <span className="text-[8px] uppercase tracking-widest opacity-40 mb-0.5">Weight</span>
                      <span className="font-black">{s.targetWeight} kg</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});
