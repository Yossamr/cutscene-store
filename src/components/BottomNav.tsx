import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Grid, ShoppingCart, User } from "lucide-react";
import { motion } from "motion/react";
import { useCart } from "../context/CartContext";
import { cn } from "../lib/utils";

export function BottomNav() {
  const location = useLocation();
  const { totalItems } = useCart();
  const [isBumping, setIsBumping] = useState(false);

  useEffect(() => {
    const handleBump = () => {
      setIsBumping(true);
      setTimeout(() => setIsBumping(false), 300);
    };
    window.addEventListener('cart-bump', handleBump);
    return () => window.removeEventListener('cart-bump', handleBump);
  }, []);

  if (
    location.pathname.startsWith("/product/") ||
    location.pathname === "/cart" ||
    location.pathname === "/checkout"
  )
    return null;

  const navItems = [
    { name: "Home", path: "/", icon: Home, isCart: false },
    { name: "BOX OFFICE", path: "/box-office", icon: Grid, isCart: false },
    { name: "Cart", path: "/cart", icon: ShoppingCart, isCart: true },
    { name: "Profile", path: "/account", icon: User, isCart: false },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-sm md:hidden">
      <div className="flex items-center justify-between rounded-full bg-black/40 backdrop-blur-3xl px-2 py-2 shadow-[0_10px_40px_rgba(0,0,0,0.6)] border border-white/10 ring-1 ring-white/5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "relative flex flex-1 items-center justify-center px-1 py-1 transition-transform",
                item.isCart ? "global-cart-icon" : "",
                item.isCart && isBumping ? "scale-125" : ""
              )}
            >
              <div
                className={cn(
                  "relative z-10 flex flex-col items-center gap-1 transition-all duration-300 py-2 w-full rounded-full",
                  isActive
                    ? "text-white scale-105"
                    : "text-white/40 hover:text-white/60",
                  item.isCart && isBumping ? "text-brand-primary ring-2 ring-brand-primary/50" : ""
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute inset-0 rounded-full bg-brand-primary/20 shadow-[0_0_20px_rgba(45,212,191,0.2)]"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon
                  className={cn(
                    "h-5 w-5",
                    isActive &&
                      "text-brand-primary drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]",
                  )}
                />
                <span
                  className={cn(
                    "text-[9px] font-black uppercase tracking-widest transition-opacity",
                    isActive ? "opacity-100" : "opacity-0 h-0 overflow-hidden",
                  )}
                >
                  {item.name}
                </span>
                {item.name === "Cart" && totalItems > 0 && !isActive && (
                  <span className="absolute right-2 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white shadow-lg">
                    {totalItems}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
