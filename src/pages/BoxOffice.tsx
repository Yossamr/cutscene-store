import { motion, AnimatePresence } from "motion/react";
import { Ticket, Loader2, ArrowLeft, Film, Tv, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { useNavigate } from "react-router-dom";
import { cn, getDirectDriveLink } from "../lib/utils";
import { useSettings } from "../context/SettingsContext";
import { CinematicLoader } from "../components/CinematicLoader";

export function BoxOffice() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedAccordion, setExpandedAccordion] = useState<string>("cinematic");

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const data = await apiFetch("/api/collections");
        setCollections(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch collections:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  const filteredCollections = collections.filter(collection => {
    if (!activeCategory) return true;
    return collection.category === activeCategory && collection.status !== "coming_soon";
  });

  const categoryCards = [
    {
      id: "أفلام",
      title: "Movies",
      subtitle: "أفلام",
      icon: Film,
      image: settings.categoryImages?.movies,
      fallback: "https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=1000&auto=format&fit=crop"
    },
    {
      id: "مسلسلات",
      title: "TV Shows",
      subtitle: "مسلسلات",
      icon: Tv,
      image: settings.categoryImages?.tvShows,
      fallback: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?q=80&w=1000&auto=format&fit=crop"
    },
    {
      id: "انمي",
      title: "Anime",
      subtitle: "انمي",
      icon: Sparkles,
      image: settings.categoryImages?.anime,
      fallback: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1000&auto=format&fit=crop"
    }
  ];

  return (
    <div className="min-h-screen bg-[#ffffff] text-brand-dark pb-24 relative overflow-hidden">
      {/* Cinematic Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200vw] h-[50vh] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-primary/5 via-transparent to-transparent opacity-50 z-0 pointer-events-none"></div>
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay z-0"></div>

      <AnimatePresence mode="wait">
        {!activeCategory ? (
          <motion.div
            key="categories"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={{
              hidden: { opacity: 0 },
              visible: { 
                opacity: 1,
                transition: { staggerChildren: 0.15 }
              },
              exit: { opacity: 0, scale: 1.05, filter: "blur(10px)", transition: { duration: 0.4 } }
            }}
            className="p-6 relative z-10 max-w-7xl mx-auto space-y-12"
          >
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: -20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
              }}
              className="flex flex-col items-center justify-center text-center gap-4 border-b border-brand-dark/5 pb-10 pt-8"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/30 shadow-[0_0_30px_rgba(58,134,255,0.1)]">
                <Ticket className="h-8 w-8" />
              </div>
              <div>
                <h1 className="font-brand text-5xl md:text-7xl font-black uppercase tracking-tighter text-brand-dark italic drop-shadow-sm">
                  Box Office
                </h1>
                <p className="text-brand-dark/40 mt-2 text-sm md:text-base uppercase tracking-[0.3em] font-bold">Choose your universe</p>
              </div>
            </motion.div>

            <div className="flex flex-row w-full h-[65vh] md:h-[75vh] gap-1 md:gap-6 relative group/container">
              {/* Cinematic Scanline Overlay Effect */}
              <div className="absolute inset-0 pointer-events-none z-30 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>

              {categoryCards.map((cat, i) => {
                const isExpanded = expandedAccordion === cat.id;

                return (
                  <motion.div
                    key={cat.id}
                    variants={{
                      hidden: { opacity: 0, y: 50 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 } }
                    }}
                    whileTap={{ scale: 0.98 }}
                    onMouseEnter={() => setExpandedAccordion(cat.id)}
                    onClick={() => {
                      if (expandedAccordion !== cat.id) {
                        setExpandedAccordion(cat.id);
                      } else {
                        setActiveCategory(cat.id);
                      }
                    }}
                    className={`group relative cursor-pointer overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem] bg-gray-900 shadow-2xl border border-brand-dark/10 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${isExpanded ? 'flex-[4] md:flex-[2]' : 'flex-1 md:flex-1'} hover:border-brand-primary/50`}
                  >
                    {/* Background Image */}
                    <img 
                      src={cat.image && cat.image.length > 5 ? getDirectDriveLink(cat.image, 'w600') : cat.fallback} 
                      alt={cat.title} 
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${isExpanded ? 'scale-110 opacity-70 md:opacity-80 saturate-50 md:saturate-100' : 'scale-100 opacity-30 saturate-0'}`}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        if (e.currentTarget.src !== cat.fallback) {
                          e.currentTarget.src = cat.fallback;
                        }
                      }}
                    />
                    
                    {/* Spotlight blur (desktop only) */}
                    <div className={`hidden md:block absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(255,255,255,0.1)_0%,_transparent_70%)] transition-opacity duration-700 pointer-events-none ${isExpanded ? 'opacity-100' : 'opacity-0'}`}></div>
                    
                    {/* Dark gradient for text readability */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent transition-opacity duration-500 ${isExpanded ? 'opacity-90' : 'opacity-70'}`} />
                    
                    {/* Collapsed State: Vertical Text */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 z-10 ${isExpanded ? 'opacity-0 scale-95 pointer-events-none delay-0' : 'opacity-100 scale-100 delay-200'}`}>
                       <span className="font-brand text-lg sm:text-2xl md:text-5xl font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-white/40 group-hover:text-white/80 italic whitespace-nowrap rotate-180 drop-shadow-2xl" style={{ writingMode: 'vertical-rl' }}>
                         {cat.title}
                       </span>
                    </div>
                    
                    {/* Expanded State: Content */}
                    <div className={`absolute inset-0 p-4 md:p-12 flex flex-col justify-end items-center md:items-start text-center md:text-left transform transition-all duration-700 z-20 ${isExpanded ? 'opacity-100 translate-y-0 delay-200' : 'opacity-0 translate-y-10 pointer-events-none delay-0'}`}>
                      <cat.icon className="h-6 w-6 md:h-12 md:w-12 text-brand-primary mb-2 md:mb-6 filter drop-shadow-[0_0_15px_rgba(202,165,108,0.8)]" />
                      
                      <h2 className="font-brand text-xl sm:text-4xl md:text-7xl font-black uppercase tracking-tighter text-white italic drop-shadow-[0_8px_20px_rgba(0,0,0,0.9)] mb-1 md:mb-2 leading-none w-full break-words">
                        {cat.title}
                      </h2>
                      <p className="text-brand-primary font-bold tracking-[0.2em] text-[9px] sm:text-sm md:text-xl md:block w-full drop-shadow-md">
                        {cat.subtitle}
                      </p>
                      
                      {/* Mobile prompt to tap again */}
                      <div className="md:hidden mt-4 px-4 py-1.5 border border-white/20 rounded-full bg-black/40 text-[8px] font-black tracking-[0.2em] text-white uppercase shadow-[0_10px_20px_rgba(0,0,0,0.4)] backdrop-blur-md">
                         Tap to enter
                      </div>
                    </div>

                    {/* Decorative Corner Elements */}
                    <div className={`absolute top-4 left-4 h-6 w-6 border-t border-l border-white/20 rounded-tl-lg transition-opacity duration-700 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}></div>
                    <div className={`absolute bottom-4 right-4 h-6 w-6 border-b border-r border-white/20 rounded-br-lg transition-opacity duration-700 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}></div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="products"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={{
              hidden: { opacity: 0, scale: 0.98, filter: "blur(10px)" },
              visible: { 
                opacity: 1, 
                scale: 1, 
                filter: "blur(0px)",
                transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.08 }
              },
              exit: { opacity: 0, transition: { duration: 0.3 } }
            }}
            className="p-6 relative z-10 max-w-[1400px] mx-auto space-y-8"
          >
            <motion.div 
              variants={{
                hidden: { opacity: 0, x: -20 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.5 } }
              }}
              className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-brand-dark/10 pb-8 mt-4"
            >
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setActiveCategory(null)}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-dark/5 text-brand-dark hover:bg-brand-dark/10 hover:scale-105 transition-all border border-brand-dark/10 backdrop-blur-md"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <div>
                  <h1 className="font-brand text-4xl md:text-5xl font-black uppercase tracking-tighter text-brand-dark italic drop-shadow-sm">
                    {categoryCards.find(c => c.id === activeCategory)?.title}
                  </h1>
                  <p className="text-brand-primary text-sm font-black uppercase tracking-[0.3em] mt-1">
                    {activeCategory}
                  </p>
                </div>
              </div>
            </motion.div>

            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <CinematicLoader size="lg" label="Box Office Opening" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 pt-4">
                {filteredCollections.map((collection, i) => (
                  <motion.div
                    key={collection.id}
                    variants={{
                      hidden: { opacity: 0, y: 30, scale: 0.9 },
                      visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
                    }}
                    whileHover={{ y: -10, transition: { duration: 0.3 } }}
                    onClick={() => navigate(`/shop?franchise=${encodeURIComponent(collection.name)}`)}
                    className="group relative aspect-[2/3] cursor-pointer overflow-hidden rounded-[1.5rem] bg-gray-900 border border-brand-dark/10 shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:border-brand-primary/50 hover:shadow-[0_10px_40px_rgba(58,134,255,0.15)] transition-all duration-500"
                  >
                    <img 
                      src={collection.poster_url ? getDirectDriveLink(collection.poster_url, 'w400') : "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=500&auto=format&fit=crop"} 
                      alt={collection.name}
                      className="absolute inset-0 w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    
                    <div className="absolute inset-0 p-5 md:p-6 flex flex-col justify-end items-start">
                      <h3 className="font-brand text-2xl md:text-3xl font-black uppercase tracking-tighter text-white italic drop-shadow-[0_4px_10px_rgba(0,0,0,1)] mb-1 relative inline-block">
                        {collection.name}
                        <span className="absolute -bottom-1 left-0 w-0 h-1 bg-brand-primary transition-all duration-500 group-hover:w-full shadow-[0_0_10px_rgba(58,134,255,0.8)]"></span>
                      </h3>
                      {collection.description && (
                        <p className="text-white/60 text-[10px] md:text-xs line-clamp-2 uppercase tracking-[0.2em] font-bold mt-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                          {collection.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
                
                {filteredCollections.length === 0 && (
                  <div className="col-span-full py-32 text-center">
                    <p className="text-lg font-black uppercase tracking-[0.3em] text-brand-dark/30">No collections found in this universe yet.</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
