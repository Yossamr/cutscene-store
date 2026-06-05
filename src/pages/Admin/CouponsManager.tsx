
import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Ticket, Plus, Loader2, Trash2, CheckCircle2, XCircle, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";

interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed' | 'free_shipping' | 'b2g1';
  discountValue: number;
  minPurchase: number;
  isActive: boolean;
  expiryDate: string;
  createdAt: string;
}

export function CouponsManager() {
  const { token } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  
  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState<'percentage' | 'fixed' | 'free_shipping' | 'b2g1'>('percentage');
  const [newValue, setNewValue] = useState(0);
  const [newMinPurchase, setNewMinPurchase] = useState(0);
  const [newExpiry, setNewExpiry] = useState("");

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const data = await apiFetch("/api/admin/coupons");
      const mappedCoupons = data.map((c: any) => ({
        id: c.id,
        code: c.code,
        discountType: c.discount_type,
        discountValue: c.discount_value,
        minPurchase: c.min_purchase,
        isActive: c.is_active === 1 || c.is_active === true,
        expiryDate: c.expiry_date,
        createdAt: c.created_at
      }));
      setCoupons(mappedCoupons);
    } catch (error: any) {
      toast.error(error.message || "Failed to load cheat codes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    setIsToggling(id);
    try {
      await apiFetch(`/api/admin/coupons/${id}/toggle`, {
        method: "PUT"
      });
      
      toast.success("Status updated");
      fetchCoupons();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsToggling(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      await apiFetch("/api/admin/coupons", {
        method: "POST",
        body: {
          code: newCode.toUpperCase(),
          discountType: newType,
          discountValue: newValue,
          minPurchase: newMinPurchase,
          expiryDate: newExpiry ? new Date(newExpiry).toISOString() : undefined,
        },
      });

      toast.success("Cheat code generated successfully!");
      setNewCode("");
      setNewType('percentage');
      setNewValue(0);
      setNewMinPurchase(0);
      setNewExpiry("");
      fetchCoupons();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to disable this cheat code?")) return;
    
    setIsDeleting(id);
    try {
      await apiFetch(`/api/admin/coupons/${id}`, {
        method: "DELETE"
      });

      toast.success("Cheat code deactivated");
      fetchCoupons();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="font-brand text-3xl font-black uppercase tracking-tighter text-brand-dark italic flex items-center gap-3">
          <Zap className="h-8 w-8 text-brand-primary" />
          Cheat Codes
        </h1>
        <p className="text-xs text-brand-dark/60 uppercase tracking-[0.2em] mt-1">Promotional Discounts & Special Access</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Create Form */}
        <div className="lg:col-span-1">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm sticky top-28">
            <h2 className="mb-8 flex items-center gap-2 font-brand text-xl font-black uppercase tracking-wider text-brand-dark italic">
              <Plus className="h-5 w-5 text-brand-primary" />
              New Code
            </h2>
            
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-dark/60">Code</label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-brand-dark placeholder:text-brand-dark/50 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 focus:outline-none transition-all uppercase font-mono"
                  placeholder="e.g. GAMER20"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-dark/60">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-brand-dark focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 focus:outline-none transition-all"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (EGP)</option>
                  <option value="free_shipping">Free Shipping</option>
                  <option value="b2g1">Buy 2 Get 1 Free</option>
                </select>
              </div>

              {(newType === 'percentage' || newType === 'fixed') && (
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-dark/60">
                    {newType === 'percentage' ? 'Discount (%)' : 'Discount (EGP)'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newValue}
                    onChange={(e) => setNewValue(Number(e.target.value))}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-brand-dark placeholder:text-brand-dark/50 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 focus:outline-none transition-all font-mono"
                  />
                </div>
              )}

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-dark/60">Min Purchase (EGP)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newMinPurchase}
                  onChange={(e) => setNewMinPurchase(Number(e.target.value))}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-brand-dark placeholder:text-brand-dark/50 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 focus:outline-none transition-all font-mono"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-dark/60">Expiry Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={newExpiry}
                  onChange={(e) => setNewExpiry(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-brand-dark placeholder:text-brand-dark/50 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-primary py-4 text-xs font-black uppercase tracking-widest text-brand-dark transition-all hover:bg-brand-light disabled:opacity-50 shadow-[0_0_20px_rgba(58,134,255,0.2)]"
              >
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {isCreating ? "Generating..." : "Generate Code"}
              </button>
            </form>
          </div>
        </div>

        {/* Coupons List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-brand-dark/60">Active Archives</h3>
              <div className="flex gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-brand-primary"></div>
                <div className="h-1.5 w-1.5 rounded-full bg-gray-300"></div>
              </div>
            </div>
            
            <div className="divide-y divide-gray-100">
              {coupons.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Ticket className="mb-4 h-12 w-12 text-brand-dark/40" />
                  <h3 className="text-lg font-bold text-brand-dark/60 uppercase tracking-widest">No Cheat Codes</h3>
                  <p className="text-xs text-brand-dark/50 uppercase tracking-widest mt-2">Generate your first promotional code to get started.</p>
                </div>
              ) : (
                coupons.map((coupon) => (
                  <motion.div
                    key={coupon.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-8 hover:bg-gray-50 transition-all group"
                  >
                    <div className="flex items-center gap-6">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 border border-gray-200 group-hover:border-brand-primary/30 transition-all">
                        <Ticket className="h-6 w-6 text-brand-dark/50 group-hover:text-brand-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-4">
                          <h3 className="font-mono text-2xl font-black text-brand-dark tracking-tighter uppercase">{coupon.code}</h3>
                          <button 
                            onClick={() => handleToggleStatus(coupon.id)}
                            disabled={isToggling === coupon.id}
                            className={cn(
                              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest border transition-all hover:scale-105 active:scale-95 disabled:opacity-50",
                              coupon.isActive 
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]" 
                                : "bg-brand-dark/40/10 text-brand-dark/60 border-brand-dark/40/20"
                            )}
                          >
                            {isToggling === coupon.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              coupon.isActive ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />
                            )}
                            {coupon.isActive ? "Active" : "Inactive"}
                          </button>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs font-black uppercase tracking-widest text-brand-dark/60">
                          <span className="text-brand-primary">
                            {coupon.discountType === 'percentage' && `${coupon.discountValue}% OFF`}
                            {coupon.discountType === 'fixed' && `${coupon.discountValue} EGP OFF`}
                            {coupon.discountType === 'free_shipping' && `FREE SHIPPING`}
                            {coupon.discountType === 'b2g1' && `BUY 2 GET 1 FREE`}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-gray-300" />
                          <span>Min: {coupon.minPurchase} EGP</span>
                          <span className="h-1 w-1 rounded-full bg-gray-300" />
                          <span>Created: {new Date(coupon.createdAt).toLocaleDateString()}</span>
                          {coupon.expiryDate && (
                            <>
                              <span className="h-1 w-1 rounded-full bg-gray-300" />
                              <span className="text-brand-dark/50">Expires: {new Date(coupon.expiryDate).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(coupon.id)}
                      disabled={isDeleting === coupon.id}
                      className="p-4 rounded-2xl text-brand-dark/80 hover:text-brand-primary hover:bg-brand-primary/10 transition-all disabled:opacity-50"
                    >
                      {isDeleting === coupon.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
