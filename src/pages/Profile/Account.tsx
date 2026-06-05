import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Zap, User as UserIcon, Package, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { apiFetch } from "../../lib/api";
import toast from "react-hot-toast";
import { motion } from "motion/react";
import { cn, getDirectDriveLink } from "../../lib/utils";

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: any[];
}

export function Account() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await apiFetch("/api/orders/my-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    
    setCancellingId(orderId);
    try {
      await apiFetch(`/api/orders/${orderId}/cancel`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success("Order cancelled successfully");
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: "Cancelled" } : o));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "processing": return <Clock size={14} className="text-yellow-500" />;
      case "shipped": return <Package size={14} className="text-blue-500" />;
      case "delivered": return <CheckCircle size={14} className="text-emerald-500" />;
      case "cancelled": return <XCircle size={14} className="text-red-500" />;
      default: return <Package size={14} className="text-brand-dark/60" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12 pb-24">
      <h1 className="font-brand text-4xl font-black uppercase tracking-tighter text-brand-dark">My Account</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-brand-primary/10 rounded-full text-brand-primary">
              <UserIcon size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-dark">{user?.name}</h2>
              <p className="text-brand-dark/60">{user?.phone}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-brand-primary/20 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap size={120} className="text-brand-primary" />
          </div>
          <h2 className="text-xl font-bold text-brand-dark mb-2">Box Office Points</h2>
          <p className="text-brand-dark/60 mb-6">Redeem points for exclusive cinematic rewards.</p>
          <div className="text-5xl font-black text-brand-primary">
            {user?.points || 0}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-brand-dark flex items-center gap-3">
          <Package className="text-brand-primary" />
          Order History
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-brand-primary" size={32} />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-gray-50 rounded-3xl p-12 text-center border border-dashed border-gray-200">
            <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-brand-dark/60 font-medium">You haven't placed any orders yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-brand-primary/20 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-black text-brand-dark uppercase tracking-tighter">
                        #{order.id.slice(-10).toUpperCase()}
                      </span>
                      <div className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest border",
                        order.status.toLowerCase() === 'delivered' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        order.status.toLowerCase() === 'cancelled' ? "bg-red-50 text-red-600 border-red-100" :
                        "bg-yellow-50 text-yellow-600 border-yellow-100"
                      )}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </div>
                    </div>
                    <p className="text-xs text-brand-dark/50">
                      Placed on {new Date(order.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest text-brand-dark/50 font-black">Total</p>
                      <p className="font-mono font-black text-brand-dark">{order.total_amount.toLocaleString('ar-EG')} ج.م</p>
                    </div>

                    {order.status.toLowerCase() === 'processing' && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancellingId === order.id}
                        className="px-4 py-2 rounded-2xl bg-red-50 text-red-600 text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all disabled:opacity-50"
                      >
                        {cancellingId === order.id ? "Cancelling..." : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
                
                {order.items && order.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="space-y-3">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="h-10 w-10 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shrink-0">
                            <img 
                              src={getDirectDriveLink(item.product?.images?.main)} 
                              alt="" 
                              className="h-full w-full object-cover" 
                              referrerPolicy="no-referrer" 
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-brand-dark line-clamp-1">{item.product?.title} ({item.size}{item.color ? `, ${item.color}` : ''}) x{item.quantity}</span>
                            {item.custom_text && (
                              <span className="text-xs text-brand-primary font-bold italic">"Credit Roll": {item.custom_text}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
