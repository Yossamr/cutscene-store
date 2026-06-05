import { useState, useEffect } from "react";
import { ProductCard } from "../components/ProductCard";
import { ProductSkeleton } from "../components/ProductSkeleton";
import { motion } from "motion/react";
import { Film, Loader2, Sparkles, Clapperboard } from "lucide-react";
import { cn } from "../lib/utils";
import { apiFetch } from "../lib/api";
import { useSearchParams } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import { useMusic } from "../context/MusicContext";
import { ThemeEffect, InlineQuote } from "../components/effects/ThemeEffect";

export function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFranchise = searchParams.get("franchise");
  const category = searchParams.get("category");
  const { settings } = useSettings();
  const { setTrack } = useMusic();

  const [products, setProducts] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFranchise, setSelectedFranchise] = useState<string | null>(
    initialFranchise,
  );
  const [selectedSubCollection, setSelectedSubCollection] = useState<
    string | null
  >(null);
  const [activeType, setActiveType] = useState<"all" | "posters" | "products">(
    "all",
  );

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
        console.error("Failed to fetch shop data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update URL when franchise changes
  useEffect(() => {
    const params: any = {};
    if (selectedFranchise) params.franchise = selectedFranchise;
    if (category) params.category = category;
    setSearchParams(params);
  }, [selectedFranchise, setSearchParams, category]);

  // Update music when franchise changes
  useEffect(() => {
    if (selectedFranchise && collections.length > 0) {
      const currentCollection = collections.find(
        (c) => c.name === selectedFranchise,
      );
      if (currentCollection?.spotify_url) {
        setTrack(currentCollection.spotify_url);
      } else {
        setTrack(null);
      }
    } else if (!selectedFranchise) {
      setTrack(null);
    }
  }, [selectedFranchise, collections, setTrack]);

  const availableCollections = collections.filter(
    (c) => c.status !== "coming_soon",
  );

  // Filter franchises based on category if needed
  const allFranchises =
    availableCollections
      .filter((col) => {
        if (category === "portraits") {
          // Only show franchises that have at least one gallery item
          return products.some((p) => p.franchise === col.name && p.isGallery);
        } else if (category === "tshirts") {
          // Only show franchises that have at least one t-shirt
          return products.some((p) => p.franchise === col.name && !p.isGallery);
        }
        return true;
      })
      .map((c) => c.name) || [];

  const comingSoonCollections = collections.filter(
    (c) => c.status === "coming_soon",
  );

  const currentCollection = selectedFranchise
    ? collections.find((c) => c.name === selectedFranchise)
    : null;
  const subCollections = currentCollection?.has_sub_collections
    ? currentCollection.sub_collections || []
    : [];

  const filteredProducts = (Array.isArray(products) ? products : []).filter(
    (p) => {
      const franchiseMatch = selectedFranchise
        ? p.franchise === selectedFranchise
        : true;
      const subCollectionMatch = selectedSubCollection
        ? p.subCollection === selectedSubCollection
        : true;

      // Category filtering: posters in portraits, everything else in tshirts
      let categoryMatch = true;
      if (category === "portraits") {
        categoryMatch = p.isGallery === true;
      } else if (category === "tshirts") {
        categoryMatch = !p.isGallery;
      }

      // Type filtering (Posters/Products toggle)
      let typeMatch = true;
      if (activeType === "posters") {
        typeMatch = p.isGallery === true;
      } else if (activeType === "products") {
        typeMatch = p.isGallery === false;
      }

      // Hide products if their collection is coming_soon
      const isAvailable = p.collectionStatus !== "coming_soon";

      return (
        franchiseMatch &&
        subCollectionMatch &&
        categoryMatch &&
        typeMatch &&
        isAvailable
      );
    },
  );

  const pageTitle =
    category === "portraits"
      ? "The Gallery"
      : category === "tshirts"
        ? "Now Showing"
        : "The Shop";
  const pageSubtitle =
    category === "portraits"
      ? "Limited edition cinematic posters for your sanctuary."
      : "Find your cinematic fit by vibe or universe.";

  return (
    <>
      <ThemeEffect franchise={selectedFranchise} />
      <div
        className={cn(
          "space-y-12 pb-24 min-h-screen p-6 relative z-10 transition-colors duration-500",
          selectedFranchise ? "bg-transparent" : "bg-white text-brand-dark",
        )}
      >
        {!selectedFranchise && (
          <div className="flex flex-col items-center text-center space-y-4 pt-12 md:pt-20">
            <h1 className="font-brand text-5xl md:text-8xl font-black italic tracking-tighter text-brand-dark">
              THE{" "}
              <span className="text-brand-primary underline decoration-8 underline-offset-[12px]">
                STAGE
              </span>
            </h1>
            <p className="text-[10px] md:text-sm font-black uppercase tracking-[0.6em] text-brand-dark/20 ml-[0.6em]">
              Premium Original Wear & Cinema Art
            </p>
          </div>
        )}

        <div
          className={cn(
            "flex items-center gap-3 border-b pb-6 transition-colors duration-500",
            selectedFranchise ? "border-white/5" : "border-gray-100",
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
            {category === "portraits" ? (
              <Sparkles className="h-6 w-6" />
            ) : (
              <Film className="h-6 w-6" />
            )}
          </div>
          <div>
            <h1 className="font-brand text-4xl font-black uppercase tracking-tight text-brand-dark italic">
              {pageTitle}
            </h1>
            <p className="text-brand-dark/60 text-sm uppercase tracking-widest">
              {pageSubtitle}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-10">
            {/* Skeletons Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 pt-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Filters */}
            <div className="flex flex-col gap-8">
              {/* Shop by Universe */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-brand-dark">
                  <Clapperboard className="h-5 w-5 text-brand-primary" />
                  <h2 className="font-brand text-xl font-black uppercase tracking-widest italic">
                    {category === "portraits"
                      ? "Browse Gallery by Universe"
                      : "Shop by Universe"}
                  </h2>
                </div>
                <div className="flex overflow-x-auto no-scrollbar gap-3 md:gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:flex-wrap">
                  <button
                    onClick={() => setSelectedFranchise(null)}
                    className={cn(
                      "shrink-0 rounded-full px-6 py-3 md:px-8 md:py-3.5 text-[10px] md:text-sm font-black uppercase tracking-[0.2em] italic whitespace-nowrap transition-all duration-500",
                      selectedFranchise === null
                        ? selectedFranchise
                          ? "bg-white text-brand-dark shadow-xl scale-105"
                          : "bg-brand-dark text-white shadow-xl scale-105"
                        : selectedFranchise
                          ? "bg-white/10 text-white/40 border border-white/5 backdrop-blur-md hover:bg-white/20 hover:text-white"
                          : "bg-black/5 text-brand-dark/40 border border-black/5 hover:bg-black/10 hover:text-brand-dark/60",
                    )}
                  >
                    {category === "portraits" ? "All Posters" : "All Universes"}
                  </button>
                  {allFranchises.map((franchise) => (
                    <button
                      key={franchise as string}
                      onClick={() => {
                        setSelectedFranchise(franchise as string);
                        setSelectedSubCollection(null);
                      }}
                      className={cn(
                        "shrink-0 rounded-full px-6 py-3 md:px-8 md:py-3.5 text-[10px] md:text-sm font-black uppercase tracking-[0.2em] italic whitespace-nowrap transition-all duration-500",
                        selectedFranchise === franchise
                          ? selectedFranchise
                            ? "bg-white text-brand-dark shadow-xl scale-105 ring-2 ring-brand-primary/50"
                            : "bg-brand-dark text-white shadow-xl scale-105 ring-2 ring-brand-primary/50"
                          : selectedFranchise
                            ? "bg-white/10 text-white/40 border border-white/5 backdrop-blur-md hover:bg-white/20 hover:text-white"
                            : "bg-black/5 text-brand-dark/40 border border-black/5 hover:bg-black/10 hover:text-brand-dark/60",
                      )}
                    >
                      {franchise as string}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sub-Collections Filter */}
            {subCollections.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <div className="flex overflow-x-auto no-scrollbar gap-2 md:gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:flex-wrap flex-nowrap shrink-0 items-center">
                  <button
                    onClick={() => setSelectedSubCollection(null)}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-2 md:px-5 md:py-2.5 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all",
                      selectedSubCollection === null
                        ? "bg-brand-primary text-white shadow-md"
                        : "bg-gray-100 text-brand-dark/60 shadow-sm hover:bg-gray-200",
                    )}
                  >
                    All {selectedFranchise}
                  </button>
                  {subCollections.map((sub: string) => (
                    <button
                      key={sub}
                      onClick={() => setSelectedSubCollection(sub)}
                      className={cn(
                        "shrink-0 rounded-full px-4 py-2 md:px-5 md:py-2.5 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all",
                        selectedSubCollection === sub
                          ? "bg-brand-primary text-white shadow-md"
                          : "bg-gray-100 text-brand-dark/60 shadow-sm hover:bg-gray-200",
                      )}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Inline Quote */}
            <InlineQuote franchise={selectedFranchise} />

            {/* Type Toggle - Refined Cinematic Style */}
            <div className="flex flex-col items-center gap-4 py-8 px-4">
              <div className="flex p-1.5 bg-black/5 dark:bg-white/5 rounded-2xl md:rounded-full border border-gray-100 dark:border-white/5 backdrop-blur-md relative overflow-hidden w-full max-w-[440px] shadow-sm">
                <button
                  onClick={() => setActiveType("products")}
                  className={cn(
                    "flex-1 relative z-10 px-4 md:px-6 py-3.5 md:py-3 rounded-xl md:rounded-full transition-all duration-500 flex items-center justify-center gap-2 md:gap-3",
                    activeType === "products"
                      ? "text-white"
                      : "text-brand-dark/40 hover:text-brand-dark/60 dark:text-white/40 dark:hover:text-white/60",
                  )}
                >
                  {activeType === "products" && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-brand-dark rounded-xl md:rounded-full shadow-lg"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                  <Film
                    className={cn(
                      "h-4 w-4 relative z-10",
                      activeType === "products" ? "text-brand-primary" : "",
                    )}
                  />
                  <span className="relative z-10 text-[10px] md:text-sm font-black uppercase tracking-[0.2em] italic">
                    The Products
                  </span>
                </button>

                <button
                  onClick={() => setActiveType("posters")}
                  className={cn(
                    "flex-1 relative z-10 px-4 md:px-6 py-3.5 md:py-3 rounded-xl md:rounded-full transition-all duration-500 flex items-center justify-center gap-2 md:gap-3",
                    activeType === "posters"
                      ? "text-white"
                      : "text-brand-dark/40 hover:text-brand-dark/60 dark:text-white/40 dark:hover:text-white/60",
                  )}
                >
                  {activeType === "posters" && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-brand-dark rounded-xl md:rounded-full shadow-lg"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                  <Sparkles
                    className={cn(
                      "h-4 w-4 relative z-10",
                      activeType === "posters" ? "text-amber-500" : "",
                    )}
                  />
                  <span className="relative z-10 text-[10px] md:text-sm font-black uppercase tracking-[0.2em] italic">
                    The Posters
                  </span>
                </button>
              </div>

              {activeType !== "all" && (
                <button
                  onClick={() => setActiveType("all")}
                  className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-brand-dark/20 dark:text-white/20 hover:text-brand-primary transition-colors py-2 px-6"
                >
                  Clear View Filter
                </button>
              )}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 pt-4 border-t border-gray-100">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <ProductCard product={product} priority={i < 4} />
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-brand-dark/50">
                  <p className="text-sm uppercase tracking-widest font-bold">
                    {category === "portraits"
                      ? "No posters found in this universe yet."
                      : "No products found matching these filters."}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedFranchise(null);
                      setSearchParams({});
                    }}
                    className="mt-4 text-brand-primary hover:underline text-xs font-bold uppercase tracking-widest"
                  >
                    {category === "portraits"
                      ? "Show All Posters"
                      : "Clear Filters"}
                  </button>
                </div>
              )}
            </div>

            {/* Coming Soon Section */}
            {comingSoonCollections.length > 0 && (
              <div className="pt-24 border-t border-gray-100">
                <div className="flex flex-col items-center text-center mb-16">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    className="mb-4 flex items-center gap-2 px-4 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20"
                  >
                    <Clapperboard className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                      Production Phase
                    </span>
                  </motion.div>
                  <h2 className="font-brand text-5xl md:text-7xl font-black uppercase tracking-tighter italic text-brand-dark mb-4">
                    Coming <span className="text-amber-500">Soon</span>
                  </h2>
                  <div className="h-1 w-24 bg-brand-primary rounded-full mb-6" />
                  <p className="text-brand-dark/40 text-xs md:text-sm uppercase tracking-[0.2em] font-bold max-w-md">
                    The director's cut is currently in the editing room. Get
                    ready for the next drop.
                  </p>
                </div>

                <div className="relative mt-12 mb-24">
                  {/* Film Strip Background */}
                  <div className="absolute inset-0 bg-[#2a2a2a] rounded-[3rem] -z-20" />

                  {/* Film Strip Holes (Top) */}
                  <div className="absolute -top-3 left-0 w-full flex justify-around px-4 md:px-8 pointer-events-none z-10">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={`top-${i}`}
                        className="h-4 w-5 md:h-6 md:w-8 rounded-sm bg-white shadow-inner"
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 py-16 md:py-20 bg-[#8c8c8c] rounded-[3rem] px-6 md:px-12 border-y-8 border-[#2a2a2a] shadow-2xl relative z-0 overflow-hidden">
                    {/* Subtle noise texture for the grey background */}
                    <div
                      className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                      }}
                    ></div>

                    {comingSoonCollections.map((col, i) => (
                      <motion.div
                        key={col.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.15, duration: 0.6 }}
                        className="group relative flex justify-center"
                      >
                        <div className="relative w-full max-w-[280px] aspect-[2/3] rounded-[2rem] overflow-hidden shadow-2xl bg-brand-dark border-[6px] border-white">
                          <img
                            src={col.poster_url}
                            alt={col.name}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-90"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            decoding="async"
                          />

                          {/* Overlay Content */}
                          <div className="absolute inset-0 flex flex-col items-center justify-end p-6 text-center bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white italic mb-2 drop-shadow-lg">
                              {col.name}
                            </h3>
                            <p className="text-white/60 text-[10px] uppercase tracking-widest font-bold max-w-xs line-clamp-2 mb-6 hidden group-hover:block transition-all">
                              {col.description}
                            </p>

                            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden mb-3">
                              <motion.div
                                initial={{ width: "0%" }}
                                whileInView={{ width: "75%" }}
                                transition={{
                                  duration: 2,
                                  delay: i * 0.1 + 0.5,
                                }}
                                className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]"
                              />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500 drop-shadow-md">
                              75% Rendered
                            </span>
                          </div>

                          {/* REC Indicator */}
                          <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
                            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                            <span className="text-[8px] font-mono font-bold tracking-widest text-white">
                              REC
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Film Strip Holes (Bottom) */}
                  <div className="absolute -bottom-3 left-0 w-full flex justify-around px-4 md:px-8 pointer-events-none z-10">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={`bottom-${i}`}
                        className="h-4 w-5 md:h-6 md:w-8 rounded-sm bg-white shadow-inner"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
