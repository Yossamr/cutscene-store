import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";

interface CartAnimationEvent {
  id: number;
  startRect: DOMRect;
  imageUrl: string;
}

export function CartAnimation() {
  const [animations, setAnimations] = useState<CartAnimationEvent[]>([]);
  const idCounter = useRef(0);

  useEffect(() => {
    const handleAnimation = (event: CustomEvent<Omit<CartAnimationEvent, 'id'>>) => {
      const newAnim = {
        id: idCounter.current++,
        ...event.detail
      };
      setAnimations(prev => [...prev, newAnim]);

      // Trigger pop animation on cart icon
      setTimeout(() => {
        window.dispatchEvent(new Event('cart-bump'));
      }, 700);

      // Remove animation after it completes
      setTimeout(() => {
        setAnimations(prev => prev.filter(anim => anim.id !== newAnim.id));
      }, 800);
    };

    window.addEventListener('animate-add-to-cart', handleAnimation as EventListener);
    return () => window.removeEventListener('animate-add-to-cart', handleAnimation as EventListener);
  }, []);

  if (animations.length === 0) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      <AnimatePresence>
        {animations.map(anim => {
          // Find the visible cart icon (either top nav or bottom nav)
          const cartIcons = document.querySelectorAll('.global-cart-icon');
          let targetRect = { top: 20, left: window.innerWidth - 60, width: 40, height: 40 }; // Default fallback
          
          cartIcons.forEach(icon => {
            const rect = icon.getBoundingClientRect();
            // Check if icon is visible (width > 0, height > 0, opacity != 0)
            if (rect.width > 0 && rect.height > 0 && window.getComputedStyle(icon).display !== 'none') {
              targetRect = rect;
            }
          });

          return (
            <motion.div
              key={anim.id}
              initial={{ 
                x: anim.startRect.left, 
                y: anim.startRect.top,
                width: anim.startRect.width,
                height: anim.startRect.height,
                opacity: 0.8,
                borderRadius: '1rem'
              }}
              animate={{
                x: targetRect.left + targetRect.width / 2 - 25,
                y: targetRect.top + targetRect.height / 2 - 25,
                width: 50,
                height: 50,
                opacity: 0.5,
                borderRadius: '50%'
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{
                duration: 0.7,
                ease: [0.32, 0.72, 0, 1] // Custom bezier for natural arc flying
              }}
              className="absolute shadow-2xl overflow-hidden border-2 border-brand-primary z-[9999] bg-brand-dark/50"
            >
              <img src={anim.imageUrl} className="w-full h-full object-cover" alt="" />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body
  );
}
