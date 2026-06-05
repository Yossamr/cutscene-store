import { motion } from "motion/react";
import { Film } from "lucide-react";

interface CinematicLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  className?: string;
}

export const CinematicLoader = ({ size = "md", label, className = "" }: CinematicLoaderProps) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-16 w-16",
    lg: "h-32 w-32",
    xl: "h-48 w-48"
  };

  const iconSizes = {
    sm: 16,
    md: 32,
    lg: 48,
    xl: 64
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-6 ${className}`}>
      <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
        {/* Outer Glow */}
        <motion.div
          className="absolute inset-0 bg-brand-primary/20 blur-xl rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Film Reel Frame */}
        <motion.div
          className="relative z-10 text-brand-primary"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <Film size={iconSizes[size]} strokeWidth={1.5} />
        </motion.div>

        {/* Spinning Outer Ring (Film Perforations Style) */}
        <motion.div
          className="absolute inset-x-[-15%] inset-y-[-15%] border-2 border-dashed border-brand-primary/30 rounded-full"
          animate={{ rotate: -360 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Technical sweep circles */}
        <motion.div
           className="absolute inset-[-30%] border border-brand-primary/10 rounded-full"
           animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.1, 0.3, 0.1] }}
           transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>

      {label && (
        <motion.p
          className="font-brand text-xs uppercase tracking-[0.3em] text-brand-primary/60"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          {label}
        </motion.p>
      )}
    </div>
  );
};
