import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Heart, ShoppingCart, User } from "lucide-react";
import { cn } from "../../lib/utils";
import { useCart } from "../../context/CartContext";

export function MobileBottomNav() {
  const location = useLocation();
  const { items } = useCart();
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Watchlist", path: "/watchlist", icon: Heart },
    { name: "Cart", path: "/cart", icon: ShoppingCart, isSpecial: true },
    { name: "Profile", path: "/viewing-history", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="relative mx-4 mb-6 flex items-center justify-between rounded-full border border-brand-dark/15 bg-brand-card/80 px-6 py-3 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          if (item.isSpecial) {
            return (
              <Link
                key={item.name}
                to={item.path}
                className="relative -top-8 flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary text-white shadow-[0_0_20px_rgba(58,134,255,0.4)] transition-transform active:scale-90"
              >
                <item.icon className="h-7 w-7" />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-black text-brand-primary shadow-lg">
                    {cartCount}
                  </span>
                )}
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors",
                isActive ? "text-brand-primary" : "text-brand-dark/60"
              )}
            >
              <item.icon className={cn("h-6 w-6", isActive && "drop-shadow-[0_0_8px_rgba(58,134,255,0.5)]")} />
              <span className="text-[10px] font-black uppercase tracking-widest">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
