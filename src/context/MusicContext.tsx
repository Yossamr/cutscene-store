import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MusicContextType {
  currentTrackUrl: string | null;
  setTrack: (url: string | null) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: ReactNode }) {
  const [currentTrackUrl, setCurrentTrackUrl] = useState<string | null>(null);

  const setTrack = (url: string | null) => {
    // Only update if it's a different track to avoid reloading the iframe
    if (url !== currentTrackUrl) {
      setCurrentTrackUrl(url);
    }
  };

  return (
    <MusicContext.Provider value={{ currentTrackUrl, setTrack }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}
