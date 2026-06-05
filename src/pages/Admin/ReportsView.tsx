import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { Loader2, FileText, TrendingUp, Package, Download } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

const COLORS = ['#3a86ff', '#ff006e', '#8338ec', '#ffbe0b', '#fb5607', '#3a86ff', '#ff006e', '#8338ec', '#ffbe0b', '#fb5607'];

export function ReportsView() {
  const { token } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const data = await apiFetch("/api/admin/sales-reports", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(data);
    } catch (err) {
      toast.error("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Product,Total Sold\n"
      + reports.map(r => `"${r.title}",${r.total_sold}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-brand text-3xl font-black uppercase tracking-tighter text-brand-dark italic flex items-center gap-3">
            <FileText className="h-8 w-8 text-brand-primary" />
            Sales Reports
          </h1>
          <p className="text-xs text-brand-dark/60 uppercase tracking-[0.2em] mt-1">Performance Analysis & Product Insights</p>
        </div>
        
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-2xl bg-brand-primary px-6 py-2.5 text-sm font-black uppercase tracking-widest text-white hover:bg-brand-primary/90 transition-all shadow-sm"
        >
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-brand-dark uppercase tracking-tight flex items-center gap-2">
              <TrendingUp size={20} className="text-brand-primary" />
              Top 10 Products by Sales
            </h2>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reports}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="title" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 600, fill: '#71717a'}}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 12, fontWeight: 600, fill: '#71717a'}}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                />
                <Bar dataKey="total_sold" radius={[4, 4, 0, 0]}>
                  {reports.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-brand-dark uppercase tracking-tight flex items-center gap-2">
              <Package size={20} className="text-brand-primary" />
              Detailed Breakdown
            </h2>
          </div>
          <div className="overflow-y-auto max-h-[400px] custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white border-b border-gray-100">
                <tr>
                  <th className="pb-4 font-black uppercase tracking-widest text-brand-dark/40 text-[10px]">Product</th>
                  <th className="pb-4 font-black uppercase tracking-widest text-brand-dark/40 text-[10px] text-right">Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reports.map((report, index) => (
                  <tr key={index} className="group">
                    <td className="py-4 font-bold text-brand-dark group-hover:text-brand-primary transition-colors">{report.title}</td>
                    <td className="py-4 font-black text-brand-dark text-right">{report.total_sold}</td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-10 text-center text-brand-dark/40 italic">No sales data recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
