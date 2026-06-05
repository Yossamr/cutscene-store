import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import {
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ShoppingCart,
  Ticket,
  X,
  Search,
  ChevronRight,
  Gift as GiftIcon,
  Film,
} from "lucide-react";
import { CinematicLoader } from "../components/CinematicLoader";
import { motion, AnimatePresence, useAnimation } from "motion/react";
import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import toast from "react-hot-toast";
import { getDirectDriveLink, getImageUrl } from "../lib/utils";
import { useSettings } from "../context/SettingsContext";

function CartItemRow({
// ... (I'll keep this intact by targeting correctly)
  item,
  onRemove,
  onUpdateQuantity,
}: {
  item: any;
  onRemove: () => void;
  onUpdateQuantity: (q: number) => void;
}) {
  const controls = useAnimation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);

  const imageUrl =
    typeof item.image === "string"
      ? item.image
      : (item.image as any)?.main || "";

  const handleDragEnd = async (event: any, info: any) => {
    const offset = info.offset.x;
    if (offset < -100) {
      setIsDeleting(true);
      await controls.start({
        x: "-100%",
        opacity: 0,
        transition: { duration: 0.2 },
      });
      onRemove();
    } else {
      controls.start({
        x: 0,
        transition: { type: "spring", stiffness: 300, damping: 30 },
      });
    }
  };

  return (
    <div className="relative mb-4 sm:mb-6 group">
      {/* Background Delete Action - only visible when dragging */}
      <div className="absolute inset-y-0 right-0 flex w-1/2 items-center justify-end rounded-2xl bg-red-500/10 pr-8">
        <Trash2 className="h-6 w-6 text-red-500" />
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.5, right: 0 }}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="relative flex w-full bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden"
      >
        <div className="flex w-full p-3 sm:p-5 gap-4 sm:gap-6 items-center">
          {/* Image */}
          <div className="relative h-28 w-20 sm:h-32 sm:w-24 shrink-0 overflow-hidden rounded-xl bg-gray-50 border border-gray-100/50 flex items-center justify-center">
            {!imageError && imageUrl ? (
              <img
                src={getImageUrl(imageUrl, 'w300')}
                alt={item.title}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
              />
            ) : (
              <Film className="h-6 w-6 text-gray-300" />
            )}
          </div>

          <div className="flex-1 min-w-0 py-1 flex flex-col h-full justify-between">
            <div>
              <div className="flex justify-between items-start gap-4 mb-1">
                <h3 className="font-brand text-sm sm:text-xl font-bold uppercase leading-tight tracking-tight text-[#1A1A1A] line-clamp-2">
                  {item.title}
                </h3>
                  <button
                  onClick={onRemove}
                  className="shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[10px] sm:text-xs text-brand-primary/80 font-bold uppercase tracking-wider mb-2">
                {(item.price).toLocaleString("ar-EG")} ج.م
              </p>

              {/* Details container */}
              <div className="flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-1 mb-4">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wider">Size</p>
                  <p className="font-mono text-xs sm:text-sm font-semibold text-gray-800">{item.size}</p>
                </div>
                {item.color && (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wider">Color</p>
                    <p className="font-mono text-xs sm:text-sm font-semibold text-gray-800">{item.color}</p>
                  </div>
                )}
                {item.customText && (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wider">Credit</p>
                    <p className="font-mono text-xs sm:text-sm font-semibold text-gray-800 truncate max-w-[80px]">"{item.customText}"</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-end mt-auto">
                {/* Quantity controls */}
              <div className="flex items-center gap-2 sm:gap-3 bg-gray-50 rounded-full p-1 border border-gray-100">
                <button
                  onClick={() => onUpdateQuantity(item.quantity - 1)}
                  className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-600 hover:text-brand-primary active:scale-95 transition-all"
                >
                  <Minus className="h-3 w-3 sm:h-4 w-4" />
                </button>
                <span className="font-mono text-sm sm:text-base font-bold w-4 sm:w-6 text-center text-gray-800">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.quantity + 1)}
                  className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-600 hover:text-brand-primary active:scale-95 transition-all"
                >
                  <Plus className="h-3 w-3 sm:h-4 w-4" />
                </button>
              </div>

              <div className="text-right">
                  <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Total</p>
                  <p className="font-mono text-sm sm:text-lg font-black text-[#1A1A1A] leading-none">
                  {(item.price * item.quantity).toLocaleString("ar-EG")} ج.م
                  </p>
              </div>
            </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
}

