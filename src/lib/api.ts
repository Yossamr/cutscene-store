/**
 * API Utility for Cutscene
 * Handles dynamic base URL for development and production, as well as Static Mode for GitHub Pages.
 */

import { API_BASE_URL } from "../config";

let cachedStaticData: any = null;

async function getStaticData() {
  if (cachedStaticData) return cachedStaticData;
  try {
    const basePath = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.BASE_URL : '/';
    const cleanBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    const res = await fetch(`${cleanBase}/static-data.json`);
    if (res.ok) {
      cachedStaticData = await res.json();
      return cachedStaticData;
    }
  } catch (e) {
    console.error("Failed to fetch static data", e);
  }
  return null;
}

export async function apiFetch(endpoint: string, options: any = {}) {
  // 1. Static Mode Interception
  const isStaticMode = window.location.hostname.includes('github.io') || 
                      (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_STATIC_MODE === 'true');
  
  if (isStaticMode) {
    if (options.method && options.method !== 'GET') {
      console.warn(`[Static Mode] Intercepted mock ${options.method} request to ${endpoint}`);
      if (endpoint.includes('/api/analytics/track')) return { success: true };
      if (endpoint.includes('/api/auth')) return { token: "mock_token", user: { role: 'user' } };
      
      // Handle Orders in Static Mode
      if (endpoint.includes('/api/orders')) {
        const data = await getStaticData();
        const telegramConfig = data?.settings?.telegram_config;
        const orderId = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        
        if (telegramConfig && telegramConfig.token && telegramConfig.chatId) {
          try {
            const body = options.body;
            const e = (s: string | undefined | null) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            let productList = "";
            if (body && body.items) {
               productList = body.items.map((i: any) => {
                 let productName = e(i.product);
                 let productUrl = `https://yossamr.github.io/cutscene-store/`;
                 let productImg = "";
                 
                 // Lookup product details
                 if (data && data.products) {
                   const foundProduct = data.products.find((p:any) => p.id === i.product);
                   if (foundProduct) {
                     productName = e(foundProduct.title);
                     productUrl = `https://yossamr.github.io/cutscene-store/product/${foundProduct.id}`;
                     productImg = foundProduct.image_main ? `\n<a href="${foundProduct.image_main}">🖼️ صورة المنتج</a>` : "";
                   }
                 }
                 
                 return `🎬 ${i.quantity}x <a href="${productUrl}"><b>${productName}</b></a> (Size: ${e(i.size) || 'N/A'})\n💵 ${i.price} EGP${productImg}`;
               }).join('\n\n➖➖➖➖➖➖➖➖➖➖\n\n');
            }

            const message = `
🌟 <b>طلب جديد (متجر جيت هاب)</b> 🌟
<b>رقم الطلب:</b> <code>${orderId}</code>

👤 <b>بيانات العميل:</b>
👤 الإسم: ${e(body.shippingDetails?.fullName)}
📱 رقم الموبايل: <code>${e(body.shippingDetails?.phone)}</code>
📍 المحافظة: ${e(body.shippingDetails?.governorate)}
🌆 المدينة: ${e(body.shippingDetails?.city)}
🏠 العنوان: ${e(body.shippingDetails?.address)}

🛍️ <b>المنتجات (${body.items?.length || 0}):</b>
${productList}

💰 <b>الإجمالي: ${body.totalAmount} ج.م</b>
            `.trim();

            const phone = body.shippingDetails?.phone || '';
            const cleanPhone = typeof phone === 'string' ? (phone.startsWith('0') ? phone.substring(1) : phone) : '';
            const whatsappUrl = cleanPhone ? `https://wa.me/20${cleanPhone}` : `https://yossamr.github.io/cutscene-store/`;

            let attempt = 0;
            let success = false;
            let lastError = "";
            while(attempt < 3 && !success) {
              const tgRes = await fetch(`https://api.telegram.org/bot${telegramConfig.token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: telegramConfig.chat_id || telegramConfig.chatId,
                  text: message,
                  parse_mode: 'HTML',
                  reply_markup: {
                    inline_keyboard: [
                      [
                        {
                          text: "🛒 فتح المتجر",
                          url: "https://yossamr.github.io/cutscene-store/"
                        }
                      ],
                      [
                        {
                           text: "💬 التواصل مع العميل (واتساب)",
                           url: whatsappUrl
                        }
                      ]
                    ]
                  }
                })
              });
              
              if(!tgRes.ok) {
                 if (tgRes.status === 429) {
                    const retryAfter = tgRes.headers.get('Retry-After');
                    const delay = retryAfter ? parseInt(retryAfter) * 1000 : 2000;
                    await new Promise(res => setTimeout(res, delay));
                    attempt++;
                 } else {
                    lastError = await tgRes.text();
                    console.error("Static tg error:", lastError);
                    break;
                 }
              } else {
                 success = true;
              }
            }
            if(!success) {
              throw new Error("فشل تأكيد الطلب بسبب مشكلة في الإشعارات. يرجى المحاولة مرة أخرى أو التواصل معنا.");
            }
            console.log("Telegram notification sent via static mode.");
          } catch (e: any) {
            console.error("Static mode order notification failed", e);
            throw new Error(e.message || "فشل تأكيد الطلب. يرجى المحاولة مرة أخرى.");
          }
        } else {
          console.warn("No telegram config found in static mode. Order will vanish.");
        }
        
        return { 
          success: true, 
          orderId, 
          barcodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${orderId}` 
        };
      }

      return { success: true, message: "Mocked response for static mode." };
    }

    const data = await getStaticData();
    if (data) {
      if (endpoint.includes('/api/products/search')) {
        const urlParams = new URLSearchParams(endpoint.split('?')[1] || "");
        const q = (urlParams.get('q') || "").toLowerCase();
        
        const productsMatch = data.products.filter((p: any) => 
          p.title?.toLowerCase().includes(q) || 
          p.description?.toLowerCase().includes(q) || 
          p.collection_name?.toLowerCase().includes(q)
        ).slice(0, 20);

        const collectionsMatch = data.collections.filter((c: any) => 
          (c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)) &&
          c.status !== 'coming_soon'
        ).slice(0, 10);

        return { products: productsMatch, collections: collectionsMatch };
      }
      
      if (endpoint.includes('/api/products') && !endpoint.includes('/api/products/')) {
        return data.products;
      }
      if (endpoint.includes('/api/products/')) {
        const parts = endpoint.split('?')[0].split('/');
        const id = parts[parts.length - 1];
        if (id === 'reviews') return [];
        const prod = data.products.find((p:any) => p.id === id);
        if (prod) return prod;
        // else let it fall through or throw
      }
      if (endpoint.includes('/api/collections')) {
        return data.collections;
      }
      if (endpoint.includes('/api/settings')) {
        return data.settings || {};
      }
    } else {
      console.error("🚨 [Static Mode] CRITICAL: static-data.json is missing or failed to load. The app will appear empty.");
      // Return empty structures to avoid crashing the app
      if (endpoint.includes('/api/products') && !endpoint.includes('/api/products/')) return [];
      if (endpoint.includes('/api/collections')) return [];
      if (endpoint.includes('/api/settings')) return {};
    }
  }

  // 2. Clean up the endpoint
  let cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  
  // 3. Determine the final URL
  let url = "";
  if (endpoint.startsWith("http")) {
    url = endpoint;
  } else {
    // Ensure we don't have double slashes
    const baseUrl = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const path = cleanEndpoint.startsWith("/") ? cleanEndpoint : `/${cleanEndpoint}`;
    url = `${baseUrl}${path}`;
  }
  
  console.log(`[apiFetch] Requesting: ${url} (Method: ${options.method || 'GET'})`);

  // 4. Prepare headers and body
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Add token if exists
  const token = localStorage.getItem("cutscene_token");
  if (token && !headers.Authorization) {
    (headers as any).Authorization = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    // Use 'same-origin' if the URL is relative or matches current origin
    credentials: (url.startsWith("/") || url.startsWith(window.location.origin)) ? 'same-origin' : 'omit',
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    let errorData: any;
    const contentType = response.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `API error: ${response.status}` };
      }
    } else {
      const text = await response.text();
      console.error(`[apiFetch] Non-JSON error response from ${url}:`, text.substring(0, 200));
      errorData = { message: `API error: ${response.status} ${response.statusText}` };
    }
    
    if (response.status === 400) {
      console.error(`[apiFetch] 400 Bad Request for ${url}:`, errorData);
    }
    
    throw new Error(errorData.message || `API error: ${response.status}`);
  }

  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text();
    console.error(`[apiFetch] Expected JSON but got ${contentType} from ${url}:`, text.substring(0, 200));
    throw new Error(`Expected JSON response but got ${contentType || 'unknown'}`);
  }

  return response.json();
}
