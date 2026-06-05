import React, { useState, useMemo } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  Phone,
  MapPin,
  User,
  Building2,
  Landmark,
  Truck,
  Film,
  Tag,
  X,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { CinematicLoader } from "../components/CinematicLoader";
import toast from "react-hot-toast";
import { apiFetch } from "../lib/api";
import { GOVERNORATES, SHIPPING_RATES } from "../constants/shipping";
import { getDirectDriveLink, getImageUrl } from "../lib/utils";
import { trackEvent } from "../lib/analytics";
import { useEffect } from "react";
import { useSettings } from "../context/SettingsContext";

export function Checkout() {
  const { settings } = useSettings();
  const {
    items,
    totalPrice,
    discountAmount,
    finalPrice,
    isFreeShipping,
    appliedCoupon,
    applyCoupon,
    selectedFreePoster,
    clearCart,
  } = useCart();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Add free poster if selected
    const gaItems = items.map((item: any) => ({
      id: item.productId || item.id,
      title: item.title,
      price: item.price,
      quantity: item.quantity,
      category: item.category || 'Apparel'
    }));

    if (selectedFreePoster) {
      gaItems.push({
        id: selectedFreePoster.id,
        title: `🎁 ${selectedFreePoster.title} (Gift)`,
        price: 0,
        quantity: 1,
        category: 'Gift / Poster'
      });
    }

    trackEvent('checkout_started', undefined, user?.id, {
      items: gaItems,
      value: finalPrice
    });
  }, [user?.id, items, finalPrice, selectedFreePoster]);

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    phone: "",
    governorate: "",
    city: "",
    address: "",
  });

  const [couponCode, setCouponCode] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const shippingCost = useMemo(() => {
    if (!formData.governorate || isFreeShipping) return 0;
    return SHIPPING_RATES[formData.governorate] || 0;
  }, [formData.governorate, isFreeShipping]);

  const finalTotal = finalPrice + shippingCost;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    try {
      const data = await apiFetch("/api/coupons/validate", {
        method: "POST",
        body: { code: couponCode, cartTotal: totalPrice },
      });
      applyCoupon({
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
      });
      toast.success(data.message || "تم تفعيل كود الخصم!");
      setCouponCode("");
    } catch (err: any) {
      toast.error(err.message || "كود خصم غير صالح");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    applyCoupon(null);
    toast.success("تم إزالة كود الخصم");
  };

  const validatePhone = (phone: string) => {
    return /^\d{11}$/.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.governorate) {
      toast.error("يرجى اختيار المحافظة");
      return;
    }
    if (!validatePhone(formData.phone)) {
      toast.error("رقم الهاتف يجب أن يتكون من 11 رقم فقط");
      return;
    }
    if (!formData.city.trim()) {
      toast.error("يرجى إدخال اسم المدينة");
      return;
    }
    setIsSubmitting(true);

    try {
      let payloadItems = items.map((i) => ({
        product: i.productId,
        size: i.size,
        color: i.color,
        quantity: i.quantity,
        price: i.price,
        customText: i.customText,
      }));

      let successItems = [...items];
      if ((settings.free_poster_offer_enabled || settings.eid_offer_enabled) && selectedFreePoster) {
           const freePosterItem = {
              productId: selectedFreePoster.id,
              title: selectedFreePoster.title,
              size: "Standard",
              color: null,
              quantity: 1,
              price: 0,
              customText: "🎁 هدية مجانية - بوستر",
              image: selectedFreePoster.images?.main || selectedFreePoster.image_main
           };
           payloadItems.push({
              product: freePosterItem.productId,
              size: freePosterItem.size,
              color: freePosterItem.color,
              quantity: freePosterItem.quantity,
              price: freePosterItem.price,
              customText: freePosterItem.customText,
           });
           successItems.push(freePosterItem);
      }

      const orderData = {
        items: payloadItems,
        shippingDetails: { ...formData, shippingCost },
        totalAmount: finalTotal,
        discountAmount,
        couponCode: appliedCoupon?.code || null,
        status: "Processing",
        paymentMethod: "COD",
      };

      const data = await apiFetch("/api/orders", {
        method: "POST",
        body: orderData,
      });

      clearCart();
      toast.success("تم استلام طلبك بنجاح!");

      // Navigate to success page with order details
      navigate("/order-success", {
        state: {
          order: {
            id: data.orderId,
            items: successItems,
            totalAmount: finalTotal,
            discountAmount,
            promoCode: appliedCoupon?.code,
            barcodeUrl: data.barcodeUrl,
          },
        },
      });
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء إرسال الطلب");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-6 -mb-32 bg-brand-card min-h-screen">
      <div className="mx-auto max-w-5xl py-12 px-4">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 font-brand text-5xl font-black uppercase tracking-widest text-brand-dark italic text-center"
        >
          CHECK<span className="text-brand-primary">OUT</span>
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Shipping Form */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleSubmit}
              id="checkout-form"
              className="space-y-8"
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-[2.5rem] border border-brand-dark/10 bg-white p-8 md:p-10 shadow-2xl shadow-black/20"
              >
                <div className="flex items-center gap-4 mb-10">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-lg shadow-brand-primary/20">
                    <Truck className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-widest text-brand-dark">
                      بيانات التوصيل
                    </h2>
                    <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em]">
                      Shipping Details
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  {/* Full Name */}
                  <div className="group space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark/40 group-focus-within:text-brand-primary transition-colors">
                      <User className="h-3 w-3" /> الاسم بالكامل
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      className="w-full rounded-2xl border-2 border-brand-dark/5 bg-brand-card p-5 text-brand-dark font-bold focus:border-brand-primary focus:bg-brand-card focus:outline-none transition-all shadow-inner"
                      placeholder="أدخل اسمك بالكامل"
                    />
                  </div>

                  {/* Phone */}
                  <div className="group space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark/40 group-focus-within:text-brand-primary transition-colors">
                      <Phone className="h-3 w-3" /> رقم الهاتف (11 رقم)
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={11}
                      pattern="\d{11}"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      className="w-full rounded-2xl border-2 border-brand-dark/5 bg-brand-card p-5 text-brand-dark font-bold focus:border-brand-primary focus:bg-brand-card focus:outline-none transition-all shadow-inner"
                      placeholder="01xxxxxxxxx"
                    />
                  </div>

                  {/* City */}
                  <div className="group space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark/40 group-focus-within:text-brand-primary transition-colors">
                      <Building2 className="h-3 w-3" /> المدينة
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="w-full rounded-2xl border-2 border-brand-dark/5 bg-brand-card p-5 text-brand-dark font-bold focus:border-brand-primary focus:bg-brand-card focus:outline-none transition-all shadow-inner"
                      placeholder="أدخل اسم المدينة"
                    />
                  </div>

                  {/* Governorate */}
                  <div className="group space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark/40 group-focus-within:text-brand-primary transition-colors">
                      <Landmark className="h-3 w-3" /> المحافظة
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={formData.governorate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            governorate: e.target.value,
                          })
                        }
                        className="w-full rounded-2xl border-2 border-brand-dark/5 bg-brand-card p-5 text-brand-dark font-bold focus:border-brand-primary focus:bg-brand-card focus:outline-none transition-all appearance-none shadow-inner"
                      >
                        <option value="">اختر المحافظة</option>
                        {GOVERNORATES.map((gov) => (
                          <option key={gov} value={gov}>
                            {gov}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 left-5 flex items-center text-brand-dark/40">
                        <svg
                          className="h-5 w-5 fill-current"
                          viewBox="0 0 20 20"
                        >
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="group space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark/40 group-focus-within:text-brand-primary transition-colors">
                      <MapPin className="h-3 w-3" /> العنوان بالتفصيل
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="w-full rounded-2xl border-2 border-brand-dark/5 bg-brand-card p-5 text-brand-dark font-bold focus:border-brand-primary focus:bg-brand-card focus:outline-none transition-all resize-none shadow-inner"
                      placeholder="أدخل عنوانك بالتفصيل (المدينة، الشارع، رقم المبنى)"
                    />
                  </div>

                  {/* Deposit Seriousness Warning Message (رسالة إثبات الجدية) */}
                  <div className="rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 p-5 flex items-start gap-4 mt-6">
                    <div className="p-2 bg-amber-500/20 rounded-lg text-amber-600 shrink-0 mt-0.5">
                      <Sparkles className="h-5 w-5 text-amber-600 animate-pulse" />
                    </div>
                    <div className="space-y-1 text-right w-full" style={{ direction: "rtl" }}>
                      <p className="font-brand text-base font-black text-amber-800">
                        ملاحظة هامة جداً لإثبات الجدية ⚠️
                      </p>
                      <p className="text-xs font-bold leading-relaxed text-slate-700">
                        سيتم التواصل معكم بعد إتمام الطلب مباشرةً لدفع <span className="text-amber-600 font-extrabold text-sm">مقدم (ديبوزيت) بقيمة 150 جنيه</span> من تكلفة الأوردر الإجمالية وذلك لإثبات جدية الحجز وتأكيد الطلب.
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1" style={{ direction: "ltr" }}>
                        * We will contact you to pay a deposit of 150 EGP from the total order cost to confirm seriousness.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </form>
          </div>

          {/* Right Column: Order Summary & Coupon */}
          <div className="lg:col-span-5 space-y-8">
            {/* Order Items Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-[2.5rem] border border-brand-dark/5 bg-white p-8 shadow-2xl shadow-black/20"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black uppercase tracking-widest text-brand-dark">
                  طلبك
                </h2>
                <span className="rounded-full bg-brand-primary px-4 py-1 text-[10px] font-black uppercase tracking-widest text-brand-dark animate-pulse">
                  {items.length + ((settings?.free_poster_offer_enabled || settings?.eid_offer_enabled) && selectedFreePoster ? 1 : 0)} Items
                </span>
              </div>

              <div className="space-y-6 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                {items.map((item) => {
                  const imageUrl =
                    typeof item.image === "string"
                      ? item.image
                      : (item.image as any)?.main || "";
                  // Generate a consistent pseudo-random array for the barcode based on the item title
                  const barcodeLines = Array.from({ length: 18 }).map(
                    (_, i) => {
                      const hash =
                        item.title.charCodeAt(i % item.title.length) || 50;
                      return {
                        width: (hash % 3) + 1,
                        height: 50 + (hash % 50),
                      };
                    },
                  );

                  return (
                    <div
                      key={`${item.productId}-${item.size}`}
                      className="relative flex w-full overflow-hidden rounded-xl bg-[#FDFBF7] border border-[#DCD3C1] text-[#2C2C2C] shadow-sm"
                    >
                      {/* Left section (Main Ticket) */}
                      <div className="flex-1 p-4 border-r-2 border-dashed border-[#C4B9A6] relative flex flex-col justify-between overflow-hidden">
                        {/* Ticket Cutouts */}
                        <div className="absolute -top-3 -right-3 h-6 w-6 rounded-full bg-white border border-[#DCD3C1] shadow-inner" />
                        <div className="absolute -bottom-3 -right-3 h-6 w-6 rounded-full bg-white border border-[#DCD3C1] shadow-inner" />

                        {/* Subtle Paper Texture Overlay */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />

                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[8px] font-black tracking-[0.2em] text-[#8B7E66] uppercase">
                              Admit One
                            </span>
                            <span className="text-[8px] font-black tracking-[0.2em] text-[#8B7E66] uppercase">
                              Qty {item.quantity}
                            </span>
                          </div>

                          <div className="flex gap-3">
                            {/* Small Image "Stamp" / "Poster" */}
                            <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-md bg-[#1a1a1a] shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] flex items-center justify-center p-1.5 transform -rotate-0 border-none">
                              {/* Spotlight effect */}
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[150%] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/30 via-transparent to-transparent opacity-80 z-0"></div>

                              <div className="relative z-10 w-full h-full bg-black border border-[#111] shadow-[0_4px_10px_rgba(0,0,0,0.9)] overflow-hidden">
                                <div className="absolute inset-0 border border-white/5 z-20 pointer-events-none"></div>
                                {imageUrl ? (
                                  <img
                                    src={getImageUrl(imageUrl, 'w200')}
                                    alt={item.title}
                                    className="h-full w-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-zinc-700">
                                    <Film className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-brand text-sm font-black uppercase leading-tight mb-0.5 tracking-tight line-clamp-1">
                                {item.title}
                              </h3>
                              <p className="text-[8px] text-[#8B7E66] uppercase tracking-widest mb-2">
                                Cinematic Experience
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="relative z-10 flex justify-between items-end mt-2">
                          <div className="flex gap-3">
                            <div>
                              <p className="text-[8px] text-[#8B7E66] uppercase tracking-widest mb-0.5">
                                Seat
                              </p>
                              <p className="font-mono text-xs font-black">
                                {item.size}
                              </p>
                            </div>
                            {item.color && (
                              <div>
                                <p className="text-[8px] text-[#8B7E66] uppercase tracking-widest mb-0.5">
                                  Cast
                                </p>
                                <p className="font-mono text-xs font-black">
                                  {item.color}
                                </p>
                              </div>
                            )}
                          </div>

                          {item.customText && (
                            <div className="text-right">
                              <p className="text-[8px] text-[#8B7E66] uppercase tracking-widest mb-0.5">
                                Credit
                              </p>
                              <p className="font-mono text-[9px] font-bold text-brand-primary truncate max-w-[80px]">
                                "{item.customText}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right section (Stub) */}
                      <div className="w-24 bg-[#F5F1E9] p-3 flex flex-col justify-between items-center relative overflow-hidden">
                        {/* Subtle Paper Texture Overlay */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />

                        <div className="text-center w-full relative z-10">
                          <p className="text-[8px] font-black tracking-widest text-[#8B7E66] uppercase mb-1">
                            Price
                          </p>
                          <p className="font-mono text-xs font-black text-[#1A1A1A]">
                            {(item.price * item.quantity).toLocaleString(
                              "ar-EG",
                            )}{" "}
                            ج.م
                          </p>
                        </div>

                        {/* CSS Barcode */}
                        <div className="w-full mt-3 flex items-end justify-center gap-[1px] opacity-70 h-12 relative z-10">
                          {barcodeLines.map((line, i) => (
                            <div
                              key={i}
                              className="bg-[#1A1A1A]"
                              style={{
                                width: `${line.width}px`,
                                height: `${line.height}%`,
                              }}
                            />
                          ))}
                        </div>
                        <p className="font-mono text-[6px] tracking-widest mt-1 text-[#8B7E66] relative z-10">
                          {item.productId.substring(0, 8).toUpperCase()}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Render selected free poster item if present (either Eid offer or poster offer) */}
                {(settings?.free_poster_offer_enabled || settings?.eid_offer_enabled) && selectedFreePoster && (() => {
                  const imageUrl = selectedFreePoster.images?.main || selectedFreePoster.image_main || "";
                  const barcodeLines = Array.from({ length: 18 }).map(
                    (_, i) => {
                      const hash = selectedFreePoster.title.charCodeAt(i % selectedFreePoster.title.length) || 50;
                      return {
                        width: (hash % 3) + 1,
                        height: 50 + (hash % 50),
                      };
                    },
                  );
                  return (
                    <div
                      key="free-poster-ticket"
                      className="relative flex w-full overflow-hidden rounded-xl bg-[#f0fbf6] border-2 border-emerald-500/30 text-[#2C2C2C] shadow-sm animate-pulse"
                    >
                      {/* Left section (Main Ticket) */}
                      <div className="flex-1 p-4 border-r-2 border-dashed border-emerald-300 relative flex flex-col justify-between overflow-hidden">
                        {/* Ticket Cutouts */}
                        <div className="absolute -top-3 -right-3 h-6 w-6 rounded-full bg-[#f0fbf6] border border-[#a7f3d0] shadow-inner" />
                        <div className="absolute -bottom-3 -right-3 h-6 w-6 rounded-full bg-[#f0fbf6] border border-[#a7f3d0] shadow-inner" />

                        {/* Subtle Paper Texture Overlay */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />

                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[8px] font-black tracking-[0.2em] text-[#047857] uppercase flex items-center gap-1">
                              🎁 FREE GIFT / هدية مجانية
                            </span>
                            <span className="text-[8px] font-black tracking-[0.2em] text-[#047857] uppercase">
                              Qty 1
                            </span>
                          </div>

                          <div className="flex gap-3">
                            {/* Small Image "Stamp" / "Poster" */}
                            <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-md bg-[#1a1a1a] shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] flex items-center justify-center p-1.5 transform -rotate-0 border-none">
                              {/* Spotlight effect */}
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[150%] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/30 via-transparent to-transparent opacity-80 z-0"></div>

                              <div className="relative z-10 w-full h-full bg-black border border-[#111] shadow-[0_4px_10px_rgba(0,0,0,0.9)] overflow-hidden">
                                <div className="absolute inset-0 border border-white/5 z-20 pointer-events-none"></div>
                                {imageUrl ? (
                                  <img
                                    src={getImageUrl(imageUrl, 'w200')}
                                    alt={selectedFreePoster.title}
                                    className="h-full w-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-zinc-700">
                                    <Film className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-brand text-sm font-black uppercase leading-tight mb-0.5 tracking-tight line-clamp-1 text-emerald-900">
                                {selectedFreePoster.title}
                              </h3>
                              <p className="text-[8px] text-[#047857] uppercase tracking-widest mb-2">
                                FREE CINEMATIC POSTER
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="relative z-10 flex justify-between items-end mt-2">
                          <div className="flex gap-3">
                            <div>
                              <p className="text-[8px] text-[#047857] uppercase tracking-widest mb-0.5">
                                Size / المقاس
                              </p>
                              <p className="font-mono text-xs font-black text-emerald-800">
                                Standard (20x30)
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-[8px] text-[#047857] uppercase tracking-widest mb-0.5">
                              Offer / العرض
                            </p>
                            <p className="font-mono text-[9px] font-black text-emerald-600">
                              {settings?.eid_offer_enabled ? "العيد الكبير 🌙" : "Free Poster 🎁"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right section (Stub) */}
                      <div className="w-24 bg-[#e6fbf1] p-3 flex flex-col justify-between items-center relative overflow-hidden">
                        {/* Subtle Paper Texture Overlay */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />

                        <div className="text-center w-full relative z-10">
                          <p className="text-[8px] font-black tracking-widest text-[#047857] uppercase mb-1">
                            Price / السعر
                          </p>
                          <p className="font-brand text-sm font-black text-[#047857]">
                            مجاني
                          </p>
                        </div>

                        {/* CSS Barcode */}
                        <div className="w-full mt-3 flex items-end justify-center gap-[1px] opacity-70 h-12 relative z-10">
                          {barcodeLines.map((line, i) => (
                            <div
                              key={i}
                              className="bg-[#047857]"
                              style={{
                                width: `${line.width}px`,
                                height: `${line.height}%`,
                              }}
                            />
                          ))}
                        </div>
                        <p className="font-mono text-[5px] tracking-widest mt-1 text-[#047857] relative z-10 font-bold">
                          FREEGIFT
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>

            {/* Coupon Code Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-[2.5rem] border border-brand-dark/5 bg-white p-8 shadow-2xl shadow-black/20"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/20 text-brand-dark">
                  <Tag className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black uppercase tracking-widest text-brand-dark">
                  كود الخصم
                </h2>
              </div>

              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-brand-primary/10 border border-brand-primary/20 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-brand-dark shadow-sm">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-brand-dark uppercase tracking-wider">
                        {appliedCoupon.code}
                      </p>
                      <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">
                        تم تفعيل الخصم بنجاح
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-brand-dark/40 hover:text-red-500 transition-colors p-2 bg-white rounded-full shadow-sm"
                    title="إزالة الكود"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) =>
                      setCouponCode(e.target.value.toUpperCase())
                    }
                    placeholder="أدخل كود الخصم هنا"
                    className="flex-1 rounded-2xl border-2 border-brand-dark/5 bg-brand-card px-5 py-4 text-sm font-bold text-brand-dark uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal focus:border-brand-primary focus:bg-brand-card focus:outline-none transition-all shadow-inner w-full"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim() || isValidatingCoupon}
                    className="flex items-center justify-center rounded-2xl bg-brand-dark px-8 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-brand-primary hover:text-brand-dark disabled:opacity-50 shadow-lg w-full sm:w-auto"
                  >
                    {isValidatingCoupon ? (
                      <CinematicLoader size="sm" />
                    ) : (
                      "تفعيل"
                    )}
                  </button>
                </div>
              )}
            </motion.div>

            {/* Totals Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-[2.5rem] border border-brand-dark/5 bg-white p-10 shadow-2xl shadow-black/20"
            >
              <div className="space-y-5 mb-10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-dark/40">
                    Subtotal
                  </span>
                  <span className="text-base font-black text-brand-dark">
                    {totalPrice.toLocaleString("ar-EG")} ج.م
                  </span>
                </div>

                {discountAmount > 0 && appliedCoupon && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex items-center justify-between text-brand-primary"
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                      Discount ({appliedCoupon.code})
                    </span>
                    <span className="text-base font-black">
                      -{discountAmount.toLocaleString("ar-EG")} ج.م
                    </span>
                  </motion.div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-dark/40">
                    Shipping
                  </span>
                  <span
                    className={`text-base font-black ${isFreeShipping ? "text-brand-primary" : "text-brand-dark"}`}
                  >
                    {isFreeShipping
                      ? "FREE"
                      : `${shippingCost.toLocaleString("ar-EG")} ج.م`}
                  </span>
                </div>

                <div className="pt-8 mt-4 border-t-2 border-brand-dark/5">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-dark/30 mb-2">
                        Total Payable
                      </p>
                      <p className="font-brand text-5xl font-black text-brand-dark italic leading-none">
                        {finalTotal.toLocaleString("ar-EG")}{" "}
                        <span className="text-xl not-italic text-brand-primary">
                          ج.م
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                form="checkout-form"
                type="submit"
                disabled={
                  isSubmitting || items.length === 0 || !formData.governorate
                }
                className="group relative flex w-full items-center justify-center gap-4 overflow-hidden rounded-2xl bg-brand-primary py-7 text-sm font-black uppercase tracking-[0.4em] text-brand-dark transition-all hover:bg-brand-primary hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-2xl shadow-brand-primary/20"
              >
                <div className="absolute inset-0 bg-brand-dark/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                {isSubmitting ? (
                  <CinematicLoader size="sm" />
                ) : (
                  <>
                    <span>Confirm Order</span>
                    <CheckCircle2 className="h-6 w-6" />
                  </>
                )}
              </button>

              <div className="mt-4 rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 text-center">
                <p className="text-xs font-bold text-amber-800 leading-relaxed max-w-sm mx-auto flex items-center justify-center gap-1.5" style={{ direction: "rtl" }}>
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>تنبيه: سيطلب منكم دفع ديبوزيت بقيمة <span className="font-extrabold text-[#d97706] text-sm">150 جنيه</span> لإثبات الجدية وتأكيد الأوردر بعد تقديم الطلب.</span>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
