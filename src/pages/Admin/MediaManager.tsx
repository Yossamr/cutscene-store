
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../lib/api";
import { getDirectDriveLink } from "../../lib/utils";
import { Loader2, Image as ImageIcon, Copy, CheckCircle2, Search, Filter } from "lucide-react";
import toast from "react-hot-toast";

interface MediaItem {
  url: string;
  source: string; // e.g., "Product: The Matrix"
  type: string; // "Main" or "Trailer"
}

export function MediaManager() {
  const { token } = useAuth();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const products = await apiFetch("/api/admin/products");
      
      const extractedMedia: MediaItem[] = [];
      products.forEach((p: any) => {
        if (p.images?.main) {
          extractedMedia.push({ url: p.images.main, source: p.title, type: "Main" });
        }
        if (p.images?.trailer) {
          extractedMedia.push({ url: p.images.trailer, source: p.title, type: "Trailer" });
        }
      });
      
      // Remove duplicates based on URL
      const uniqueMedia = Array.from(new Map(extractedMedia.map(item => [item.url, item])).values());
      setMedia(uniqueMedia);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success("URL copied to clipboard!");
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const filteredMedia = media.filter(item => 
    item.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-brand-dark flex items-center gap-3">
            <ImageIcon className="h-8 w-8 text-brand-primary" />
            Media Vault
          </h1>
          <p className="text-brand-dark/60 mt-2">Manage all cinematic assets used across your sets.</p>
        </div>
        
        <div className="w-full md:w-auto flex items-center gap-4">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-dark/60" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm text-brand-dark focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredMedia.map((item, index) => (
          <div key={index} className="group relative rounded-2xl overflow-hidden bg-white border border-gray-200 hover:border-brand-primary/50 transition-all duration-300">
            <div className="aspect-square overflow-hidden bg-gray-100">
              <img 
                src={getDirectDriveLink(item.url)} 
                alt={`Asset from ${item.source}`} 
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              <span className="text-xs font-black uppercase tracking-widest text-brand-primary mb-1">{item.type}</span>
              <span className="text-sm font-bold text-white truncate mb-4">{item.source}</span>
              
              <button
                onClick={() => copyToClipboard(item.url)}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-white/10 hover:bg-brand-primary py-2 text-xs font-bold text-white backdrop-blur-sm transition-all"
              >
                {copiedUrl === item.url ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedUrl === item.url ? "Copied!" : "Copy URL"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredMedia.length === 0 && (
        <div className="text-center py-20 border border-dashed border-gray-200 rounded-3xl bg-gray-50">
          <ImageIcon className="h-12 w-12 text-brand-dark/50 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-brand-dark/60">No assets found</h3>
          <p className="text-brand-dark/60 mt-2">Try adjusting your search terms.</p>
        </div>
      )}
    </div>
  );
}
