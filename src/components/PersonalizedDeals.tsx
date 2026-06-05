import { useState, useEffect, useMemo, useRef } from 'react';
import { ProductCard, type Product } from './ProductCard';
import { apiFetch } from '../lib/api';
import { useUserBehavior } from '../hooks/useUserBehavior';
import { Flame, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export function PersonalizedDeals() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const { behavior } = useUserBehavior();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch('/api/products')
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [products]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300; // approximate width of a card + gap
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const hasBehavior = Object.keys(behavior.genres).length > 0 || behavior.searches.length > 0;
  
  const [activeTab, setActiveTab] = useState<'for_you' | 'trending'>(hasBehavior ? 'for_you' : 'trending');

  // Switch to for_you automatically once behavior is established
  useEffect(() => {
    if (hasBehavior && activeTab === 'trending') {
      setActiveTab('for_you');
    }
  }, [hasBehavior]);

  const forYouProducts = useMemo(() => {
    if (!products.length) return [];

    const availableProducts = products.filter(p => !p.isComingSoon);

    const scored = availableProducts.map(p => {
      let score = 0;
      
      if (Array.isArray(p.genres)) {
        p.genres.forEach(g => {
          if (behavior.genres[g]) score += behavior.genres[g] * 2;
        });
      }

      behavior.searches.forEach(term => {
        const lowerTitle = p.title.toLowerCase();
        if (lowerTitle.includes(term)) {
          score += 5;
        }
      });

      if (p.isBoxOfficeHit) score += 2;
      
      // 5. Discovery & Retargeting boost
      if (!behavior.viewedIds.includes(p.id)) {
        score += 1; // Show new things
      } else {
        score += 3; // They viewed it, strong intent (retargeting)
      }

      // 6. Freshness (Small random jitter to break ties dynamically so the list doesn't get sterile/stale)
      score += Math.random() * 0.5;

      return { ...p, score };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 10);
  }, [products, behavior]);

  const trendingProducts = useMemo(() => {
    if (!products.length) return [];
    
    // Bestsellers / Trending logic: prioritize Box Office Hits and high ratings
    const available = products.filter(p => !p.isComingSoon);
    return available.sort((a, b) => {
      // Primary: Box Office Hit
      if (a.isBoxOfficeHit && !b.isBoxOfficeHit) return -1;
      if (!a.isBoxOfficeHit && b.isBoxOfficeHit) return 1;
      // Secondary: Rating
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      // Tertiary: Dynamic freshness (so items with identical ratings shuffle slightly on refresh)
      return Math.random() - 0.5;
    }).slice(0, 10);
  }, [products]);

  const displayedProducts = activeTab === 'for_you' ? forYouProducts : trendingProducts;

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-brand text-3xl font-black tracking-tight text-brand-dark">Good deals</h2>
        </div>
        <div className="flex overflow-x-auto gap-4 pb-8 snap-x no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="snap-start w-[280px] shrink-0">
              <div className="animate-pulse bg-white/10 h-[380px] rounded-2xl"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (displayedProducts.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-brand text-3xl font-black tracking-tight text-brand-dark">Good deals</h2>
          <button className="text-sm font-bold text-brand-dark/50 hover:text-brand-primary transition-colors">See all</button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('trending')}
            className={cn(
              "pb-3 text-sm font-black uppercase tracking-widest transition-colors relative",
              activeTab === 'trending' ? "text-brand-primary" : "text-brand-dark/40 hover:text-brand-dark/60"
            )}
          >
            Trending
            {activeTab === 'trending' && (
              <motion.div layoutId="goodDealsTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
            )}
          </button>
          
          {hasBehavior && (
            <button 
              onClick={() => setActiveTab('for_you')}
              className={cn(
                "pb-3 text-sm font-black uppercase tracking-widest transition-colors relative flex items-center gap-1.5",
                activeTab === 'for_you' ? "text-orange-500" : "text-brand-dark/40 hover:text-brand-dark/60"
              )}
            >
              <Flame className={cn("h-4 w-4", activeTab === 'for_you' ? "text-orange-500" : "text-brand-dark/40")} />
              Picked For You
              {activeTab === 'for_you' && (
                <motion.div layoutId="goodDealsTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
              )}
            </button>
          )}
        </div>
      </div>
      
      <div className="relative group">
        {canScrollLeft && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 hidden md:flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 text-brand-dark/70 hover:text-brand-primary hover:scale-110 transition-all"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto gap-4 pb-8 snap-x no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth"
        >
          {displayedProducts.map((product) => (
            <div key={product.id} className="snap-start w-[280px] shrink-0">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {canScrollRight && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 hidden md:flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 text-brand-dark/70 hover:text-brand-primary hover:scale-110 transition-all"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </section>
  );
}
