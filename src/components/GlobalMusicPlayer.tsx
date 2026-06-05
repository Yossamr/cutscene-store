import React from 'react';
import { useMusic } from '../context/MusicContext';
import { X } from 'lucide-react';

export function GlobalMusicPlayer() {
  const { currentTrackUrl, setTrack } = useMusic();

  if (!currentTrackUrl) return null;

  // Ensure it's an embed URL
  let embedUrl = currentTrackUrl;
  if (!currentTrackUrl.includes('spotify.com')) {
    // Assume it's a track ID
    embedUrl = `https://open.spotify.com/embed/track/${currentTrackUrl}`;
  } else if (!currentTrackUrl.includes('/embed/')) {
    embedUrl = currentTrackUrl.replace('open.spotify.com', 'open.spotify.com/embed');
  }

  // Add autoplay parameter if not present and ensure it's a valid URL
  let finalUrl = embedUrl;
  try {
    const url = new URL(embedUrl);
    url.searchParams.set('autoplay', '1');
    finalUrl = url.toString();
  } catch (e) {
    // Fallback for malformed URLs
    finalUrl = embedUrl.includes('?') 
      ? `${embedUrl}&autoplay=1` 
      : `${embedUrl}?autoplay=1`;
  }

  return (
    <div className="fixed bottom-24 md:bottom-4 left-4 right-4 md:left-auto md:right-4 z-[9999] md:w-96 shadow-2xl rounded-xl overflow-hidden bg-black/80 backdrop-blur-md border border-white/10 transition-all duration-500 animate-in slide-in-from-bottom-10">
      <div className="relative">
        <button 
          onClick={() => setTrack(null)}
          className="absolute -top-2 -right-2 z-10 bg-black/50 hover:bg-red-500 text-white rounded-full p-1 backdrop-blur-md transition-colors"
          title="Close Player"
        >
          <X className="w-4 h-4" />
        </button>
        <iframe 
          src={finalUrl} 
          width="100%" 
          height="80" 
          frameBorder="0" 
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
          loading="lazy"
          className="block"
        ></iframe>
      </div>
    </div>
  );
}
