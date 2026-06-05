
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Loader2, Film, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { getDirectDriveLink } from "../../lib/utils";
import { CinematicLoader } from "../../components/CinematicLoader";

interface OrderItem {
  product: {
    _id: string;
    title: string;
    images: { main: string };
  };
  size: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  items: OrderItem[];
  totalAmount: number;
  promoCode?: string;
  discountPercentage?: number;
  status: string;
  createdAt: string;
  barcodeUrl: string;
}

export function ViewingHistory() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await apiFetch("/api/orders/my-orders");
        setOrders(data);
      } catch (error) {
        console.error("Failed to fetch orders", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchOrders();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <CinematicLoader size="lg" label="Retrieving Archive" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl py-12">
      <div className="mb-12 text-center">
        <h1 className="font-brand text-4xl font-black uppercase tracking-widest text-brand-dark italic">Viewing History</h1>
        <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-brand-dark/60">Your past admissions</p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-12">
          <Film className="h-16 w-16 text-brand-dark/90 mb-4" />
          <p className="text-brand-dark/60 font-black uppercase tracking-widest text-[10px]">You haven't purchased any tickets yet.</p>
          <Link to="/box-office" className="mt-6 text-brand-primary hover:text-brand-dark font-black uppercase tracking-widest text-[10px]">
            Browse Box Office
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => (
            <div key={order._id} className="relative overflow-hidden rounded-2xl bg-white text-brand-dark shadow-sm border border-gray-100">
              {/* Ticket Top Perforation */}
              <div className="absolute left-0 right-0 top-0 flex justify-between px-2 -translate-y-1/2">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div key={`top-${i}`} className="h-4 w-4 rounded-full bg-brand-bg" />
                ))}
              </div>

              <div className="flex flex-col md:flex-row">
                {/* Main Ticket Area */}
                <div className="flex-1 p-8 pt-10">
                  <div className="mb-6 flex items-center justify-between border-b-2 border-dashed border-brand-dark/20 pb-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-dark/60">Order Date</p>
                      <h3 className="font-mono font-black text-lg">{new Date(order.createdAt).toLocaleDateString()}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-dark/60">Status</p>
                      <span className="inline-block rounded-full bg-brand-card px-3 py-1 text-[10px] font-black uppercase tracking-widest text-brand-dark">
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <img 
                          src={getDirectDriveLink(item.product?.images?.main || "https://picsum.photos/seed/hoodie/100/150")} 
                          alt={item.product?.title || "Product"} 
                          className="h-16 w-12 rounded object-cover shadow-sm" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1">
                          <h4 className="font-black uppercase tracking-wide text-[10px]">{item.product?.title || "Unknown Product"}</h4>
                          <p className="text-[10px] text-brand-dark/60 font-black uppercase tracking-widest">Size: {item.size} | Qty: {item.quantity}</p>
                        </div>
                        <div className="font-mono font-black">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ticket Stub Area */}
                <div className="relative border-t-2 border-dashed border-brand-dark/20 bg-gray-50 p-8 md:w-64 md:border-l-2 md:border-t-0 flex flex-col justify-center">
                  {/* Side cutouts for desktop */}
                  <div className="absolute -left-4 top-1/2 hidden h-8 w-8 -translate-y-1/2 rounded-full bg-brand-bg md:block" />
                  <div className="absolute -right-4 top-1/2 hidden h-8 w-8 -translate-y-1/2 rounded-full bg-brand-bg md:block" />
                  
                  {/* Side cutouts for mobile */}
                  <div className="absolute -left-4 -top-4 h-8 w-8 rounded-full bg-brand-bg md:hidden" />
                  <div className="absolute -right-4 -top-4 h-8 w-8 rounded-full bg-brand-bg md:hidden" />

                  <div className="text-center mb-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-dark/60 mb-1">Total Amount</p>
                    <p className="font-mono text-3xl font-black text-brand-primary">${order.totalAmount.toFixed(2)}</p>
                    {order.promoCode && (
                      <div className="mt-2 flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand-primary">
                        <Ticket className="h-3 w-3" />
                        {order.promoCode} (-{order.discountPercentage}%)
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center opacity-60">
                    <div className="flex h-12 w-full items-center justify-between gap-1">
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div key={`bc-${i}`} className="h-full bg-brand-dark" style={{ width: `${Math.max(1, Math.random() * 4)}px` }} />
                      ))}
                    </div>
                    <p className="mt-2 font-mono text-[10px] tracking-[0.2em] text-brand-dark/60 font-black">
                      {order.barcodeUrl}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ticket Bottom Perforation */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 translate-y-1/2">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div key={`bottom-${i}`} className="h-4 w-4 rounded-full bg-brand-bg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
