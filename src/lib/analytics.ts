import { analytics } from "./firebase";
import { logEvent } from "firebase/analytics";

export interface AnalyticsItem {
  id: string;
  title: string;
  price: number;
  category?: string;
  quantity?: number;
}

export interface AnalyticsExtraData {
  item?: AnalyticsItem;
  items?: AnalyticsItem[];
  value?: number;
  transaction_id?: string;
}

export const trackEvent = async (
  eventType: 'page_view' | 'product_view' | 'add_to_cart' | 'add_to_watchlist' | 'checkout_started' | 'order_completed', 
  targetId?: string, 
  userId?: string,
  extraData?: AnalyticsExtraData
) => {
  try {
    // 1. Send to manually-added Google Tag (window.gtag) IMMEDIATELY so it's NOT blocked by Firebase status
    if (typeof window !== 'undefined' && (window as any).gtag) {
      const gtag = (window as any).gtag;
      
      // Map item/items to standard Google Analytics 4 (GA4) items array
      let ga4Items: any[] = [];
      if (extraData?.items && Array.isArray(extraData.items)) {
        ga4Items = extraData.items.map(item => ({
          item_id: item.id,
          item_name: item.title,
          price: Number(item.price) || 0,
          quantity: item.quantity || 1,
          item_category: item.category || 'Apparel'
        }));
      } else if (extraData?.item) {
        ga4Items = [{
          item_id: extraData.item.id,
          item_name: extraData.item.title,
          price: Number(extraData.item.price) || 0,
          quantity: extraData.item.quantity || 1,
          item_category: extraData.item.category || 'Apparel'
        }];
      } else if (targetId) {
        // Fallback item if no rich data is provided
        ga4Items = [{
          item_id: targetId,
          item_name: targetId, // Use targetId as fallback name
          price: 0,
          quantity: 1,
          item_category: 'Apparel'
        }];
      }

      const totalValue = extraData?.value || (extraData?.item ? (extraData.item.price * (extraData.item.quantity || 1)) : 0);

      switch (eventType) {
        case 'page_view':
          gtag('event', 'page_view', { 
            page_title: document.title,
            page_location: window.location.href,
            page_path: window.location.pathname,
            send_to: 'G-MLQ5QVK7GT'
          });
          break;
        case 'product_view':
          gtag('event', 'view_item', {
            currency: 'EGP',
            value: totalValue,
            items: ga4Items
          });
          break;
        case 'add_to_cart':
          gtag('event', 'add_to_cart', {
            currency: 'EGP',
            value: totalValue,
            items: ga4Items
          });
          break;
        case 'add_to_watchlist':
          gtag('event', 'add_to_wishlist', {
            currency: 'EGP',
            value: totalValue,
            items: ga4Items
          });
          break;
        case 'checkout_started':
          gtag('event', 'begin_checkout', {
            currency: 'EGP',
            value: totalValue,
            items: ga4Items
          });
          break;
        case 'order_completed':
          gtag('event', 'purchase', {
            transaction_id: extraData?.transaction_id || targetId || `order_${Date.now()}`,
            value: totalValue,
            currency: 'EGP',
            tax: 0,
            shipping: 50,
            items: ga4Items
          });
          break;
        default:
          gtag('event', eventType, { 
            target_id: targetId,
            user_id: userId,
            value: totalValue,
            items: ga4Items
          });
      }
      console.log(`[Google Tag gtag] Sent ${eventType} to G-MLQ5QVK7GT`, { value: totalValue, items: ga4Items });
    }

    // 2. Send to Firebase Analytics (if initialized)
    if (analytics) {
      let firebaseItems: any[] = [];
      if (extraData?.items && Array.isArray(extraData.items)) {
        firebaseItems = extraData.items.map(item => ({
          item_id: item.id,
          item_name: item.title,
          price: Number(item.price) || 0,
          quantity: item.quantity || 1,
          item_category: item.category || 'Apparel'
        }));
      } else if (extraData?.item) {
        firebaseItems = [{
          item_id: extraData.item.id,
          item_name: extraData.item.title,
          price: Number(extraData.item.price) || 0,
          quantity: extraData.item.quantity || 1,
          item_category: extraData.item.category || 'Apparel'
        }];
      } else if (targetId) {
        firebaseItems = [{
          item_id: targetId,
          item_name: targetId,
          price: 0,
          quantity: 1,
          item_category: 'Apparel'
        }];
      }

      const totalValue = extraData?.value || (extraData?.item ? (extraData.item.price * (extraData.item.quantity || 1)) : 0);

      // Map custom event types to Google Analytics standard events where possible
      switch (eventType) {
        case 'page_view':
          logEvent(analytics, 'page_view', { page_path: window.location.pathname });
          break;
        case 'product_view':
          logEvent(analytics, 'view_item', { 
            currency: 'EGP', 
            value: totalValue, 
            items: firebaseItems 
          });
          break;
        case 'add_to_cart':
          logEvent(analytics, 'add_to_cart', { 
            currency: 'EGP', 
            value: totalValue, 
            items: firebaseItems 
          });
          break;
        case 'add_to_watchlist':
          logEvent(analytics, 'add_to_wishlist', { 
            currency: 'EGP', 
            value: totalValue, 
            items: firebaseItems 
          });
          break;
        case 'checkout_started':
          logEvent(analytics, 'begin_checkout', { 
            currency: 'EGP', 
            value: totalValue, 
            items: firebaseItems 
          });
          break;
        case 'order_completed':
          logEvent(analytics, 'purchase', { 
            transaction_id: extraData?.transaction_id || targetId || `order_${Date.now()}`,
            value: totalValue,
            currency: 'EGP',
            items: firebaseItems 
          });
          break;
        default:
          logEvent(analytics, eventType, { target_id: targetId, value: totalValue });
      }
      
      console.log(`[Firebase Analytics] Logged ${eventType}`);
    } else {
      console.debug("[Analytics] Firebase Analytics skipped (uninitialized / placeholder)");
    }
  } catch (error) {
    // Silently fail for analytics
    console.warn("Analytics tracking failed", error);
  }
};

