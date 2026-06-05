
import React, { useState, useEffect, useRef } from "react";
import { Search, Film } from "lucide-react";
import { CinematicLoader } from "../CinematicLoader";
import { useNavigate } from "react-router-dom";
import { type Product } from "../ProductCard";
import { apiFetch } from "../../lib/api";

export function VibeSearch() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<{ products: Product[], genres: string[] } | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSelectedGenre(null);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (query.trim().length > 2) {
      setIsSearching(true);
      timeoutRef.current = setTimeout(async () => {
        try {
          const data = await apiFetch("/api/ai/vibe-search", {
            method: "POST",
            body: { query: query.trim() },
          });
          setResults(data);
        } catch (error) {
          console.error("Vibe search error:", error);
        } finally {
          setIsSearching(false);
        }
      }, 500); // 500ms debounce
    } else {
      setResults(null);
      setIsSearching(false);
    }
  }, [query]);

  const filteredProducts = selectedGenre && results
    ? results.products.filter(p => p.genres?.includes(selectedGenre))
    : results?.products || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}${selectedGenre ? `&genre=${encodeURIComponent(selectedGenre)}` : ''}`);
      setQuery("");
      setIsFocused(false);
      setResults(null);
      setSelectedGenre(null);
    }
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
    setQuery("");
    setIsFocused(false);
    setResults(null);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <form 
        onSubmit={handleSubmit}
        className={`relative flex items-center transition-all duration-300 ${
          isFocused ? "w-64 md:w-96 shadow-[0_0_15px_rgba(58,134,255,0.3)]" : "w-48 md:w-64"
        }`}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className={`h-4 w-4 transition-colors ${isFocused ? "text-brand-primary" : "text-brand-dark/60"}`} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search by movie, franchise, or collection..."
          className={`w-full bg-black/50 border ${
            isFocused ? "border-brand-primary" : "border-white/10"
          } rounded-full py-3 pl-12 pr-12 text-sm text-white placeholder-white/40 focus:outline-none transition-all duration-300 focus:shadow-[0_0_20px_rgba(58,134,255,0.2)]`}
        />
        {isSearching ? (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <CinematicLoader size="sm" />
          </div>
        ) : isFocused && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Film className="h-4 w-4 text-brand-primary/50 animate-pulse" />
          </div>
        )}
      </form>

      {/* Dropdown Results */}
      {isFocused && query.trim().length > 2 && (
        <div className="absolute top-full mt-4 w-full md:w-[400px] rounded-3xl border border-white/10 bg-black/90 p-6 shadow-2xl backdrop-blur-2xl z-50">
          <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 italic">Director's Cut</h3>
            <Film className="h-4 w-4 text-brand-primary animate-pulse" />
          </div>

          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-10 text-white/50">
              <CinematicLoader size="md" label="Searching the Archives" />
            </div>
          ) : results ? (
            <div className="space-y-6">
              {/* Mood/Vibe Section */}
              {results.genres && results.genres.length > 0 && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary mb-3 italic">Mood & Vibe</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedGenre(null)}
                      className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all ${
                        selectedGenre === null
                          ? "border-brand-primary bg-brand-primary text-white shadow-[0_0_10px_rgba(58,134,255,0.5)]"
                          : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                      }`}
                    >
                      All
                    </button>
                    {results.genres.map((genre) => (
                      <button
                        key={genre}
                        onClick={() => setSelectedGenre(genre)}
                        className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all ${
                          selectedGenre === genre
                            ? "border-brand-primary bg-brand-primary text-white shadow-[0_0_10px_rgba(58,134,255,0.5)]"
                            : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Cinematic Matches Section */}
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary mb-3 italic">Cinematic Matches</p>
                {filteredProducts.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {filteredProducts.slice(0, 4).map((product: any) => (
                      <button
                        key={product.id}
                        onClick={() => handleProductClick(product.id)}
                        className="flex w-full items-center gap-4 rounded-2xl p-3 text-left transition-all hover:bg-white/5 group"
                      >
                        <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-black border border-white/10">
                          <img 
                            src={(product.images?.main || product.image)?.startsWith('http') || (product.images?.main || product.image)?.startsWith('/') ? (product.images?.main || product.image) : `/${product.images?.main || product.image}`} 
                            alt={product.title} 
                            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" 
                            onError={(e) => {
                              e.currentTarget.src = 'https://picsum.photos/seed/placeholder/400/500';
                            }}
                          />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <h4 className="truncate text-sm font-black uppercase tracking-tight text-white italic group-hover:text-brand-primary transition-colors">{product.title}</h4>
                          <p className="text-[10px] font-black text-brand-primary/70">${product.price.toFixed(2)}</p>
                        </div>
                      </button>
                    ))}
                    {filteredProducts.length > 4 && (
                      <button 
                        onClick={handleSubmit}
                        className="w-full pt-2 text-center text-[10px] font-black uppercase tracking-wider text-brand-primary hover:text-white transition-colors"
                      >
                        View all {filteredProducts.length} results
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center text-[10px] font-black uppercase tracking-widest text-white/40 italic">
                    No cinematic matches found for this vibe.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
