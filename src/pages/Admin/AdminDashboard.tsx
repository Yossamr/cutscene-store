
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../lib/api";
import { Loader2, AlertTriangle, BarChart3, Users, DollarSign, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis
} from 'recharts';

const COLORS = ['#3a86ff', '#ff006e', '#8338ec', '#ffbe0b', '#fb5607'];

export function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    console.log("Fetching stats...");
    try {
      const data = await apiFetch("/api/admin/stats");
      console.log("Stats data:", data);
      setStats(data);
    } catch (err: any) {
      console.error("Fetch stats error:", err);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetStats = async () => {
    console.log("Resetting stats...");
    if (!confirm("Are you sure you want to reset all analytics data? This cannot be undone.")) return;
    try {
      console.log("Calling apiFetch for reset...");
      const responseData = await apiFetch("/api/admin/stats/reset", {
        method: 'POST'
      });
      console.log("Reset stats response data:", responseData);
      toast.success("Statistics reset successfully");
      fetchStats();
    } catch (err: any) {
      console.error("Reset stats error:", err);
      toast.error(err.message || "Failed to reset statistics");
    }
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-brand-primary" size={48} /></div>;

  return (
    <div className="p-8 space-y-8 bg-zinc-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-brand-dark">Cinematic Analytics</h1>
          <p className="text-brand-dark/60 font-medium">Performance metrics and audience insights</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleResetStats}
            className="px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-sm font-bold text-red-600 hover:bg-red-100 transition-colors"
          >
            Reset Stats
          </button>
          <button 
            onClick={fetchStats}
            className="px-4 py-2 bg-white border border-brand-dark/10 rounded-xl text-sm font-bold hover:bg-zinc-50 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>
      
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-brand-dark/5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <Users size={20} />
            </div>
          </div>
          <p className="text-sm font-bold text-brand-dark/60 uppercase tracking-wider">Total Visitors</p>
          <p className="text-3xl font-black text-brand-dark">{stats?.totalVisitors?.toLocaleString() || 0}</p>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-brand-dark/5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <Eye size={20} />
            </div>
          </div>
          <p className="text-sm font-bold text-brand-dark/60 uppercase tracking-wider">Active (5m)</p>
          <p className="text-3xl font-black text-brand-dark">{stats?.activeVisitors?.toLocaleString() || 0}</p>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-brand-dark/5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-sm font-bold text-brand-dark/60 uppercase tracking-wider">Total Revenue</p>
          <p className="text-2xl font-black text-brand-dark">{stats?.totalRevenue?.toLocaleString('ar-EG')} ج.م</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-brand-dark/5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
              <BarChart3 size={20} />
            </div>
          </div>
          <p className="text-sm font-bold text-brand-dark/60 uppercase tracking-wider">Conv. Rate</p>
          <p className="text-3xl font-black text-brand-dark">{stats?.conversionRate || "0%"}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-brand-dark/5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-50 rounded-xl text-red-600">
              <AlertTriangle size={20} />
            </div>
          </div>
          <p className="text-sm font-bold text-brand-dark/60 uppercase tracking-wider">Low Stock</p>
          <p className="text-3xl font-black text-brand-dark">{stats?.lowStockCount || 0}</p>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-brand-dark/5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-50 rounded-xl text-orange-600">
              <AlertTriangle size={20} />
            </div>
          </div>
          <p className="text-sm font-bold text-brand-dark/60 uppercase tracking-wider">Abandoned Carts</p>
          <p className="text-3xl font-black text-brand-dark">{stats?.cartAbandonmentRate || "0%"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Trend Chart */}
        <div className="bg-white p-8 rounded-[2rem] border border-brand-dark/5 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-brand-dark uppercase tracking-tight">Revenue Trend</h2>
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-primary"></div>
                <span className="text-xs font-bold text-brand-dark/60">Daily Revenue</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.revenueByDay || []}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3a86ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3a86ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 12, fontWeight: 600, fill: '#71717a'}}
                  dy={10}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 12, fontWeight: 600, fill: '#71717a'}}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                  formatter={(value: number) => [`${value.toLocaleString('ar-EG')} ج.م`, 'Revenue']}
                  labelFormatter={(label) => {
                    const date = new Date(label);
                    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#3a86ff" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Viewed Products */}
        <div className="bg-white p-8 rounded-[2rem] border border-brand-dark/5 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-brand-dark uppercase tracking-tight">Most Viewed Products</h2>
            <Eye className="text-brand-dark/50" size={20} />
          </div>
          <div className="space-y-6">
            {stats?.topViewedProducts?.map((product: any, index: number) => (
              <div key={index} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-brand-dark/5 flex items-center justify-center text-sm font-black text-brand-dark/60 group-hover:bg-brand-primary group-hover:text-brand-dark transition-colors">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <span className="font-bold text-brand-dark group-hover:text-brand-primary transition-colors">{product.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-brand-dark">{product.views}</span>
                  <span className="text-xs font-bold text-brand-dark/50 uppercase">Views</span>
                </div>
              </div>
            ))}
            {(!stats?.topViewedProducts || stats.topViewedProducts.length === 0) && (
              <div className="text-center py-10 text-brand-dark/50 font-bold">
                No view data collected yet.
              </div>
            )}
          </div>
        </div>

        {/* Popular Genres */}
        <div className="bg-white p-8 rounded-[2rem] border border-brand-dark/5 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-brand-dark uppercase tracking-tight">Popular Genres</h2>
            <BarChart3 className="text-brand-dark/50" size={20} />
          </div>
          {stats?.popularGenres && stats.popularGenres.length > 0 ? (
            <>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.popularGenres}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="views"
                      nameKey="genre"
                    >
                      {stats.popularGenres.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {stats.popularGenres.map((genre: any, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-xs font-bold text-brand-dark/70 uppercase">{genre.genre}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-brand-dark/50 font-bold h-[300px] flex items-center justify-center">
              No genre data available yet.
            </div>
          )}
        </div>

        {/* Top Customers */}
        <div className="bg-white p-8 rounded-[2rem] border border-brand-dark/5 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-brand-dark uppercase tracking-tight">Top Customers</h2>
            <Users className="text-brand-dark/50" size={20} />
          </div>
          <div className="space-y-6">
            {stats?.topCustomers?.map((customer: any, index: number) => (
              <div key={index} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-bg flex items-center justify-center text-brand-primary font-black">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-brand-dark group-hover:text-brand-primary transition-colors">{customer.name}</p>
                    <p className="text-xs text-brand-dark/50 font-medium">{customer.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-brand-dark">{customer.total_spend.toLocaleString('ar-EG')} ج.م</p>
                  <p className="text-[10px] font-bold text-brand-dark/50 uppercase tracking-widest">Total Spend</p>
                </div>
              </div>
            ))}
            {(!stats?.topCustomers || stats.topCustomers.length === 0) && (
              <div className="text-center py-10 text-brand-dark/50 font-bold">
                No customer data available.
              </div>
            )}
          </div>
        </div>
        {/* Most Added to Cart */}
        <div className="bg-white p-8 rounded-[2rem] border border-brand-dark/5 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-brand-dark uppercase tracking-tight">Most Added to Cart</h2>
            <div className="w-10 h-10 rounded-full bg-brand-bg flex items-center justify-center text-brand-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shopping-cart"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            </div>
          </div>
          <div className="space-y-6">
            {stats?.mostAddedToCart?.map((product: any, index: number) => (
              <div key={index} className="flex items-center justify-between group">
                <div className="flex items-center gap-4 border-l-2 pl-3 border-transparent group-hover:border-brand-primary transition-all">
                  <span className="font-bold text-brand-dark group-hover:text-brand-primary transition-colors">{product.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-brand-dark">{product.count}</span>
                  <span className="text-xs font-bold text-brand-dark/50 uppercase">Times</span>
                </div>
              </div>
            ))}
            {(!stats?.mostAddedToCart || stats.mostAddedToCart.length === 0) && (
              <div className="text-center py-10 text-brand-dark/50 font-bold">
                No cart data collected yet.
              </div>
            )}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white p-8 rounded-[2rem] border border-brand-dark/5 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-brand-dark uppercase tracking-tight">Top Selling Products</h2>
            <div className="w-10 h-10 rounded-full bg-brand-bg flex items-center justify-center text-emerald-600">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="space-y-6">
            {stats?.topSellingProducts?.map((product: any, index: number) => (
              <div key={index} className="flex items-center justify-between group">
                <div className="flex items-center gap-4 border-l-2 pl-3 border-transparent group-hover:border-emerald-500 transition-all">
                  <span className="font-bold text-brand-dark group-hover:text-brand-primary transition-colors">{product.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-brand-dark">{product.count}</span>
                  <span className="text-xs font-bold text-brand-dark/50 uppercase">Sold</span>
                </div>
              </div>
            ))}
            {(!stats?.topSellingProducts || stats.topSellingProducts.length === 0) && (
              <div className="text-center py-10 text-brand-dark/50 font-bold">
                No sales data collected yet.
              </div>
            )}
          </div>
        </div>

        {/* Most Wishlisted */}
        <div className="bg-white p-8 rounded-[2rem] border border-brand-dark/5 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-brand-dark uppercase tracking-tight">Most Wishlisted</h2>
            <div className="w-10 h-10 rounded-full bg-brand-bg flex items-center justify-center text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            </div>
          </div>
          <div className="space-y-6">
            {stats?.mostWishlisted?.map((product: any, index: number) => (
              <div key={index} className="flex items-center justify-between group">
                <div className="flex items-center gap-4 border-l-2 pl-3 border-transparent group-hover:border-red-500 transition-all">
                  <span className="font-bold text-brand-dark group-hover:text-brand-primary transition-colors">{product.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-brand-dark">{product.count}</span>
                  <span className="text-xs font-bold text-brand-dark/50 uppercase">Times</span>
                </div>
              </div>
            ))}
            {(!stats?.mostWishlisted || stats.mostWishlisted.length === 0) && (
              <div className="text-center py-10 text-brand-dark/50 font-bold">
                No wishlist data collected yet.
              </div>
            )}
          </div>
        </div>

        {/* Top Governorates */}
        <div className="bg-white p-8 rounded-[2rem] border border-brand-dark/5 shadow-sm">
           <div className="flex items-center justify-between mb-8">
             <h2 className="text-xl font-black text-brand-dark uppercase tracking-tight">Top Governorates</h2>
             <div className="w-10 h-10 rounded-full bg-brand-bg flex items-center justify-center text-blue-500">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 15 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
             </div>
           </div>
           <div className="space-y-6">
             {stats?.topGovernorates?.map((gov: any, index: number) => (
               <div key={index} className="flex items-center justify-between group">
                 <div className="flex items-center gap-4 border-l-2 pl-3 border-transparent group-hover:border-blue-500 transition-all">
                   <span className="font-bold text-brand-dark group-hover:text-brand-primary transition-colors">{gov.governorate}</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <span className="text-sm font-black text-brand-dark">{gov.count}</span>
                   <span className="text-xs font-bold text-brand-dark/50 uppercase">Orders</span>
                 </div>
               </div>
             ))}
             {(!stats?.topGovernorates || stats.topGovernorates.length === 0) && (
               <div className="text-center py-10 text-brand-dark/50 font-bold">
                 No location data collected yet.
               </div>
             )}
           </div>
        </div>

        {/* Sales by Category (Posters vs Clothing) */}
        <div className="bg-white p-8 rounded-[2rem] border border-brand-dark/5 shadow-sm">
           <div className="flex items-center justify-between mb-8">
             <h2 className="text-xl font-black text-brand-dark uppercase tracking-tight">Sales by Category</h2>
             <div className="w-10 h-10 rounded-full bg-brand-bg flex items-center justify-center text-emerald-500">
               <BarChart3 size={20} />
             </div>
           </div>
           
           {stats?.salesByCategory ? (
            <div className="flex flex-col h-full justify-center">
              <div className="flex items-end gap-8 mb-6 h-40">
                {/* Posters Bar */}
                <div className="flex-1 flex flex-col items-center gap-4">
                  <span className="text-2xl font-black text-brand-dark">{stats.salesByCategory.posters}</span>
                  <div className="w-full bg-brand-primary rounded-t-xl transition-all" style={{ height: Math.max((stats.salesByCategory.posters / (stats.salesByCategory.posters + stats.salesByCategory.clothing || 1)) * 100, 5) + '%' }}></div>
                  <span className="text-xs font-bold text-brand-dark/50 uppercase">Posters</span>
                </div>
                {/* Clothing Bar */}
                <div className="flex-1 flex flex-col items-center gap-4">
                  <span className="text-2xl font-black text-brand-dark">{stats.salesByCategory.clothing}</span>
                  <div className="w-full bg-brand-dark rounded-t-xl opacity-80 transition-all" style={{ height: Math.max((stats.salesByCategory.clothing / (stats.salesByCategory.posters + stats.salesByCategory.clothing || 1)) * 100, 5) + '%' }}></div>
                  <span className="text-xs font-bold text-brand-dark/50 uppercase">Clothing</span>
                </div>
              </div>
              <p className="text-center text-sm font-bold text-brand-dark/60">
                Breakdown of total items sold across all complete orders
              </p>
            </div>
           ) : (
            <div className="text-center py-10 text-brand-dark/50 font-bold">
               No sales data collected yet.
             </div>
           )}
        </div>

      </div>
    </div>
  );
}

