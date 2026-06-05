import { ProductCard } from "../components/ProductCard";
import { ProductSkeleton } from "../components/ProductSkeleton";
import { HeroBanner } from "../components/HeroBanner";
import { PersonalizedDeals } from "../components/PersonalizedDeals";
import { motion } from "motion/react";
import { Search, SlidersHorizontal, Star, Quote, ShoppingBag, Gift, ShieldCheck, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { cn } from "../lib/utils";
import { Link } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";

export function Home() {
  const { settings } = useSettings();
  const [products, setProducts] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    "All",
    "Cinematic Universe",
    "Binge-Watching",
    "Otaku Lounge",
    "The Gallery",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, collectionsData] = await Promise.all([
          apiFetch("/api/products"),
          apiFetch("/api/collections"),
        ]);
        setProducts(productsData);
        setCollections(collectionsData);
      } catch (error) {
        console.error("Failed to fetch home data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const availableCollections = collections.filter(
    (c) => c.status !== "coming_soon",
  );

  const filteredProducts = (Array.isArray(products) ? products : []).filter(
    (product) => {
      let matchesCategory = false;
      if (activeCategory === "All") {
        matchesCategory = true;
      } else if (activeCategory === "The Gallery") {
        matchesCategory = product.isGallery;
      } else if (activeCategory === "Cinematic Universe") {
        matchesCategory =
          (!product.genres?.includes("Anime") &&
            !product.genres?.includes("TV Show")) ||
          product.isGallery;
      } else if (activeCategory === "Binge-Watching") {
        matchesCategory =
          product.genres?.includes("TV Show") ||
          product.genres?.includes("Series");
      } else if (activeCategory === "Otaku Lounge") {
        matchesCategory = product.genres?.includes("Anime");
      } else {
        matchesCategory =
          product.genres && product.genres.includes(activeCategory);
      }

      const matchesSearch = product.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      // Hide products if their collection is coming_soon
      const isAvailable = product.collectionStatus !== "coming_soon";
      return matchesCategory && matchesSearch && isAvailable;
    },
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12 pb-24"
    >
      {/* Hero Banner Section */}
      <HeroBanner />

      {/* Mobile Header & Search */}
      <section className="md:hidden space-y-6 pt-4">
        <h1 className="font-brand text-4xl font-black italic tracking-tighter text-brand-dark leading-none">
          Discover
          <br />
          <span className="text-brand-primary">Universes</span>
        </h1>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-dark/50" />
            <input
              type="text"
              placeholder="Search vibes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl bg-gray-100 border border-gray-200 py-4 pl-12 pr-4 text-sm text-brand-dark placeholder:text-brand-dark/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 shadow-sm transition-all"
            />
          </div>
          <button className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-gray-100 border border-gray-200 shadow-sm text-brand-dark hover:bg-gray-200 transition-colors">
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Horizontal Scroller: Good Deals (Personalized) */}
      <PersonalizedDeals />

      {/* Grid: All Products */}
      <section id="products-section" className="space-y-8 pt-12 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-brand text-3xl font-black tracking-tight text-brand-dark uppercase italic">
              Now Showing
            </h2>
            <p className="text-brand-dark/40 text-[10px] font-bold uppercase tracking-[0.2em]">
              Live feed from the cinematic universe
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                  activeCategory === cat
                    ? (settings?.eid_offer_enabled
                        ? "bg-emerald-800 text-white border-emerald-700 shadow-md shadow-emerald-900/20"
                        : "bg-brand-dark text-white border-brand-dark shadow-md")
                    : (settings?.eid_offer_enabled
                        ? "bg-emerald-50/15 text-emerald-800 border-emerald-500/10 hover:border-emerald-500/30 hover:bg-emerald-500/10"
                        : "bg-white text-brand-dark/50 border-gray-100 hover:border-brand-primary/30 hover:text-brand-primary"),
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <p className="text-brand-dark/60 font-medium text-xs uppercase tracking-widest">
            {filteredProducts.length} items found
          </p>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-brand-dark/40 uppercase">
              Stock Synced
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-gray-100 p-6 shadow-sm mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-brand-dark">
              No products found
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Try adjusting your filters or search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:gap-4 lg:grid-cols-4">
            {filteredProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 4} />
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}
