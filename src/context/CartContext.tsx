import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { trackEvent } from "../lib/analytics";

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  size: string;
  color?: string;
  quantity: number;
  image: string;
  customText?: string;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed' | 'free_shipping' | 'b2g1';
  discountValue: number;
}

  interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, size: string, color?: string, customText?: string) => void;
  updateQuantity: (productId: string, size: string, color: string | undefined, quantity: number, customText?: string) => void;
  clearCart: () => void;
  applyCoupon: (coupon: Coupon | null) => void;
  appliedCoupon: Coupon | null;
  selectedFreePoster: any | null;
  setSelectedFreePoster: (poster: any | null) => void;
  totalItems: number;
  totalPrice: number;
  discountAmount: number;
  isFreeShipping: boolean;
  finalPrice: number;
  isTrilogyBundleApplied: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("cutscene_cart");
    return saved ? JSON.parse(saved) : [];
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    const saved = localStorage.getItem("cutscene_coupon");
    return saved ? JSON.parse(saved) : null;
  });

  const [selectedFreePoster, setSelectedFreePoster] = useState<any | null>(() => {
    const saved = localStorage.getItem("cutscene_free_poster");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem("cutscene_cart", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("cutscene_coupon", JSON.stringify(appliedCoupon));
  }, [appliedCoupon]);

  const addToCart = (newItem: CartItem) => {
    trackEvent('add_to_cart', newItem.productId, undefined, {
      item: {
        id: newItem.productId,
        title: newItem.title,
        price: newItem.price,
        quantity: newItem.quantity,
        category: 'Apparel'
      }
    });
    setItems((prev) => {
      const existing = prev.find((i) => 
        i.productId === newItem.productId && 
        i.size === newItem.size && 
        i.color === newItem.color &&
        i.customText === newItem.customText
      );
      if (existing) {
        return prev.map((i) =>
          i.productId === newItem.productId && 
          i.size === newItem.size && 
          i.color === newItem.color &&
          i.customText === newItem.customText
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        );
      }
      return [...prev, newItem];
    });
  };

  const removeFromCart = (productId: string, size: string, color?: string, customText?: string) => {
    setItems((prev) => prev.filter((i) => !(i.productId === productId && i.size === size && i.color === color && i.customText === customText)));
  };

  const updateQuantity = (productId: string, size: string, color: string | undefined, quantity: number, customText?: string) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) => (i.productId === productId && i.size === size && i.color === color && i.customText === customText ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setSelectedFreePoster(null);
  };

  useEffect(() => {
    if (selectedFreePoster) {
      localStorage.setItem("cutscene_free_poster", JSON.stringify(selectedFreePoster));
    } else {
      localStorage.removeItem("cutscene_free_poster");
    }
  }, [selectedFreePoster]);

  const applyCoupon = (coupon: Coupon | null) => {
    setAppliedCoupon(coupon);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Calculate discount based on type
  let discountAmount = 0;
  let isFreeShipping = false;

  if (appliedCoupon) {
    switch (appliedCoupon.discountType) {
      case 'percentage':
        discountAmount = (totalPrice * appliedCoupon.discountValue) / 100;
        break;
      case 'fixed':
        discountAmount = appliedCoupon.discountValue;
        break;
      case 'free_shipping':
        isFreeShipping = true;
        break;
      case 'b2g1':
        // Buy 2 Get 1 Free logic:
        // For every 3 items, the cheapest one is free.
        // We expand all items into a flat list to find the cheapest ones.
        const flatItems = items.flatMap(item => Array(item.quantity).fill(item.price));
        flatItems.sort((a, b) => a - b);
        const freeItemsCount = Math.floor(flatItems.length / 3);
        discountAmount = flatItems.slice(0, freeItemsCount).reduce((sum, price) => sum + price, 0);
        break;
    }
  }

  const finalPrice = Math.max(0, totalPrice - discountAmount);

  return (
    <CartContext.Provider value={{ 
      items, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      applyCoupon,
      appliedCoupon,
      selectedFreePoster,
      setSelectedFreePoster,
      totalItems, 
      totalPrice,
      discountAmount,
      isFreeShipping,
      finalPrice,
      isTrilogyBundleApplied: false
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
