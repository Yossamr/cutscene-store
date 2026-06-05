import { useState, useEffect, useCallback } from 'react';

interface BehaviorState {
  genres: Record<string, number>;
  searches: string[];
  viewedIds: string[];
}

const STORAGE_KEY = 'cutscene_user_behavior';

export function useUserBehavior() {
  const [behavior, setBehavior] = useState<BehaviorState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : { genres: {}, searches: [], viewedIds: [] };
    } catch (e) {
      return { genres: {}, searches: [], viewedIds: [] };
    }
  });

  const trackProductView = useCallback((product: any) => {
    if (!product) return;
    
    setBehavior(prev => {
      const newState = { ...prev };
      
      // Track ID
      if (!newState.viewedIds.includes(product.id)) {
        newState.viewedIds = [product.id, ...newState.viewedIds].slice(0, 20);
      }

      // Track Genres
      if (Array.isArray(product.genres)) {
        product.genres.forEach((g: string) => {
          newState.genres[g] = (newState.genres[g] || 0) + 1;
        });
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  const trackSearch = useCallback((term: string) => {
    if (!term || !term.trim()) return;
    setBehavior(prev => {
      const newState = { ...prev };
      const cleanTerm = term.trim().toLowerCase();
      newState.searches = [cleanTerm, ...newState.searches.filter(t => t !== cleanTerm)].slice(0, 10);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  return { behavior, trackProductView, trackSearch };
}
