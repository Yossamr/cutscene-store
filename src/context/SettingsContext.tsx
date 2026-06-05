import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

interface Settings {
  free_poster_offer_enabled?: boolean;
  eid_offer_enabled?: boolean;
  announcement: {
    isVisible: boolean;
    text: string;
    highlightText: string;
    code: string;
  };
  hero: {
    title: string;
    highlightTitle: string;
    subtitle: string;
    description: string;
    imageUrl: string;
    buttonText: string;
    buttonLink: string;
  };
  telegram_config?: {
    token: string;
    chatId: string;
  };
  categoryImages: {
    movies: string;
    tvShows: string;
    anime: string;
  };
}

const defaultSettings: Settings = {
  free_poster_offer_enabled: false,
  eid_offer_enabled: false,
  announcement: {
    isVisible: true,
    text: "Free shipping on all orders over",
    highlightText: "$50",
    code: "GAMER20"
  },
  hero: {
    title: "Wear Your",
    highlightTitle: "Favorite",
    subtitle: "Movies",
    description: "Premium apparel and collectibles inspired by the greatest stories ever told on screen.",
    imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop",
    buttonText: "Shop Now",
    buttonLink: "#products-section"
  },
  telegram_config: {
    token: "7719448492:AAGqzuFAFrGJHcqYA7BVYTALgU6le4ua_YQ",
    chatId: ""
  },
  categoryImages: {
    movies: "https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=1000&auto=format&fit=crop", // Camera/film
    tvShows: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?q=80&w=1000&auto=format&fit=crop", // Home theater/TV
    anime: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1000&auto=format&fit=crop" // Anime figures
  }
};

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await apiFetch('/api/settings');
      setSettings({
        free_poster_offer_enabled: data.free_poster_offer_enabled ?? defaultSettings.free_poster_offer_enabled,
        eid_offer_enabled: data.eid_offer_enabled ?? defaultSettings.eid_offer_enabled,
        announcement: { ...defaultSettings.announcement, ...data.announcement },
        hero: { ...defaultSettings.hero, ...data.hero },
        telegram_config: { ...defaultSettings.telegram_config, ...data.telegram_config },
        categoryImages: { ...defaultSettings.categoryImages, ...data.categoryImages }
      });
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      const data = await apiFetch('/api/settings', {
        method: 'PUT',
        body: newSettings
      });
      setSettings(prev => {
        const updated = { ...prev };
        if (newSettings.free_poster_offer_enabled !== undefined) {
          updated.free_poster_offer_enabled = newSettings.free_poster_offer_enabled;
        }
        if (newSettings.eid_offer_enabled !== undefined) {
          updated.eid_offer_enabled = newSettings.eid_offer_enabled;
        }
        if (newSettings.announcement) {
          updated.announcement = { ...prev.announcement, ...newSettings.announcement };
        }
        if (newSettings.hero) {
          updated.hero = { ...prev.hero, ...newSettings.hero };
        }
        if (newSettings.telegram_config) {
          updated.telegram_config = { ...prev.telegram_config, ...newSettings.telegram_config };
        }
        if (newSettings.categoryImages) {
          updated.categoryImages = { ...prev.categoryImages, ...newSettings.categoryImages };
        }
        return updated;
      });
    } catch (error) {
      console.error("Failed to update settings:", error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
