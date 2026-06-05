import { Popcorn } from "lucide-react";
import { cn } from "../lib/utils";

interface PopcornRatingProps {
  rating: number; // 1 to 5
  maxRating?: number;
  className?: string;
}

export function PopcornRating({ rating, maxRating = 5, className }: PopcornRatingProps) {
  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {Array.from({ length: maxRating }).map((_, i) => (
        <Popcorn
          key={i}
          className={cn(
            "w-4 h-4 transition-colors",
            i < Math.floor(rating)
              ? "text-yellow-400 fill-yellow-400"
              : i < rating
              ? "text-yellow-400 fill-yellow-400 opacity-50" // Half popcorn
              : "text-brand-dark/70"
          )}
        />
      ))}
      <span className="text-[10px] font-black uppercase tracking-widest text-brand-dark/60 ml-2">{rating.toFixed(1)} Popcorns</span>
    </div>
  );
}
