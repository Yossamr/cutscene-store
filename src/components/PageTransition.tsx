import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';

export const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
        transition={{ 
          duration: 0.5, 
          ease: [0.22, 1, 0.36, 1] // Cinematic easing
        }}
        className="w-full h-full relative"
      >
        {/* Fade to black overlay */}
        <motion.div 
          className="fixed inset-0 bg-black z-[9999] pointer-events-none"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
