import { useLocation, Link, Navigate } from "react-router-dom";
import { Ticket, CheckCircle2, Instagram, Youtube, Play, ArrowLeft, Trophy } from "lucide-react";
import toast from 'react-hot-toast';
import { trackEvent } from "../lib/analytics";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export function OrderSuccess() {
  const location = useLocation();
  const order = location.state?.order;
  const { user } = useAuth();

  useEffect(() => {
    if (order?.id) {
      const orderItems = Array.isArray(order.items) ? order.items : [];
      const totalAmount = typeof order.totalAmount === 'number' ? order.totalAmount : 0;
      
      const gaItems = orderItems.map((item: any) => ({
        id: item.productId || item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        category: item.category || 'Apparel'
      }));

      // If a free poster was attached/recorded on the order
      if (order.freePoster) {
        gaItems.push({
          id: order.freePoster.id,
          title: `🎁 ${order.freePoster.title} (Gift)`,
          price: 0,
          quantity: 1,
          category: 'Gift / Poster'
        });
      }

      trackEvent('order_completed', order.id, user?.id, {
        items: gaItems,
        value: totalAmount,
        transaction_id: order.id
      });
    }
  }, [order?.id, user?.id, order]);

  if (!order) {
    return <Navigate to="/" replace />;
  }

  const orderId = typeof order.id === 'string' ? order.id.slice(-6).toUpperCase() : 'N/A';
  const items = Array.isArray(order.items) ? order.items : [];
  const totalAmount = typeof order.totalAmount === 'number' ? order.totalAmount : 0;
  const discountAmount = typeof order.discountAmount === 'number' ? order.discountAmount : 0;

  return (
    <div className="mx-auto max-w-2xl py-8 flex flex-col items-center px-4">
      <div className="mb-6 flex flex-col items-center text-center">
        <CheckCircle2 className="mb-4 h-12 w-12 text-brand-primary" />
        <h1 className="font-brand text-2xl font-black uppercase tracking-widest text-brand-dark italic">
          تم بنجاح!
        </h1>
        <p className="mt-2 text-brand-dark/60 uppercase tracking-widest text-[9px] font-black">لقد تم استلام طلبك بنجاح.</p>
      </div>

      {/* Join the Community Section */}
      <div className="w-full mb-8 bg-gradient-to-br from-[#0c1216] to-brand-dark rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden border border-brand-primary/20">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-4 bg-brand-primary/20 p-3 rounded-2xl rotate-3">
             <Trophy className="h-8 w-8 text-brand-primary" />
          </div>
          <h2 className="font-brand text-2xl font-black uppercase tracking-tight italic mb-2 text-white text-center">
             <span className="text-brand-primary">مبروك!</span> انضم لعيلتنا 🎉
          </h2>
          <p className="text-[12px] text-white/70 mb-8 font-bold text-center max-w-[280px]">تابعنا عشان تشوف أحدث الكواليس والخصومات الحصرية اللي بننزلها بس لمتابعينا!</p>
          
          <div className="grid grid-cols-2 gap-4 w-full mb-8">
            <a 
              href="https://www.instagram.com/cutscenebrand" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-3 bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 hover:border-transparent transition-all group active:scale-95"
            >
              <Instagram className="h-7 w-7 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-black uppercase tracking-widest">Instagram</span>
            </a>
            <a 
              href="https://www.tiktok.com/@cutscene.brand" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-3 bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-black hover:border-white/30 transition-all group active:scale-95"
            >
              <svg 
                viewBox="0 0 24 24" 
                className="h-7 w-7 fill-current group-hover:scale-110 transition-transform"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.08.33-.54.31-.99.77-1.32 1.31-.35.59-.53 1.25-.5 1.94.01.68.22 1.35.59 1.92.4.6.96 1.1 1.6 1.44.51.27 1.06.44 1.63.5.54.06 1.09.01 1.62-.12.53-.13 1.03-.36 1.48-.68.58-.38 1.03-.9 1.34-1.52.37-.7.54-1.49.53-2.28.02-4.14-.01-8.28.02-12.41z"/>
              </svg>
              <span className="text-[11px] font-black uppercase tracking-widest">TikTok</span>
            </a>
          </div>

          {/* YouTube Section */}
          <div className="w-full bg-black/60 rounded-2xl overflow-hidden border border-white/10 shadow-inner">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="bg-red-600 p-1.5 rounded-lg">
                  <Youtube className="h-5 w-5 text-white" />
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] font-black uppercase tracking-tighter">YouTube Channel</span>
                   <span className="text-[8px] text-white/40 uppercase font-bold">@clacket01</span>
                </div>
              </div>
              <a 
                href="https://www.youtube.com/@clacket01" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[9px] font-black bg-red-600 px-4 py-2 rounded-xl text-white hover:bg-red-700 transition-colors shadow-lg active:scale-95"
              >
                SUBSCRIBE
              </a>
            </div>
            <div className="aspect-video relative group">
              <iframe 
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/t6cj4XTIQbE?start=60" 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </div>

      {/* Digital Receipt Ticket */}
      <div className="relative w-full overflow-hidden rounded-xl bg-white text-brand-dark shadow-xl border border-brand-dark/5">
        <div className="absolute left-0 right-0 top-0 flex justify-between px-1 -translate-y-1/2">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={`top-${i}`} className="h-3 w-3 rounded-full bg-brand-bg" />
          ))}
        </div>

        <div className="p-6 pt-10">
          <div className="mb-6 flex items-center justify-between border-b-2 border-dashed border-brand-dark/10 pb-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-brand-dark/40">إيصال رقمي</p>
              <h2 className="font-brand text-xl font-black uppercase tracking-tight italic">طلب #{orderId}</h2>
            </div>
            <Ticket className="h-8 w-8 text-brand-primary" />
          </div>

          <div className="space-y-3">
            {items.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between text-[9px] font-black uppercase tracking-wide">
                <span>{item.quantity}x {item.title} (مقاس {item.size})</span>
                <span className="font-mono text-emerald-600">
                  {item.price === 0 ? "مجاني 🎁" : `${(item.price * item.quantity).toLocaleString('ar-EG')} ج.م`}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative border-t-2 border-dashed border-brand-dark/10 bg-brand-bg p-6">
          <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-brand-bg" />
          <div className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-brand-bg" />

          <div className="mb-4 flex items-center justify-between">
            <span className="font-black uppercase tracking-widest text-brand-dark/40 text-[9px]">الإجمالي المدفوع</span>
            <span className="font-mono text-2xl font-black text-brand-primary">{totalAmount.toLocaleString('ar-EG')} ج.م</span>
          </div>

          {order.promoCode && (
            <div className="mb-4 flex items-center justify-between text-brand-primary">
              <span className="flex items-center gap-1 font-black uppercase tracking-widest text-[9px]">
                <Ticket className="h-3 w-3" />
                تم تطبيق الخصم ({order.promoCode})
              </span>
              <span className="font-mono font-black text-[9px]">-{discountAmount.toLocaleString('ar-EG')} ج.م</span>
            </div>
          )}

          {/* Real Barcode String */}
          <div className="mt-6 flex flex-col items-center">
            <div className="flex h-12 w-full max-w-[200px] items-center justify-between gap-0.5 opacity-80">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={`bc-${i}`} className="h-full bg-brand-card" style={{ width: `${Math.max(1, Math.random() * 3)}px` }} />
              ))}
            </div>
            <p className="mt-1 text-center font-mono text-[10px] tracking-[0.3em] text-brand-dark/40 font-black">
              {order.barcodeUrl}
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 translate-y-1/2">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={`bottom-${i}`} className="h-3 w-3 rounded-full bg-brand-bg" />
          ))}
        </div>
      </div>

      <Link to="/" className="mt-8 text-[9px] font-black uppercase tracking-widest text-brand-primary hover:text-brand-dark transition-colors">
        العودة للمتجر
      </Link>
    </div>
  );
}
