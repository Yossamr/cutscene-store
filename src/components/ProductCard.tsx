import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Eye, Film, Star, Sparkles } from "lucide-react";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";
import { QuickViewModal } from "./QuickViewModal";
import { cn, getDirectDriveLink } from "../lib/utils";
import { franchiseThemes } from "./effects/ThemeEffect";
import { CinematicLoader } from "./CinematicLoader";
import { useSettings } from "../context/SettingsContext";
import { EidCountdown } from "./EidCountdown";

export interface ColorVariant {
  name: string;
  image: string;
  secondaryImage?: string;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  images?: {
    main: string;
    trailer: string;
    additional: string[];
  };
  hasColorVariants?: boolean;
  colors?: ColorVariant[];
  rating: number;
  isBoxOfficeHit: boolean;
  isGallery?: boolean;
  genres: string[];
  franchise?: string;
  season?: string;
  isComingSoon?: boolean;
  spotifyUrl?: string;
  trailerVideo?: string;
  availableSizes?: string[];
}

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { settings } = useSettings();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Trigger animation
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      window.dispatchEvent(new CustomEvent('animate-add-to-cart', {
        detail: { startRect: rect, imageUrl: displayMain }
      }));
    }

    addToCart({
      productId: product.id,
      title: product.title,
      price: product.price,
      image: product.images?.main || product.image,
      size: product.isGallery ? "N/A" : "M", // Default size
      quantity: 1,
    });
    toast.success(`${product.title} added to cart!`);
  };

  const openQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsQuickViewOpen(true);
  };

  const formatImageUrl = (url: string | undefined) => {
    if (!url) return "";
    return url.startsWith("http") || url.startsWith("/") ? url : `/${url}`;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate rotation (max 10 degrees)
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    setMousePos({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: 0, y: 0 });
  };

  const mainImage = getDirectDriveLink(
    formatImageUrl(product.images?.main || product.image),
    'w300'
  );
  const trailerImage = getDirectDriveLink(
    formatImageUrl(product.images?.trailer || mainImage),
    'w300'
  );

  // If color variants are enabled, use them for hover behavior
  // Normal: First color's main image (if exists, fallback to mainImage)
  // Hover: Second color's main image (if exists, fallback to trailerImage)
  const displayMain =
    product.hasColorVariants && product.colors?.[0]?.image
      ? getDirectDriveLink(formatImageUrl(product.colors[0].image), 'w300')
      : mainImage;

  const displayHover =
    product.hasColorVariants && product.colors?.[1]?.image
      ? getDirectDriveLink(formatImageUrl(product.colors[1].image), 'w300')
      : trailerImage;

  const normalizedFranchise = product.franchise?.toLowerCase().trim();
  const theme = normalizedFranchise
    ? franchiseThemes[normalizedFranchise]
    : null;

  return (
    <>
      <div
        ref={cardRef}
        onClick={() => navigate(`/product/${product.id}`)}
        className="group flex flex-col overflow-hidden rounded-3xl bg-transparent shadow-sm transition-all duration-300 border border-gray-100 relative z-10 cursor-pointer"
        style={{
          transform: isHovered
            ? `perspective(1000px) rotateX(${mousePos.x}deg) rotateY(${mousePos.y}deg) scale3d(1.02, 1.02, 1.02)`
            : "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
          boxShadow:
            isHovered && theme
              ? `0 20px 40px -10px ${theme.primary}80, 0 0 20px ${theme.primary}40`
              : isHovered
                ? "0 20px 40px -10px rgba(0,0,0,0.2)"
                : "0 1px 3px rgba(0,0,0,0.1)",
          transition: isHovered ? "none" : "all 0.5s ease-out",
        }}
        onMouseEnter={() => {
          if (window.matchMedia("(hover: hover)").matches) {
            setIsHovered(true);
          }
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden bg-[#ECEEF0]">
          {/* Skeleton Loader while image is loading */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-[#0a0a0a] z-0 flex items-center justify-center">
               <CinematicLoader size="sm" />
            </div>
          )}
          <img
            src={isHovered ? displayHover : displayMain}
            alt={product.title}
            className={cn(
              "absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-110",
              product.isGallery ? "object-cover p-0" : "object-contain p-4",
              !imageLoaded ? "opacity-0" : "opacity-100"
            )}
            referrerPolicy="no-referrer"
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? "sync" : "async"}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=500&auto=format&fit=crop";
              setImageLoaded(true);
            }}
          />

          {/* Top Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            {product.isBoxOfficeHit && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-primary px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-md">
                <Star className="h-3 w-3 fill-white" /> Box Office Hit
              </span>
            )}
            {product.isGallery && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-primary/10 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-primary shadow-sm border border-brand-primary/20">
                <Film className="h-3 w-3" /> Gallery
              </span>
            )}
            {product.isComingSoon && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-dark px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-md border border-white/10">
                Coming Soon
              </span>
            )}
          </div>

          {/* REC Indicator (Appears on hover) */}
          <div className="absolute top-4 right-4 z-10 hidden md:flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-white">
              REC
            </span>
          </div>
        </div>

        {/* Text & Actions Container */}
        <div
          className={cn(
            "p-2 sm:p-3 md:p-5 flex flex-col items-center text-center flex-grow justify-between border-t transition-all duration-500",
            theme
              ? "bg-brand-dark/95 backdrop-blur-xl border-white/10"
              : "bg-white border-gray-100",
          )}
        >
          <div className="w-full">
            <h3
              className={cn(
                "font-brand text-sm sm:text-base md:text-xl font-black italic tracking-tighter line-clamp-2 mb-1 md:mb-2 min-h-[2.5rem] md:min-h-0 transition-colors duration-500",
                theme
                  ? "text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]"
                  : "text-brand-dark",
              )}
            >
              {product.title}
            </h3>

            <div className="flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-3 mb-2 md:mb-4">
              {product.isGallery ? (
                <span className="font-sans text-sm sm:text-base md:text-xl font-black text-brand-primary drop-shadow-[0_0_10px_rgba(45,212,191,0.3)]">
                  150 - 250 EGP
                </span>
              ) : (
                <>
                  <span
                    className={cn(
                      "text-[10px] md:text-sm line-through font-mono transition-colors duration-500",
                      theme ? "text-white/30" : "text-brand-dark/30",
                    )}
                  >
                    {Math.round(product.price * 1.2).toLocaleString("en-US")}{" "}
                    EGP
                  </span>
                  <span className="font-sans text-sm sm:text-base md:text-xl font-black text-brand-primary drop-shadow-[0_0_10px_rgba(45,212,191,0.3)]">
                    {Math.round(product.price).toLocaleString("en-US")} EGP
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col w-full gap-2 mt-auto">
            {!product.isComingSoon && !product.isGallery && (
              <button
                onClick={handleAddToCart}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-[0.2em] italic hover:scale-[1.02] active:scale-[0.98] transition-all py-3 shadow-lg",
                  theme
                    ? "bg-white text-brand-dark hover:bg-gray-100"
                    : "bg-brand-primary text-white hover:bg-brand-primary/90",
                )}
              >
                <ShoppingCart className="h-3.5 w-3.5 md:h-4 md:w-4" /> {settings?.eid_offer_enabled ? "Pre-Order" : "Add"}
              </button>
            )}
            <button
              onClick={openQuickView}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-[0.2em] italic active:scale-[0.98] transition-all py-3 shadow-lg",
                theme
                  ? "bg-white text-brand-dark hover:bg-gray-100"
                  : "bg-brand-dark text-white hover:bg-brand-dark/90",
              )}
            >
              <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" /> View
            </button>
          </div>
        </div>
      </div>

      <QuickViewModal
        productId={product.id}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </>
  );
}
