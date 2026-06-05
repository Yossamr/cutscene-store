
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingCart, ArrowLeft, Loader2, Share2, Heart, Box, ChevronDown, ChevronUp, Trash2, Grid, X, ZoomIn, Plus, Minus, Instagram, MessageCircle, Ruler } from "lucide-react";
import toast from "react-hot-toast";
import { useCart } from "../context/CartContext";
import { type Product } from "../components/ProductCard";
import { ProductRecommendations } from "../components/ProductRecommendations";
import { SizeGuide } from "../components/SizeGuide";
import { apiFetch } from "../lib/api";
import { cn, getDirectDriveLink, getImageUrl } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import { trackEvent } from "../lib/analytics";
import { useMusic } from "../context/MusicContext";
import { useUserBehavior } from "../hooks/useUserBehavior";
import { ThemeEffect } from "../components/effects/ThemeEffect";
import { CinematicLoader } from "../components/CinematicLoader";
import { useSettings } from "../context/SettingsContext";
import { EidCountdown } from "../components/EidCountdown";

export function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, totalItems } = useCart();
  const { user, token } = useAuth();
  const { setTrack } = useMusic();
  const { trackProductView } = useUserBehavior();
  const { settings } = useSettings();
  
  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [posterSize, setPosterSize] = useState<string>("20*30");
  const [selectedColor, setSelectedColor] = useState<any | null>(null);
  const [activeImage, setActiveImage] = useState<string>("");
  const [activeAction, setActiveAction] = useState("SizeGuide");
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [customText, setCustomText] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [emailForWaitlist, setEmailForWaitlist] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);
  const [isMainHovered, setIsMainHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  
  const sizeGuideRef = useRef<{ open: () => void }>(null);
  const mainImageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const checkWatchlist = async () => {
      if (!user || !token || !id) return;
      try {
        const data = await apiFetch("/api/auth/watchlist");
        setIsInWatchlist(data.some((p: any) => p.id === id));
      } catch (error) {
        console.error("Error checking watchlist", error);
      }
    };
    checkWatchlist();
  }, [id, user, token]);

  const handleAction = async (actionId: string) => {
    setActiveAction(actionId);
    
    switch (actionId) {
      case "SizeGuide":
        sizeGuideRef.current?.open();
        break;
      
      case "Remove":
        if (!user) {
          toast.error("Please login to manage your watchlist");
          navigate("/login");
          return;
        }
        try {
          const data = await apiFetch("/api/auth/watchlist/toggle", {
            method: "POST",
            body: { productId: id }
          });
          setIsInWatchlist(data.added);
          if (data.added) {
            trackEvent('add_to_watchlist', id as string, user?.id);
          }
          toast.success(data.message);
        } catch (error) {
          toast.error("Failed to update watchlist");
        }
        break;

      case "Catalog":
        navigate("/box-office");
        break;

      case "Share":
        if (navigator.share) {
          try {
            await navigator.share({
              title: product.title,
              text: `Check out this exclusive cinematic piece: ${product.title}`,
              url: window.location.href,
            });
          } catch (err) {
            console.log("Share failed", err);
          }
        } else {
          navigator.clipboard.writeText(window.location.href);
          toast.success("Link copied to clipboard!");
        }
        break;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!lightboxZoom) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await apiFetch(`/api/products/${id}`);
        setProduct(data);
        setActiveImage(data.images?.main || data.image);
        if (data.hasColorVariants && data.colors && data.colors.length > 0) {
          setSelectedColor(data.colors[0]);
          setActiveImage(data.colors[0].image);
        }
        if (data.availableSizes && data.availableSizes.length > 0) {
          setSelectedSize(data.availableSizes[0]);
        }
        // Stop global player when entering product page
        setTrack(null);
        // Track user behavior
        trackProductView(data);
        trackEvent('product_view', data.id, user?.id, {
          item: {
            id: data.id,
            title: data.title,
            price: data.price,
            category: data.category || 'Apparel'
          }
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
      fetchReviews();
    }
  }, [id, user?.id]);

  const fetchReviews = async () => {
    try {
      const data = await apiFetch(`/api/products/${id}/reviews`);
      setReviews(data);
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    }
  };

  const handleAddToCart = (e?: React.MouseEvent) => {
    if (product) {
      if (product.isComingSoon) {
        toast.error("This item is not yet available for purchase.");
        return;
      }

      const activePrice = product.isGallery 
        ? (posterSize === "20*30" ? 150 : 250)
        : product.price;

      const finalImage = selectedColor?.image || product.images?.main || product.image;

      if (e) {
        const docRect = document.body.getBoundingClientRect();
        let rect = mainImageRef.current?.getBoundingClientRect();
        
        if (rect) {
          window.dispatchEvent(new CustomEvent('animate-add-to-cart', {
            detail: { 
              startRect: {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
              }, 
              imageUrl: getImageUrl(finalImage) 
            }
          }));
        } else {
          // Fallback to button if image ref is not available
          const target = e.currentTarget as HTMLElement;
          rect = target.getBoundingClientRect();
          window.dispatchEvent(new CustomEvent('animate-add-to-cart', {
            detail: { startRect: rect, imageUrl: getImageUrl(finalImage) }
          }));
        }
      }

      addToCart({
        productId: product.id,
        title: product.title,
        price: activePrice,
        size: product.isGallery ? posterSize : selectedSize,
        color: selectedColor?.name,
        quantity: quantity,
        image: finalImage,
        customText: customText.trim() || undefined,
      });
      trackEvent('add_to_cart', product.id, user?.id, {
        item: {
          id: product.id,
          title: product.title,
          price: activePrice,
          category: product.category || 'Apparel',
          quantity: quantity
        }
      });
      toast.success("Added to list");
    }
  };

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForWaitlist) return;
    setIsJoiningWaitlist(true);
    try {
      const data = await apiFetch(`/api/products/${id}/waitlist`, {
        method: "POST",
        body: { email: emailForWaitlist }
      });
      toast.success(data.message);
      setEmailForWaitlist("");
    } catch (err: any) {
      toast.error(err.message || "Failed to join waitlist");
    } finally {
      setIsJoiningWaitlist(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to leave a review");
      navigate("/login");
      return;
    }
    setIsSubmittingReview(true);
    try {
      await apiFetch(`/api/products/${id}/reviews`, {
        method: "POST",
        body: newReview
      });
      toast.success("Review added successfully!");
      setNewReview({ rating: 5, comment: "" });
      fetchReviews();
    } catch (err: any) {
      toast.error(err.message || "Failed to add review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const formattedActiveImage = getImageUrl(activeImage, 'w500');
  const colorHoverImage = selectedColor?.secondaryImage ? getImageUrl(selectedColor.secondaryImage, 'w500') : null;
  const displayImage = (isMainHovered && colorHoverImage && selectedColor && activeImage === selectedColor.image) ? colorHoverImage : formattedActiveImage;

  useEffect(() => {
    setImageLoaded(false);
  }, [displayImage]);

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <CinematicLoader size="lg" label="Preparing Premiere" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4">
        <p className="text-xl text-brand-dark/50">{error || "Product not found"}</p>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-brand-primary hover:text-brand-dark"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </button>
      </div>
    );
  }

  const allImages = [
    product.images?.main || product.image,
    product.images?.trailer,
    ...(Array.isArray(product.images?.additional) ? product.images.additional : []),
    ...(Array.isArray(product.colors) ? product.colors.flatMap((c: any) => [c.image, c.secondaryImage]) : [])
  ].filter(Boolean);


  const actions = [
    { id: "SizeGuide", icon: Ruler, label: "دليل المقاسات" },
    { id: "Remove", icon: isInWatchlist ? Trash2 : Heart, label: isInWatchlist ? "Remove" : "Save" },
    { id: "Catalog", icon: Grid, label: "Catalog" },
    { id: "Share", icon: Share2, label: "Share" },
  ];

  const isWhiteProduct = product?.title?.toLowerCase().includes('white') || 
    product?.title?.includes('أبيض') ||
    product?.genres?.some((g: string) => g.toLowerCase().includes('white') || g.includes('أبيض'));

  const totalPrice = product.price * quantity;

  return (
    <>
    <ThemeEffect franchise={product?.franchise || null} />
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "min-h-screen pb-12 transition-colors duration-500 relative z-10",
        product?.franchise ? "bg-transparent" : "bg-brand-card"
      )}
    >
      {/* Lightbox / Zoom Modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-8 overflow-hidden"
            onClick={() => { setIsZoomed(false); setLightboxZoom(false); }}
          >
            <button
              onClick={(e) => { 
                e.stopPropagation(); 
                setIsZoomed(false); 
                setLightboxZoom(false); 
              }}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-[110] rounded-full bg-black/40 backdrop-blur-sm p-2 sm:p-3 text-white border border-white/20 hover:bg-black/60 hover:scale-110 active:scale-95 transition-all shadow-xl"
              aria-label="Close zoom"
            >
              <X className="h-6 w-6 sm:h-8 sm:w-8" />
            </button>
            
            {/* Instruction element to help users know how to interact */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[105] pointer-events-none opacity-60">
              <span className="bg-black/50 text-white text-xs px-4 py-2 rounded-full backdrop-blur-md tracking-wider">
                {lightboxZoom ? "Tap anywhere to zoom out" : "Tap image to zoom in"}
              </span>
            </div>
            
            <div 
              className="relative w-full h-full flex items-center justify-center cursor-default"
              onClick={() => {
                setIsZoomed(false);
                setLightboxZoom(false);
              }}
              onMouseMove={handleMouseMove}
            >
              <motion.img
                key={formattedActiveImage}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ 
                  scale: lightboxZoom ? (window.innerWidth < 768 ? 1.5 : 2.5) : 1, 
                  opacity: 1,
                  transformOrigin: lightboxZoom ? `${mousePos.x}% ${mousePos.y}%` : 'center center'
                }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                src={getImageUrl(activeImage, 'w1000')}
                alt="Zoomed product"
                className={cn(
                  "max-h-[75vh] max-w-[85vw] sm:max-h-[90vh] sm:max-w-[90vw] object-contain rounded-xl shadow-2xl",
                  lightboxZoom ? "cursor-zoom-out" : "cursor-zoom-in"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxZoom(!lightboxZoom);
                }}
                style={{ pointerEvents: "auto" }}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=500&auto=format&fit=crop';
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className={cn(
        "sticky top-0 z-40 flex items-center justify-between px-6 py-4 backdrop-blur-md transition-colors duration-500",
        product?.franchise ? "bg-black/40 border-b border-white/5" : "bg-brand-card/80"
      )}>
        <button 
          onClick={() => navigate(-1)}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition-colors",
            product?.franchise ? "bg-white/10 text-white hover:bg-white/20" : "bg-brand-dark/5 text-brand-dark hover:bg-brand-dark/10"
          )}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className={cn(
          "font-bold",
          product?.franchise ? "text-white" : "text-brand-dark"
        )}>Special offers</span>
        <div className="w-10" /> {/* Spacer for centering */}
      </header>

      <div className="px-4 md:px-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
          {/* Media Gallery */}
          <div className="flex flex-col items-center">
            <div 
              className={cn(
                "group relative w-full aspect-square max-w-md mx-auto rounded-3xl shadow-sm flex items-center justify-center cursor-zoom-in overflow-hidden transition-colors duration-500",
                product.isGallery ? "p-0" : "p-8",
                "bg-transparent"
              )}
              onClick={() => setIsZoomed(true)}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={formattedActiveImage}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "absolute",
                    product.isGallery ? "inset-0" : "inset-8"
                  )}
                >
                  {!imageLoaded && (
                    <div className="absolute inset-0 bg-[#0a0a0a] z-0 flex items-center justify-center rounded-2xl">
                       <CinematicLoader size="md" />
                    </div>
                  )}
                  <img
                    ref={mainImageRef}
                    src={displayImage}
                    alt={product.title}
                    onMouseEnter={() => setIsMainHovered(true)}
                    onMouseLeave={() => setIsMainHovered(false)}
                    className={cn(
                      "w-full h-full transition-transform duration-500 group-hover:scale-110",
                      product.isGallery ? "object-cover" : "object-contain",
                      !imageLoaded ? "opacity-0" : "opacity-100"
                    )}
                    onLoad={() => setImageLoaded(true)}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=500&auto=format&fit=crop';
                      setImageLoaded(true);
                    }}
                  />
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/5 flex items-center justify-center z-10">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm text-brand-dark rounded-full p-3 shadow-lg transform translate-y-4 group-hover:translate-y-0">
                  <ZoomIn className="h-6 w-6" />
                </div>
              </div>
            </div>
            
            {/* 360 Carousel Indicator */}
            <div className="mt-8 relative w-full max-w-xs flex justify-center">
              <div className={cn(
                "absolute top-0 w-full h-12 border-t-2 rounded-[100%] opacity-50",
                "border-brand-dark/15"
              )}></div>
              <div className={cn(
                "relative -top-3 px-4 flex items-center gap-2 text-brand-dark/50 transition-colors duration-500",
                "bg-brand-card"
              )}>
                <span className="text-xs font-bold tracking-widest">&lt;</span>
                <div className="h-1.5 w-1.5 rounded-full bg-brand-dark/20"></div>
                <div className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  "bg-white"
                )}></div>
                <div className="h-1.5 w-1.5 rounded-full bg-brand-dark/20"></div>
                <span className="text-xs font-bold tracking-widest">&gt;</span>
              </div>
            </div>

            {/* Thumbnails */}
            <div className="mt-6 flex gap-4 justify-center flex-wrap">
              {allImages.map((img, i) => (
                <div 
                  key={i} 
                  onClick={() => setActiveImage(img)}
                  className={cn(
                    "w-16 h-16 rounded-2xl shadow-sm p-2 flex items-center justify-center border transition-all cursor-pointer hover:-translate-y-1",
                    "bg-transparent",
                    activeImage === img ? "border-brand-primary ring-2 ring-brand-primary/20" : "border-transparent"
                  )}
                >
                  <img src={getImageUrl(img, 'w200')} alt={`thumbnail ${i}`} className="w-full h-full object-contain opacity-70 hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=500&auto=format&fit=crop'; }} />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col pt-4 md:pt-8">
            <div className="flex items-start justify-between gap-4">
              <h1 className={cn(
                "font-brand text-3xl font-black tracking-tight",
                "text-brand-dark"
              )}>
                {product.title}
              </h1>
              <span className={cn(
                "font-sans text-3xl font-black shrink-0",
                "text-brand-dark"
              )}>
                {product.isGallery 
                  ? (posterSize === "20*30" ? "150" : "250")
                  : product.price.toLocaleString('ar-EG')} ج.م
              </span>
            </div>

            {/* Action Row */}
            <div className="mt-8 flex overflow-x-auto gap-3 pb-4 snap-x no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              {actions.map((action) => {
                if (product.isGallery && action.id === "SizeGuide") return null;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action.id)}
                    className={cn(
                      "snap-start flex shrink-0 items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all",
                      action.id === "SizeGuide"
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
                        : activeAction === action.id
                          ? "bg-white text-brand-dark shadow-md"
                          : "bg-brand-dark/5 text-brand-dark shadow-sm hover:bg-brand-dark/10"
                    )}
                  >
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </button>
                );
              })}
            </div>

            {/* Size & Quantity Selectors */}
            <div className="mt-6 flex flex-col gap-6">
              {/* Size Selector */}
              {product.isGallery ? (
                <div>
                   <h3 className={cn(
                    "text-sm font-bold mb-3",
                    "text-brand-dark/70"
                  )}>Select Poster Size (اختر مقاس البوستر)</h3>
                  <div className="flex gap-3 flex-wrap">
                    {["20*30", "40*60"].map((size) => (
                      <button
                        key={size}
                        onClick={() => setPosterSize(size)}
                        className={cn(
                          "flex h-12 px-6 items-center justify-center rounded-2xl font-bold transition-all",
                          posterSize === size
                            ? "bg-brand-primary text-white shadow-md"
                            : "bg-brand-dark/5 text-brand-dark shadow-sm hover:bg-brand-dark/10"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={cn(
                      "text-sm font-bold",
                      "text-brand-dark/70"
                    )}>Select Size</h3>
                    <SizeGuide ref={sizeGuideRef} />
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {(product.availableSizes || ["S", "M", "L"]).map((size: string) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          "flex h-12 min-w-[3rem] px-3 items-center justify-center rounded-2xl font-bold transition-all",
                          selectedSize === size
                            ? "bg-brand-primary text-white shadow-md"
                            : "bg-brand-dark/5 text-brand-dark shadow-sm hover:bg-brand-dark/10"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selector */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <h3 className={cn(
                    "text-sm font-bold mb-3",
                    "text-brand-dark/70"
                  )}>Select Color (اختر اللون)</h3>
                  <div className="flex gap-3 flex-wrap">
                    {product.colors.map((color: any, index: number) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedColor(color);
                          setActiveImage(color.image);
                        }}
                        className={cn(
                          "flex flex-col items-center gap-2 group transition-all",
                          selectedColor?.name === color.name ? "scale-105" : "opacity-70 hover:opacity-100"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-full border-2 p-0.5 transition-all overflow-hidden",
                          selectedColor?.name === color.name ? "border-brand-primary ring-2 ring-brand-primary/20" : "border-transparent"
                        )}>
                          <img 
                            src={getImageUrl(color.image, 'w200')} 
                            alt={color.name} 
                            className="w-full h-full object-cover rounded-full"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          selectedColor?.name === color.name ? "text-brand-primary" : "text-brand-dark/60"
                        )}>
                          {color.name}
                        </span>
                      </button>
                    ))}
                    {/* Option to clear color selection if needed? Maybe better to always have one selected if colors exist */}
                  </div>
                </div>
              )}

              {settings?.eid_offer_enabled && (
                <div className="mt-2 mb-4">
                  <EidCountdown size="lg" />
                </div>
              )}

              {/* Quantity & Add to Cart */}
              <div className="flex flex-wrap items-end gap-4">
                {/* Quantity Selector */}
                <div className="shrink-0">
                  <h3 className={cn(
                    "text-sm font-bold mb-3",
                    "text-brand-dark/70"
                  )}>Quantity</h3>
                  <div className={cn(
                    "flex items-center gap-4 rounded-2xl p-1 h-12 transition-colors duration-500",
                    "bg-brand-dark/5 shadow-sm"
                  )}>
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
                        "hover:bg-brand-dark/10 text-brand-dark"
                      )}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className={cn(
                      "w-8 text-center font-bold",
                      "text-brand-dark"
                    )}>
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
                        "hover:bg-brand-dark/10 text-brand-dark"
                      )}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Add to List Button */}
                <div className="flex-1 min-w-[200px]">
                  {product.isComingSoon ? (
                    <form onSubmit={handleJoinWaitlist} className="flex gap-2">
                      <input 
                        type="email" 
                        value={emailForWaitlist}
                        onChange={(e) => setEmailForWaitlist(e.target.value)}
                        placeholder="Enter email for Drop Alert" 
                        required
                        className="flex-1 bg-white border border-brand-dark/10 rounded-2xl px-4 h-12 text-sm focus:outline-none focus:border-brand-primary"
                      />
                      <button
                        type="submit"
                        disabled={isJoiningWaitlist}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-brand-dark px-6 h-12 text-sm font-bold text-white shadow-lg active:scale-95 transition-transform hover:bg-brand-primary disabled:opacity-50 whitespace-nowrap"
                      >
                        {isJoiningWaitlist ? <Loader2 className="h-5 w-5 animate-spin" /> : "Join Waitlist"}
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={handleAddToCart}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand-primary px-8 h-12 text-sm font-bold text-white shadow-lg active:scale-95 transition-transform hover:bg-brand-primary/90"
                    >
                      <ShoppingCart className="h-5 w-5 text-white" />
                      {settings?.eid_offer_enabled ? "حجز مسبق (Pre-Order)" : "Add to list"}
                    </button>
                  )}
                </div>
              </div>
            </div>



            {/* Embedded Spotify Player */}
            {(product.spotifyUrl || product.spotify_url) && (
              <div className="mt-8">
                <h3 className="text-sm font-bold mb-3 text-brand-dark/50">Official Soundtrack</h3>
                <iframe 
                  src={(product.spotifyUrl || product.spotify_url).replace('open.spotify.com', 'open.spotify.com/embed')} 
                  width="100%" 
                  height="152" 
                  frameBorder="0" 
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                  loading="lazy"
                  className="rounded-2xl shadow-sm"
                ></iframe>
              </div>
            )}

            {/* Customization: Credit Roll */}
            {!product.isComingSoon && (
              <div className="mt-8 p-6 rounded-3xl bg-brand-primary/10 border border-brand-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-bold text-brand-dark">"Credit Roll" Customization</h3>
                </div>
                <p className="text-xs text-brand-dark/60 mb-5 leading-relaxed">
                  Want to add your name or a short quote printed like a movie credit? Place your order first, then send us a DM on Instagram with your order number and customization request!
                </p>
                <a 
                  href="https://ig.me/m/cutscenebrand" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-xl py-3.5 px-4 text-sm font-bold hover:opacity-90 transition-opacity shadow-md"
                >
                  <Instagram className="h-5 w-5" />
                  Request via Instagram DM
                </a>
              </div>
            )}

            {/* BTS Content Section */}
            {product.btsContent && (product.btsContent.title || product.btsContent.imageUrl) && (
              <div className="mt-12 bg-black text-white p-8 rounded-[2rem] overflow-hidden relative group">
                <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity">
                  {product.btsContent.imageUrl && (
                    <img src={getImageUrl(product.btsContent.imageUrl, 'w1000')} alt="BTS Background" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Behind the Scenes</span>
                  </div>
                  <h3 className="font-brand text-3xl font-black tracking-tight mb-4">{product.btsContent.title || "Production Notes"}</h3>
                  <p className="text-sm text-gray-300 leading-relaxed max-w-lg mb-6 whitespace-pre-line">
                    {product.btsContent.description || "Take a look at the creative process behind this cinematic piece."}
                  </p>
                  
                  <div className="flex items-center gap-4">
                     <div className="h-px flex-1 bg-white/20"></div>
                     <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">Exclusive Access</span>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews Section (Rotten Tomatoes Style) */}
            <div className="mt-12">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">🍿</span>
                <h3 className="font-brand text-xl font-black tracking-tight text-brand-dark">Audience Score</h3>
              </div>
              
              <div className="space-y-6">
                {reviews.length === 0 ? (
                  <p className="text-sm text-brand-dark/70 italic">No reviews yet. Be the first to rate this premiere!</p>
                ) : (
                  reviews.map(review => (
                    <div key={review.id} className="bg-brand-dark/5 p-4 rounded-2xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-brand-dark">{review.user_name}</span>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-sm ${i < review.rating ? 'text-brand-primary' : 'text-gray-300 grayscale'}`}>🍿</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-brand-dark/70">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Review Form */}
              <form onSubmit={handleSubmitReview} className="mt-8 bg-white p-6 rounded-3xl shadow-sm border border-brand-dark/5">
                <h4 className="text-sm font-bold mb-4 text-brand-dark">Leave a Review</h4>
                <div className="mb-4">
                  <label className="block text-xs font-bold text-brand-dark/70 mb-2">Rating (Popcorns)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(num => (
                      <button 
                        key={num} 
                        type="button"
                        onClick={() => setNewReview({...newReview, rating: num})}
                        className={`text-2xl transition-transform hover:scale-110 ${num <= newReview.rating ? '' : 'grayscale opacity-50'}`}
                      >
                        🍿
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <textarea 
                    value={newReview.comment}
                    onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                    placeholder="What did you think of this piece?"
                    className="w-full bg-brand-dark/5 border-none rounded-xl py-3 px-4 text-sm text-brand-dark focus:ring-2 focus:ring-brand-primary resize-none h-24"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmittingReview}
                  className="w-full bg-brand-dark text-white rounded-xl py-3 text-sm font-bold hover:bg-brand-primary transition-colors disabled:opacity-50"
                >
                  {isSubmittingReview ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Submit Review"}
                </button>
              </form>
            </div>

            {/* Recommendations */}
            <div className="mt-12">
              <h3 className={cn(
                "font-brand text-xl font-black tracking-tight mb-6",
                "text-brand-dark"
              )}>You might also like</h3>
              <ProductRecommendations currentProductId={product.id} genres={product.genres} />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Cart Button (Mobile) */}
      <div className="fixed bottom-6 left-6 z-50 md:hidden">
        <Link 
          to="/cart" 
          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-dark text-white shadow-2xl transition-transform active:scale-95 border border-white/10 relative"
        >
          <ShoppingCart className="h-6 w-6" />
          {totalItems > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white shadow-sm border-2 border-brand-dark">
              {totalItems}
            </span>
          )}
        </Link>
      </div>
    </motion.div>
    </>
  );
}
