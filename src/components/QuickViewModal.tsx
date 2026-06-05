
import React, { useState, useEffect } from "react";
import { X, ShoppingCart, Loader2, Play, Pause, Film } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { PopcornRating } from "./PopcornRating";
import { apiFetch } from "../lib/api";
import { cn, getDirectDriveLink } from "../lib/utils";
import { CinematicLoader } from "./CinematicLoader";
import { useSettings } from "../context/SettingsContext";
import { EidCountdown } from "./EidCountdown";
import toast from "react-hot-toast";

interface QuickViewModalProps {
  productId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({ productId, isOpen, onClose }: QuickViewModalProps) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [posterSize, setPosterSize] = useState<string>("20*30");
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const { addToCart } = useCart();
  const { settings } = useSettings();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && productId) {
      setLoading(true);
      apiFetch(`/api/products/${productId}`)
        .then(data => {
          setProduct({
            ...data,
            image: data.images?.main,
            trailerVideo: data.images?.trailer
          });
          setLoading(false);
        })
        .catch(err => {
          toast.error("Failed to load product details");
          setLoading(false);
          onClose();
        });
    }
  }, [isOpen, productId, onClose]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handleAddToCart = () => {
    if (!product) return;

    const activePrice = product.isGallery
      ? (posterSize === "20*30" ? 150 : 250)
      : product.price;

    addToCart({
      productId: product.id,
      title: product.title,
      price: activePrice,
      image: product.image,
      size: product.isGallery ? posterSize : selectedSize,
      quantity: 1,
    });
    toast.success(`${product.title} added to cart!`);
    onClose();
  };

  const handleViewFullDetails = () => {
    onClose();
    navigate(`/product/${productId}`);
  };

  const isWhiteProduct = product?.title?.toLowerCase().includes('white') || 
    product?.title?.includes('أبيض') ||
    product?.genres?.some((g: string) => g.toLowerCase().includes('white') || g.includes('أبيض'));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 text-brand-dark">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              "relative w-full max-w-4xl overflow-hidden rounded-3xl shadow-2xl flex flex-col md:flex-row max-h-[90vh] z-10 transition-colors duration-500",
              "bg-brand-card"
            )}
          >
            <button
              onClick={onClose}
              className={cn(
                "absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all shadow-sm",
                "bg-white/80 text-gray-900 hover:bg-white"
              )}
            >
              <X className="h-5 w-5" />
            </button>

            {loading ? (
              <div className="flex w-full items-center justify-center p-20">
                <CinematicLoader size="lg" label="Scene Loading" />
              </div>
            ) : product ? (
              <>
                {/* Media Section */}
                <div className={cn(
                  "relative w-full md:w-1/2 h-64 md:h-auto p-4",
                  "bg-transparent"
                )}>
                  <img
                    src={getDirectDriveLink(product.image?.startsWith('http') || product.image?.startsWith('/') ? product.image : `/${product.image}`)}
                    alt={product.title}
                    className={cn(
                      "absolute inset-0 h-full w-full transition-opacity duration-500",
                      product.isGallery ? "object-cover p-0" : "object-contain p-4",
                      isPlaying ? "opacity-0" : "opacity-100"
                    )}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=500&auto=format&fit=crop';
                    }}
                  />
                  {product.trailerVideo && (
                    <video
                      ref={videoRef}
                      src={product.trailerVideo}
                      muted
                      loop
                      playsInline
                      className={cn(
                        "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
                        isPlaying ? "opacity-100" : "opacity-0"
                      )}
                    />
                  )}
                  {product.trailerVideo && (
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className={cn(
                        "absolute bottom-4 left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-md transition-all shadow-lg",
                        "bg-white/80 text-gray-900 hover:bg-brand-primary hover:text-white"
                      )}
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </button>
                  )}
                </div>

                {/* Details Section */}
                <div className="flex w-full md:w-1/2 flex-col p-6 md:p-8 overflow-y-auto bg-white">
                  <div className="mb-2 flex flex-wrap gap-2">
                    {product.isGallery && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-primary/10 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-primary shadow-sm border border-brand-primary/20">
                        <Film className="h-3 w-3" /> Gallery
                      </span>
                    )}
                    {product.genres?.map((genre: string) => (
                      <span 
                        key={genre} 
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border",
                          "bg-gray-100 text-gray-700 border-gray-200"
                        )}
                      >
                        {genre}
                      </span>
                    ))}
                  </div>

                  <h2 className={cn(
                    "font-brand text-2xl md:text-3xl font-black tracking-tight mb-2",
                    "text-gray-900"
                  )}>
                    {product.title}
                  </h2>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <PopcornRating rating={product.rating || 0} />
                    <span className={cn(
                      "text-sm font-bold",
                      "text-gray-500"
                    )}>
                      {product.rating?.toFixed(1) || "0.0"}
                    </span>
                    <span className={cn(
                      "font-sans text-2xl font-black ml-auto",
                      "text-gray-900"
                    )}>
                      {product.isGallery 
                        ? (posterSize === "20*30" ? "150" : "250")
                        : product.price?.toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>



                  {product.spotifyUrl && (
                    <div className="mb-6">
                      <iframe 
                        src={product.spotifyUrl.replace('open.spotify.com', 'open.spotify.com/embed')} 
                        width="100%" 
                        height="80" 
                        frameBorder="0" 
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                        loading="lazy"
                        className="rounded-xl shadow-sm"
                      ></iframe>
                    </div>
                  )}

                  {product.isGallery ? (
                    <div className="mb-8">
                      <div className="mb-3 flex items-center justify-between">
                        <span className={cn(
                          "text-xs font-bold",
                          "text-gray-500"
                        )}>
                          Select Poster Size (اختر مقاس البوستر)
                        </span>
                      </div>
                      <div className="flex gap-3">
                        {["20*30", "40*60"].map((size: string) => {
                          return (
                            <button
                              key={size}
                              onClick={() => setPosterSize(size)}
                              className={cn(
                                "flex h-12 flex-1 items-center justify-center rounded-xl border text-sm font-bold transition-all",
                                posterSize === size
                                  ? "border-brand-primary bg-brand-primary text-white shadow-md"
                                  : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:text-gray-900"
                              )}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : !product.isGallery && (
                    <div className="mb-8">
                      <div className="mb-3 flex items-center justify-between">
                        <span className={cn(
                          "text-xs font-bold",
                          "text-gray-500"
                        )}>
                          Select Size
                        </span>
                      </div>
                      <div className="flex gap-3">
                        {(product.availableSizes || ["S", "M", "L"]).map((size: string) => {
                          return (
                            <button
                              key={size}
                              onClick={() => setSelectedSize(size as any)}
                              className={cn(
                                "flex h-12 flex-1 items-center justify-center rounded-xl border text-sm font-bold transition-all",
                                selectedSize === size
                                  ? "border-brand-primary bg-brand-primary text-white shadow-md"
                                  : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:text-gray-900"
                              )}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {settings?.eid_offer_enabled && (
                    <div className="mb-4">
                      <EidCountdown size="sm" />
                    </div>
                  )}

                  <div className="mt-auto flex flex-col gap-3">
                    <button
                      onClick={handleAddToCart}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-primary py-4 text-sm font-bold text-white transition-all hover:bg-brand-primary/90 active:scale-[0.98] shadow-lg"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      {settings?.eid_offer_enabled ? "حجز مسبق (Pre-Order)" : "Add to Cart"}
                    </button>
                    <button
                      onClick={handleViewFullDetails}
                      className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-2xl border py-4 text-sm font-bold transition-all active:scale-[0.98]",
                        "border-gray-200 bg-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900"
                      )}
                    >
                      View Full Details
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </motion.div>
        </div>
      )}
    </AnimatePresence>

  );
}
