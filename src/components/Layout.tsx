import { useState, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Film, ShoppingCart, User, Clapperboard, LogOut, Heart, Search, Youtube, Instagram, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import { BottomNav } from "./BottomNav";
import { BackToTop } from "./BackToTop";
import { useUserBehavior } from "../hooks/useUserBehavior";
import { CartAnimation } from "./CartAnimation";
import { cn } from "../lib/utils";

const TikTokIcon = ({ className }: { className?: string }) => (
  // ... svg omitted for brevity, I will copy it exactly
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

export function Layout() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const { trackSearch } = useUserBehavior();
  const [isBumping, setIsBumping] = useState(false);

  useEffect(() => {
    const handleBump = () => {
      setIsBumping(true);
      setTimeout(() => setIsBumping(false), 300);
    };
    window.addEventListener('cart-bump', handleBump);
    return () => window.removeEventListener('cart-bump', handleBump);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen text-brand-dark font-sans selection:bg-brand-primary/30 flex flex-col">
      <CartAnimation />
      {/* Desktop Floating Header Pill */}
      <header className="hidden md:flex justify-center sticky top-6 z-50 pointer-events-none mt-6 mb-6">
        <div className="pointer-events-auto flex items-center gap-8 rounded-full bg-white/80 backdrop-blur-xl px-8 py-3 shadow-2xl border border-gray-200">
          <Link to="/" className="flex items-center gap-1 group">
            <span className="font-brand text-3xl font-black italic tracking-tighter text-brand-dark group-hover:text-brand-primary transition-colors">
              cut<span className="text-brand-primary">s</span>cene
            </span>
          </Link>
          
          <nav className="flex items-center gap-6 text-sm font-bold text-brand-dark/70">
            <Link to="/shop?category=tshirts" className="hover:text-brand-primary transition-colors flex items-center gap-1.5">Now Showing</Link>
            <Link to="/shop?category=portraits" className="hover:text-brand-primary transition-colors flex items-center gap-1.5">The Gallery</Link>
            <Link to="/box-office" className="hover:text-brand-primary transition-colors flex items-center gap-1.5">Box Office</Link>
            {user && <Link to="/watchlist" className="hover:text-brand-primary transition-colors">Watchlist</Link>}
            {user?.role === "admin" && (
              <Link to="/admin" className="text-brand-primary hover:text-brand-primary/80 transition-colors">Admin</Link>
            )}
          </nav>

          <div className="flex items-center gap-6 text-brand-dark/70">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const q = formData.get('q');
                if (q) {
                  trackSearch(q.toString());
                  navigate(`/search?q=${encodeURIComponent(q.toString())}`);
                }
              }}
              className="relative hidden lg:block"
            >
              <input 
                name="q"
                type="text" 
                placeholder="Search vibes..." 
                className="w-48 rounded-full bg-gray-100 border border-gray-200 px-4 py-1.5 text-xs focus:w-64 focus:bg-gray-200 focus:outline-none transition-all placeholder:text-brand-dark/30 text-brand-dark"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-brand-primary transition-colors">
                <Search className="h-3.5 w-3.5" />
              </button>
            </form>

            <Link to="/search" className="lg:hidden hover:text-brand-primary transition-colors">
              <Search className="h-5 w-5" />
            </Link>
            
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/account" className="hover:text-brand-primary transition-colors">
                  <User className="h-5 w-5" />
                </Link>
                <button onClick={handleLogout} className="hover:text-red-400 transition-colors">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="text-sm font-bold text-brand-dark hover:text-brand-primary transition-colors">
                Login
              </Link>
            )}

            <Link to="/cart" className={cn("global-cart-icon relative hover:text-brand-primary transition-all flex items-center justify-center h-10 w-10 bg-gray-100 border border-gray-200 rounded-full", isBumping ? "scale-125 bg-brand-primary/20 ring-4 ring-brand-primary/30" : "")}>
              <ShoppingCart className="h-5 w-5 text-brand-dark" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl shadow-sm md:hidden px-6 py-4 flex items-center justify-between rounded-b-3xl border-b border-gray-200 transition-all duration-300">
        <Link to="/" className="flex items-center gap-1">
          <span className="font-brand text-3xl font-black italic tracking-tighter text-brand-dark">
            cut<span className="text-brand-primary">s</span>cene
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/search" className="flex items-center justify-center h-10 w-10 bg-gray-100 rounded-full shadow-sm border border-gray-200">
            <Search className="h-5 w-5 text-brand-dark" />
          </Link>
          <Link to="/cart" className={cn("global-cart-icon relative flex items-center justify-center h-10 w-10 bg-gray-100 rounded-full shadow-sm border border-gray-200 transition-transform", isBumping ? "scale-125 bg-brand-primary/20 ring-4 ring-brand-primary/30" : "")}>
            <ShoppingCart className="h-5 w-5 text-brand-dark" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white shadow-sm">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 pb-32 bg-transparent text-brand-dark">
        <Outlet />
      </main>

      {/* Mobile Navigation */}
      <BottomNav />

      {/* Cinematic Credits Footer */}
      <footer className="bg-brand-dark text-white py-16 md:py-24 pb-36 md:pb-24 px-6 relative overflow-hidden mt-auto border-t border-white/5">
        {/* Film Grain Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col items-center text-center space-y-16">
            {/* The Logo */}
            <div className="space-y-3">
              <Link to="/" className="inline-block hover:scale-105 transition-transform">
                <h2 className="font-brand text-4xl md:text-7xl font-black italic tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                  CUT<span className="text-brand-primary">SCENE</span>
                </h2>
              </Link>
              <p className="text-[9px] md:text-[10px] uppercase tracking-[0.6em] text-white/30 font-black">
                A Production by Cutscene Brand
              </p>
            </div>

            {/* The Credits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-10 w-full max-w-5xl">
              <div className="space-y-3 group">
                <h4 className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] text-brand-primary font-black opacity-80 group-hover:opacity-100 transition-opacity">Directed By</h4>
                <p className="text-base font-bold text-white/90">Youssef Amr</p>
              </div>
              <div className="space-y-3 group">
                <h4 className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] text-brand-primary font-black opacity-80 group-hover:opacity-100 transition-opacity">Produced By</h4>
                <p className="text-base font-bold text-white/90">Cutscene Team</p>
              </div>
              <div className="space-y-3 group">
                <h4 className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] text-brand-primary font-black opacity-80 group-hover:opacity-100 transition-opacity">Starring</h4>
                <p className="text-base font-bold text-white/90">Our Community</p>
              </div>
              <div className="space-y-3 group">
                <h4 className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] text-brand-primary font-black opacity-80 group-hover:opacity-100 transition-opacity">Location</h4>
                <p className="text-base font-bold text-white/90">Cairo, Egypt</p>
              </div>
            </div>

            {/* Social Links & Navigation */}
            <div className="flex flex-col items-center gap-8 w-full pt-8">
              <div className="flex flex-wrap justify-center gap-x-10 gap-y-4">
                <a href="https://www.instagram.com/cutscenebrand/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-black text-white/40 hover:text-brand-primary transition-colors group">
                  <Instagram className="w-3.5 h-3.5" />
                  <span>Instagram</span>
                </a>
                <a href="https://www.tiktok.com/@cutscene.brand" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-black text-white/40 hover:text-brand-primary transition-colors group">
                  <TikTokIcon className="w-3.5 h-3.5" />
                  <span>TikTok</span>
                </a>
                <a href="https://www.youtube.com/@clacket01" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-black text-white/40 hover:text-brand-primary transition-colors group">
                  <Youtube className="w-3.5 h-3.5" />
                  <span>YouTube</span>
                </a>
              </div>
            </div>

            {/* Copyright */}
            <div className="pt-12 border-t border-white/5 w-full flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] text-white/20 font-bold max-w-md md:text-left">
                © {new Date().getFullYear()} CUTSCENE BRAND. ALL RIGHTS RESERVED. NO REPRODUCTION OR DISTRIBUTION WITHOUT EXPLICIT PERMISSION.
              </p>
              <div className="flex gap-8">
                <Link to="/terms" className="text-[9px] uppercase tracking-widest text-white/20 hover:text-white transition-colors font-bold">Terms</Link>
                <Link to="/privacy" className="text-[9px] uppercase tracking-widest text-white/20 hover:text-white transition-colors font-bold">Privacy</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
      <BackToTop />
    </div>
  );
}
