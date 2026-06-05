import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { getDirectDriveLink } from "../lib/utils";
import { Loader2, Film, Search, Clapperboard, Sparkles } from "lucide-react";
import { apiFetch } from "../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useUserBehavior } from "../hooks/useUserBehavior";
import { CinematicLoader } from "../components/CinematicLoader";

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  images: { main: string; trailer: string; additional: string[] };
  genres: string[];
  franchise?: string;
  isComingSoon?: boolean;
  isBoxOfficeHit?: boolean;
}

interface Collection {
  id: string;
  name: string;
  poster_url: string;
  description: string;
}

export function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const [localQuery, setLocalQuery] = useState(query);
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { trackSearch } = useUserBehavior();

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setIsLoading(false);
        setProducts([]);
        setCollections([]);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const data = await apiFetch(
          `/api/products/search?q=${encodeURIComponent(query)}`,
        );
        setProducts(data.products || []);
        setCollections(data.collections || []);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      trackSearch(localQuery.trim());
      navigate(`/search?q=${encodeURIComponent(localQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Header Section */}
        <div className="mb-16 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-brand-primary/5 text-brand-primary mb-6 shadow-inner"
          >
            <Search className="h-10 w-10" />
          </motion.div>

          <h1 className="font-brand text-5xl md:text-7xl font-black uppercase tracking-tighter text-brand-dark italic mb-8">
            {query ? (
              <>
                Found in the <span className="text-brand-primary">Archive</span>
              </>
            ) : (
              <>
                Search the <span className="text-brand-primary">Archive</span>
              </>
            )}
          </h1>

          <form
            onSubmit={handleSearch}
            className="relative max-w-3xl mx-auto group"
          >
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Search for movies, vibes, or products..."
              className="w-full rounded-[2.5rem] border-2 border-brand-dark/5 bg-gray-50/50 py-6 pl-16 pr-24 text-base font-bold text-brand-dark placeholder-zinc-400 focus:outline-none focus:border-brand-primary focus:ring-8 focus:ring-brand-primary/5 transition-all shadow-2xl"
            />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-7 w-7 text-brand-dark/20 group-focus-within:text-brand-primary transition-colors" />
            <button
              type="submit"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-brand-dark text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-brand-primary transition-all shadow-lg hover:shadow-brand-primary/20"
            >
              Search
            </button>
          </form>

          {query && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 text-brand-dark/40 text-[10px] uppercase tracking-[0.3em] font-black"
            >
              Showing results for:{" "}
              <span className="text-brand-primary">"{query}"</span>
            </motion.p>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-8">
            <CinematicLoader size="xl" label="Scanning the Archives" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-dark/20">
              Retrieving cinematic assets
            </p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto bg-red-50 border border-red-100 p-8 rounded-[2.5rem] text-center shadow-xl">
            <div className="h-12 w-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Film className="h-6 w-6" />
            </div>
            <h3 className="text-red-900 font-black uppercase tracking-tighter italic mb-2">
              Technical Error
            </h3>
            <p className="text-red-600/70 font-bold uppercase tracking-widest text-[10px]">
              {error}
            </p>
          </div>
        ) : (
          <div className="space-y-24">
            <AnimatePresence mode="wait">
              {/* Collections Results */}
              {collections.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-10"
                >
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <Clapperboard className="h-5 w-5 text-brand-primary" />
                      <h2 className="font-brand text-3xl font-black uppercase tracking-widest italic text-brand-dark">
                        Universes Found
                      </h2>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-gray-100 to-transparent" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {collections.map((col, i) => (
                      <motion.div
                        key={col.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Link
                          to={`/shop?franchise=${encodeURIComponent(col.name)}`}
                          className="relative group block rounded-[2.5rem] overflow-hidden aspect-[16/9] shadow-2xl bg-brand-dark border-4 border-white"
                        >
                          <img
                            src={getDirectDriveLink(col.poster_url, 'w600')}
                            alt={col.name}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-80 group-hover:opacity-60"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-t from-brand-dark via-transparent to-transparent">
                            <h3 className="text-2xl font-black uppercase tracking-tighter text-white italic mb-4 drop-shadow-lg">
                              {col.name}
                            </h3>
                            <span className="rounded-full bg-white/10 border border-white/20 px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-md group-hover:bg-brand-primary group-hover:border-brand-primary transition-all transform group-hover:scale-105">
                              Explore Universe
                            </span>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              )}

              {/* Products Results */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-10"
              >
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <Film className="h-5 w-5 text-brand-primary" />
                    <h2 className="font-brand text-3xl font-black uppercase tracking-widest italic text-brand-dark">
                      Wardrobe Matches
                    </h2>
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-gray-100 to-transparent" />
                </div>

                {products.length === 0 ? (
                  <div className="text-center py-32 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-200">
                    <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <Film className="h-10 w-10 text-brand-dark/10" />
                    </div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter text-brand-dark mb-3 italic">
                      Cut! No Scenes Found.
                    </h3>
                    <p className="text-brand-dark/40 uppercase tracking-[0.2em] text-[10px] font-black max-w-xs mx-auto">
                      Our archive doesn't have any matches for "{query}". Try
                      another vibe.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                    {products.map((product, i) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                      >
                        <ProductCard product={product as any} priority={i < 4} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.section>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
