
import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Package, Truck, CheckCircle, Clock, Search, Loader2, Ticket, ShoppingBag, Barcode, Trash2, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { cn, getImageUrl } from "../../lib/utils";

interface Order {
  id: string; // SQLite uses id, not _id
  user: { name: string; phone: string; email?: string };
  items: { product: { id?: string; productId?: string; title: string; images: { main: string } }; size: string; color?: string; quantity: number; price: number; custom_text?: string }[];
  total_amount: number;
  promo_code?: string;
  discount_percentage?: number;
  status: string;
  created_at: string;
  barcode_url: string;
  address: string;
  city: string;
  governorate: string;
}

export function AdminOrders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await apiFetch("/api/admin/orders");
      setOrders(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    const loadingToast = toast.loading(`Updating to ${newStatus}...`);
    try {
      await apiFetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        body: { status: newStatus },
      });

      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      toast.success(`Order status updated to ${newStatus}!`, { id: loadingToast });
    } catch (err: any) {
      toast.error(err.message || "Failed to update status", { id: loadingToast });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to completely delete this order? This action cannot be undone.")) {
      return;
    }
    
    setUpdatingId(orderId);
    const loadingToast = toast.loading("Deleting order...");
    try {
      await apiFetch(`/api/admin/orders/${orderId}`, {
        method: "DELETE",
      });

      setOrders(orders.filter(order => order.id !== orderId));
      toast.success("Order deleted successfully!", { id: loadingToast });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete order", { id: loadingToast });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleWhatsAppConfirm = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    const phone = order.user?.phone?.replace(/\D/g, '');
    if (!phone) {
      toast.error("No phone number available for this order.");
      return;
    }

    const itemsList = order.items.map(item => 
      `- *${item.product.title}* (Size: ${item.size}${item.color ? `, Color: ${item.color}` : ''}, Qty: ${item.quantity})\nLink: ${window.location.origin}/product/${item.product.id || item.product.productId}`
    ).join('\n\n');

    const message = `Hello ${order.user?.name || ''},
Thank you for your order from Cutscene Store 🎬

*Order number:* #${order.id.slice(-10).toUpperCase()}

*Items:*
${itemsList}

*Subtotal:* ${order.total_amount.toLocaleString('en-US')} EGP

*Address:* ${order.address}
*City:* ${order.city}, ${order.governorate}

حابين نأكد مع حضرتك الأوردر 🎬
لو حابب نعتمد الطلب، أو لو في أي تعديل أو إلغاء، إحنا معاك وتحت أمرك!`;

    const encodedMessage = encodeURIComponent(message);
    let formattedPhone = phone;
    if (phone.startsWith('01') && phone.length === 11) {
      formattedPhone = `2${phone}`;
    }

    window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "processing": return <Clock className="h-4 w-4 text-yellow-500" />;
      case "shipped": return <Truck className="h-4 w-4 text-blue-500" />;
      case "delivered": return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "cancelled": return <Package className="h-4 w-4 text-red-500" />;
      default: return <Package className="h-4 w-4 text-brand-dark/60" />;
    }
  };

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.user?.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.governorate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-brand text-3xl font-black uppercase tracking-tighter text-brand-dark italic flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-brand-primary" />
            Box Office Receipts
          </h1>
          <p className="text-xs text-brand-dark/60 uppercase tracking-[0.2em] mt-1">Order Fulfillment & Tracking</p>
        </div>
        
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-dark/60" />
          <input
            type="text"
            placeholder="Search by ID, Name, Phone or Address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm text-brand-dark placeholder:text-brand-dark/60 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 focus:outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest text-brand-dark/60">Transaction Logs</h3>
          <div className="flex gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-brand-primary"></div>
            <div className="h-1.5 w-1.5 rounded-full bg-brand-dark/20"></div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-brand-dark/70">
            <thead className="bg-white text-xs uppercase tracking-[0.2em] text-brand-dark/60 border-b border-gray-100">
              <tr>
                <th className="px-8 py-6 font-black">Order ID / Date</th>
                <th className="px-8 py-6 font-black">Customer / Shipping</th>
                <th className="px-8 py-6 font-black text-center">Items</th>
                <th className="px-8 py-6 font-black">Total Amount</th>
                <th className="px-8 py-6 font-black">Status</th>
                <th className="px-8 py-6 font-black text-right">Controller</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-brand-dark/60 italic">
                    No receipts found in the archives.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <motion.tr 
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-all duration-300 group cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-white border border-gray-200 group-hover:border-brand-primary/30 transition-all shadow-sm">
                          <Barcode className="h-5 w-5 text-brand-dark/60 group-hover:text-brand-primary" />
                        </div>
                        <div>
                          <div className="font-mono text-xs font-black text-brand-dark tracking-tighter uppercase">
                            #{order.id.slice(-10).toUpperCase()}
                          </div>
                          <div className="text-[10px] text-brand-dark/60 uppercase tracking-widest mt-0.5">
                            {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-bold text-brand-dark uppercase tracking-tight">{order.user?.name || "Anonymous"}</div>
                      <div className="text-[10px] text-brand-dark/60 font-mono mb-1">{order.user?.phone || "NO_CONTACT"}</div>
                      <div className="text-[10px] text-brand-dark/50 leading-tight max-w-[200px]">
                        {order.address}, {order.city}, {order.governorate}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <a 
                              href={`/product/${item.product.id}`} 
                              onClick={(e) => e.stopPropagation()}
                              className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md bg-[#1a1a1a] shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] flex items-center justify-center p-1.5 transform -rotate-0 border-none hover:border-brand-primary transition-all block"
                            >
                              {/* Spotlight effect */}
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[150%] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/30 via-transparent to-transparent opacity-80 z-0 pointer-events-none"></div>

                              <div className="relative z-10 w-full h-full bg-black border border-[#111] shadow-[0_4px_10px_rgba(0,0,0,0.9)] overflow-hidden">
                                <div className="absolute inset-0 border border-white/5 z-20 pointer-events-none"></div>
                                <img 
                                  src={getImageUrl(item.product?.images?.main)} 
                                  alt="" 
                                  className="h-full w-full object-cover" 
                                  referrerPolicy="no-referrer" 
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://via.placeholder.com/64?text=No+Image';
                                  }}
                                />
                              </div>
                            </a>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-brand-dark line-clamp-1">
                                {item.product?.title} ({item.size}{item.color ? `, ${item.color}` : ''}) x{item.quantity}
                              </span>
                              {item.custom_text && (
                                <span className="text-[10px] text-brand-primary font-bold italic">"Credit Roll": {item.custom_text}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-mono font-black text-brand-dark text-base">
                        {order.total_amount.toLocaleString('ar-EG')} ج.م
                      </div>
                      {order.promo_code && (
                        <div className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1 uppercase tracking-widest">
                          <Ticket className="h-3 w-3" />
                          {order.promo_code}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className={cn(
                        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest border",
                        order.status.toLowerCase() === 'delivered' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                        order.status.toLowerCase() === 'shipped' ? "bg-blue-50 text-blue-600 border-blue-200" :
                        order.status.toLowerCase() === 'cancelled' ? "bg-red-50 text-red-600 border-red-200" :
                        "bg-yellow-50 text-yellow-600 border-yellow-200"
                      )}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => handleWhatsAppConfirm(order, e)}
                          className="p-2 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all shadow-sm"
                          title="Confirm via WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>

                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                          disabled={updatingId === order.id}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-brand-dark outline-none focus:border-brand-primary transition-all cursor-pointer hover:bg-gray-50 shadow-sm"
                        >
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        
                        <button
                          onClick={(e) => handleDeleteOrder(order.id, e)}
                          disabled={updatingId === order.id}
                          className="p-2 rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition-all shadow-sm"
                          title="Delete Order"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-black uppercase tracking-widest text-brand-dark mb-6">Order Details</h2>
            <div className="space-y-4">
              <p><strong>Order ID:</strong> #{selectedOrder.id.slice(-10).toUpperCase()}</p>
              <p><strong>Customer:</strong> {selectedOrder.user?.name}</p>
              <p><strong>Phone:</strong> {selectedOrder.user?.phone}</p>
              <p><strong>Address:</strong> {selectedOrder.address}, {selectedOrder.city}, {selectedOrder.governorate}</p>
              <div className="border-t border-gray-100 pt-4">
                <h4 className="font-bold mb-2">Items:</h4>
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 mb-2">
                    <a 
                      href={`/product/${item.product.id}`} 
                      className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md bg-[#1a1a1a] shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] flex items-center justify-center p-1.5 transform -rotate-0 border-none hover:border-brand-primary transition-all block"
                    >
                      {/* Spotlight effect */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[150%] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/30 via-transparent to-transparent opacity-80 z-0 pointer-events-none"></div>

                      <div className="relative z-10 w-full h-full bg-black border border-[#111] shadow-[0_4px_10px_rgba(0,0,0,0.9)] overflow-hidden">
                        <div className="absolute inset-0 border border-white/5 z-20 pointer-events-none"></div>
                        <img 
                          src={getImageUrl(item.product?.images?.main)} 
                          alt="" 
                          className="h-full w-full object-cover" 
                          referrerPolicy="no-referrer" 
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/64?text=No+Image';
                          }}
                        />
                      </div>
                    </a>
                    <div>
                      <p className="font-bold">{item.product?.title}</p>
                      <p className="text-sm">Size: {item.size}{item.color ? `, Color: ${item.color}` : ''}, Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setSelectedOrder(null)} className="mt-8 w-full rounded-2xl bg-brand-primary py-3 font-bold text-white">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
