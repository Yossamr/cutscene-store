import { Outlet, Link, useLocation } from "react-router-dom";
import { Clapperboard, Film, BarChart3, ShoppingBag, LogOut, Home, Ticket, Image as ImageIcon, Settings, Users, FileText, ClipboardList, Grid, Wand2, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";

export function AdminLayout() {
  const location = useLocation();
  const { logout, user } = useAuth();

  const navItems = [
    { name: "Set List", path: "/admin/products", icon: Film },
    { name: "Collections", path: "/admin/collections", icon: Grid },
    { name: "Media Vault", path: "/admin/media", icon: ImageIcon },
    { name: "Box Office Receipts", path: "/admin/orders", icon: ShoppingBag },
    { name: "Cheat Codes", path: "/admin/coupons", icon: Ticket },
    { name: "Stats", path: "/admin/stats", icon: BarChart3 },
    { name: "Users", path: "/admin/users", icon: Users },
    { name: "Reports", path: "/admin/reports", icon: FileText },
    { name: "Audit Log", path: "/admin/audit", icon: ClipboardList },
    { name: "Automation", path: "/admin/automation", icon: Wand2 },
    { name: "Social AI", path: "/admin/social-ai", icon: Sparkles },
    { name: "Studio Settings", path: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-white text-brand-dark font-sans selection:bg-brand-primary/30">
      {/* Sidebar - The Control Panel */}
      <aside className="w-64 bg-gray-100 flex flex-col sticky top-0 h-screen shadow-sm z-20 border-r border-gray-200">
        <div className="flex items-center gap-3 text-brand-primary p-6 border-b border-gray-200">
          <Clapperboard className="h-8 w-8 drop-shadow-[0_0_8px_rgba(58,134,255,0.5)]" />
          <span className="text-xl font-black uppercase tracking-widest font-brand text-brand-dark italic">Director</span>
        </div>
        
        <nav className="flex-1 space-y-2 p-4 overflow-y-auto custom-scrollbar">
          <div className="mb-4 px-4 py-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Main Menu</p>
          </div>
          {navItems.map((item) => {
            const isActive = location.pathname.includes(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all duration-300",
                  isActive
                    ? "bg-brand-primary text-white shadow-[0_0_15px_rgba(58,134,255,0.3)]"
                    : "text-brand-dark/60 hover:bg-gray-200 hover:text-brand-dark"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive && "drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <Link 
            to="/" 
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-xs font-bold uppercase tracking-widest text-brand-dark/60 hover:bg-gray-200 hover:text-brand-dark transition-all"
          >
            <Home className="h-4 w-4" />
            Return to Storefront
          </Link>
          <button 
            onClick={logout} 
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Exit Studio
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Cinematic Header */}
        <header className="h-20 border-b border-gray-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-brand-primary to-brand-light flex items-center justify-center text-white font-black shadow-[0_0_15px_rgba(58,134,255,0.3)]">
              {user?.name?.[0] || "A"}
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-brand-dark">{user?.name || "Admin"}</p>
              <p className="text-xs uppercase tracking-tighter text-brand-dark/60">Executive Producer</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-dark/60">Studio Status</p>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Live on Set</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8 custom-scrollbar bg-white">
          <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