export function CartPage() {
  const { settings } = useSettings();
  const {
    items,
    removeFromCart,
    updateQuantity,
    totalPrice,
    appliedCoupon,
    applyCoupon,
    selectedFreePoster,
    setSelectedFreePoster,
    discountAmount,
    finalPrice,
    isFreeShipping,
  } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [posters, setPosters] = useState<any[]>([]);

  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);
  const [posterSearch, setPosterSearch] = useState("");
  const [tempSelectedPoster, setTempSelectedPoster] = useState<any>(null);

  useEffect(() => {
    if (isPosterModalOpen) {
      setTempSelectedPoster(selectedFreePoster || null);
    }
  }, [isPosterModalOpen, selectedFreePoster]);

  const filteredPosters = posters.filter(p => 
    p.title?.toLowerCase().includes(posterSearch.toLowerCase())
  );

  useEffect(() => {
    if (settings.free_poster_offer_enabled || settings.eid_offer_enabled) {
      apiFetch("/api/products").then((allProducts: any) => {
        // Handle both array and {products: []} responses just in case
        const productsList = Array.isArray(allProducts) ? allProducts : (allProducts.products || []);
        
        const foundPosters = productsList.filter((p: any) => {
          const titleMatch = p.title?.toLowerCase().includes("poster") || p.title?.includes("بوستر");
          const descMatch = p.description?.toLowerCase().includes("poster") || p.description?.includes("بوستر");
          const catMatch = 
            p.collection?.category?.toLowerCase() === "posters" || 
            p.collection?.category === "بوسترات" ||
            p.collection_category?.toLowerCase() === "posters" ||
            p.collection_category === "بوسترات";
            
          return titleMatch || descMatch || catMatch;
        });
        
        setPosters(foundPosters);
      }).catch(err => {
        console.error("Failed to fetch posters", err);
      });
    } else {
      setPosters([]);
    }
  }, [settings.free_poster_offer_enabled, settings.eid_offer_enabled]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidating(true);
    try {
      const data = await apiFetch("/api/coupons/validate", {
        method: "POST",
        body: { code: couponCode.trim(), cartTotal: totalPrice },
      });

      applyCoupon({
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
      });
      toast.success(data.message);
      setCouponCode("");
    } catch (error: any) {
      toast.error(error.message || "Invalid cheat code");
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    applyCoupon(null);
    toast.success("Cheat code removed");
  };

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4"
      >
        <div className="rounded-full bg-white p-6 shadow-sm mb-6">
          <ShoppingCart className="h-12 w-12 text-brand-dark/40" />
        </div>
        <h2 className="font-brand text-2xl font-black text-brand-dark">
          Your cart is empty
        </h2>
        <p className="mt-2 text-brand-dark/60">
          Looks like you haven't added anything yet.
        </p>
        <Link
          to="/"
          className="mt-8 rounded-full bg-brand-card px-8 py-4 text-sm font-bold text-brand-dark hover:bg-brand-primary transition-colors shadow-lg"
        >
          Start Shopping
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-auto max-w-lg py-6 px-4 pb-32"
    >
      <header className="mb-8 flex items-center justify-between">
        <Link
          to="/"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm text-brand-dark hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-brand text-xl font-black text-brand-dark">
          Shipping List
        </h1>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <div className="mb-8">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={`${item.productId}-${item.size}-${item.color || "no-color"}`}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            >
              <CartItemRow
                item={item}
                onRemove={() =>
                  removeFromCart(
                    item.productId,
                    item.size,
                    item.color,
                    item.customText,
                  )
                }
                onUpdateQuantity={(q) =>
                  updateQuantity(
                    item.productId,
                    item.size,
                    item.color,
                    q,
                    item.customText,
                  )
                }
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Compact Free Poster Selector */}
      {(settings.free_poster_offer_enabled || settings.eid_offer_enabled) && posters.length > 0 && (
        <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#ff006e] via-[#8338ec] to-[#ffbe0b] p-[2px] shadow-lg shadow-[#ff006e]/10">
          <div className="flex items-center justify-between gap-4 bg-white rounded-[1.4rem] p-5">
            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                <div className="absolute inset-0 bg-[#ff006e] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                {selectedFreePoster ? (
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center shadow-md transform rotate-3 hover:rotate-0 transition-transform duration-500 bg-gray-50">
                    <img 
                      src={getImageUrl(selectedFreePoster.images?.main || selectedFreePoster.image_main || selectedFreePoster.image || "", 'w300')} 
                      alt={selectedFreePoster.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {/* Small gift overlay badge icon */}
                    <div className="absolute bottom-0 right-0 bg-gradient-to-tr from-[#ff006e] to-[#ffbe0b] text-white p-1 rounded-tl-lg shadow-md">
                      <GiftIcon className="w-3 h-3 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="relative w-14 h-14 bg-gradient-to-br from-[#ff006e] to-[#ffbe0b] rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-500">
                    <GiftIcon className="w-7 h-7 text-white animate-bounce" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-brand text-lg font-black text-brand-dark italic leading-tight">
                  {settings.eid_offer_enabled ? "🎁 هدية العيد مجاناً" : "🎁 هديتك المجانية"}
                </h3>
                {selectedFreePoster ? (
                  <p className="text-[11px] text-[#ff006e] font-black uppercase tracking-wider mt-1 flex flex-wrap items-center gap-1.5 leading-none">
                    <span className="bg-[#ff006e]/10 text-[#ff006e] px-2 py-0.5 rounded-full text-[8.5px] font-black tracking-normal">SELECTED</span>
                    <span className="text-gray-800 font-extrabold truncate max-w-[140px] md:max-w-[200px]">{selectedFreePoster.title}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-gray-500 font-bold tracking-wide mt-0.5" style={{ direction: "rtl", textAlign: "right" }}>
                    اضغط هنا لاختيار هديتك مجاناً
                  </p>
                )}
              </div>
            </div>

            <button 
              onClick={() => setIsPosterModalOpen(true)}
              className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-brand-dark text-white hover:bg-[#ff006e] transition-colors shadow-md"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Poster Selection Modal Overlay */}
      <AnimatePresence>
        {isPosterModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md"
          >
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={() => setIsPosterModalOpen(false)} />
            
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-4xl h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-[2.5rem] sm:rounded-[3rem] overflow-hidden flex flex-col shadow-2xl relative z-10 mx-auto"
            >
              {/* Modal Drag Handle (Mobile) */}
              <div className="h-1.5 w-12 bg-gray-200 rounded-full mx-auto my-3 sm:hidden" />

              {/* Modal Header */}
              <div className="p-6 sm:p-8 pb-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary shadow-inner">
                    <GiftIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-brand-dark italic leading-none">اختار هديتك 🎉</h2>
                    <p className="text-xs text-[#ff006e] font-black uppercase tracking-[0.2em] mt-1">Free for limited time</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPosterModalOpen(false)}
                  className="p-3 hover:bg-gray-100 rounded-2xl transition-all active:scale-95"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="px-6 sm:px-8 py-4">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand-primary transition-colors" />
                  <input 
                    type="text" 
                    placeholder="ابحث عن اسم البوستر..."
                    value={posterSearch}
                    onChange={(e) => setPosterSearch(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-transparent focus:border-brand-primary/20 rounded-2xl text-base focus:ring-4 focus:ring-brand-primary/5 transition-all outline-none font-bold"
                  />
                </div>
              </div>

              {/* Scrollable Posters Grid */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 pt-0 custom-scrollbar">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
                  {filteredPosters.map(poster => {
                    const isSelected = tempSelectedPoster?.id === poster.id;
                    return (
                      <div 
                        key={poster.id}
                        onClick={() => {
                          setTempSelectedPoster(poster);
                        }}
                        className={`group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-300 relative ${isSelected ? 'border-[#ff006e] ring-8 ring-[#ff006e]/5 scale-[1.02]' : 'border-gray-50 bg-gray-50/50 hover:border-brand-primary/20 hover:scale-[1.02]'} `}
                      >
                        <div className="aspect-[2/3] w-full bg-gray-100 relative overflow-hidden flex items-center justify-center">
                          {/* Skeleton inside poster */}
                          <div className="absolute inset-0 bg-gray-200 z-0" />
                          <div className="absolute inset-0 z-10 flex items-center justify-center">
                             <CinematicLoader size="sm" />
                          </div>
                          <img 
                            src={getImageUrl(poster.images?.main || poster.image_main, 'w300')} 
                            alt={poster.title}
                            loading="lazy"
                            onLoad={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.opacity = '1';
                            }}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 relative z-20 opacity-0 transition-opacity"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-3 left-3 z-10">
                            <span className="px-3 py-1 bg-gradient-to-r from-[#ff006e] to-[#ffbe0b] text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">
                              FREE GIFT
                            </span>
                          </div>
                          {isSelected && (
                             <div className="absolute inset-0 bg-brand-primary/20 flex items-center justify-center backdrop-blur-[2px]">
                               <div className="bg-white text-[#ff006e] w-10 h-10 rounded-full flex items-center justify-center shadow-2xl transform scale-125">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                               </div>
                             </div>
                          )}
                        </div>
                        <div className="p-4 text-center bg-white border-t border-gray-50">
                          <p className="text-xs font-black text-brand-dark line-clamp-1 uppercase tracking-tight">{poster.title}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {filteredPosters.length === 0 && (
                  <div className="py-20 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-400 font-bold">مفيش بوستر بالاسم ده..</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 sm:p-8 border-t border-gray-100 bg-gray-50/30">
                <button 
                  onClick={() => {
                    if (tempSelectedPoster) {
                      setSelectedFreePoster(tempSelectedPoster);
                      toast.success(`🎁 Selected: ${tempSelectedPoster.title}`);
                      setIsPosterModalOpen(false);
                    } else {
                      toast.error("يرجى اختيار بوستر كهدية أولاً!");
                    }
                  }}
                  className={`w-full py-5 rounded-[1.5rem] tracking-wide text-base md:text-lg font-black transition-all active:scale-[0.98] ${
                    tempSelectedPoster 
                      ? 'bg-gradient-to-r from-[#ff006e] via-[#8338ec] to-[#ffbe0b] text-white shadow-xl shadow-[#ff006e]/20 hover:scale-[1.01]' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {tempSelectedPoster ? `Confirm Selection: ${tempSelectedPoster.title}` : 'Choose a Poster / اختر بوستر الهدية'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Section */}
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between text-sm text-brand-dark/60">
            <span>Subtotal</span>
            <span className="font-bold text-brand-dark">
              {totalPrice.toLocaleString("ar-EG")} ج.م
            </span>
          </div>
          {appliedCoupon && (
            <div className="flex items-center justify-between text-sm text-brand-primary">
              <span>Discount ({appliedCoupon.code})</span>
              <span className="font-bold">
                - {discountAmount.toLocaleString("ar-EG")} ج.م
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm text-brand-dark/60">
            <span>Shipping</span>
            <span
              className={`font-bold ${isFreeShipping ? "text-brand-primary" : "text-brand-dark"}`}
            >
              {isFreeShipping ? "Free" : "Calculated at checkout"}
            </span>
          </div>
          <div className="h-px w-full bg-gray-100" />
          {(settings.free_poster_offer_enabled || settings.eid_offer_enabled) && selectedFreePoster && (
            <div className="flex items-center justify-between text-sm text-brand-primary">
              <span className="flex items-center gap-1"><Ticket className="w-4 h-4" /> Free Poster</span>
              <span className="font-bold truncate max-w-[150px]">{selectedFreePoster.title}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="font-bold text-brand-dark">Total</span>
            <span className="font-sans text-2xl font-black text-brand-dark">
              {finalPrice.toLocaleString("ar-EG")} ج.م
            </span>
          </div>
        </div>

        <Link
          to="/checkout"
          className="block w-full rounded-2xl bg-brand-primary py-5 text-center text-base font-bold text-brand-dark shadow-lg hover:bg-brand-primary/90 transition-all active:scale-95"
        >
          Make a purchase
        </Link>
      </div>
    </motion.div>
  );
}
