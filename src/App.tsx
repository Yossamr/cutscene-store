/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { SettingsProvider, useSettings } from "./context/SettingsContext";
import { MusicProvider } from "./context/MusicContext";
import { GlobalMusicPlayer } from "./components/GlobalMusicPlayer";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";

import { Home } from "./pages/Home";
import { BoxOffice } from "./pages/BoxOffice";
import { Shop } from "./pages/Shop";
import { Watchlist } from "./pages/Watchlist";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { AdminLayout } from "./pages/Admin/AdminLayout";
import { ProductManager } from "./pages/Admin/ProductManager";
import { AdminDashboard } from "./pages/Admin/AdminDashboard";
import { AdminOrders } from "./pages/Admin/AdminOrders";
import { CouponsManager } from "./pages/Admin/CouponsManager";
import { MediaManager } from "./pages/Admin/MediaManager";
import CollectionsManager from "./pages/Admin/CollectionsManager";
import { AdminSettings } from "./pages/Admin/AdminSettings";
import { UsersView } from "./pages/Admin/UsersView";
import { ReportsView } from "./pages/Admin/ReportsView";
import { AuditLogView } from "./pages/Admin/AuditLogView";
import { AutomationManager } from "./pages/Admin/AutomationManager";
import { SocialMediaAI } from "./pages/Admin/SocialMediaAI";
import { CartPage } from "./pages/CartPage";
import { Checkout } from "./pages/Checkout";
import { OrderSuccess } from "./pages/OrderSuccess";
import { Account } from "./pages/Profile/Account";
import { ViewingHistory } from "./pages/Profile/ViewingHistory";
import { SearchResults } from "./pages/SearchResults";
import { ProductDetails } from "./pages/ProductDetails";
import { SplashScreen } from "./components/SplashScreen";
import { ScrollToTop } from "./components/ScrollToTop";
import { About, Contact, FAQ, Terms, Returns } from "./pages/InfoPages";
import { useLocation } from "react-router-dom";
import { trackEvent } from "./lib/analytics";
import { useEffect } from "react";

function AppContent() {
  const { loading: settingsLoading } = useSettings();
  const { isLoading: authLoading, user } = useAuth();
  const [splashDone, setSplashDone] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Check if we need to show the splash screen
    const lastSplash = localStorage.getItem("last_splash_seen");
    const now = Date.now();
    const twelveHours = 12 * 60 * 60 * 1000;
    
    // Only show splash if we haven't seen it in the last 12 hours
    if (!lastSplash || now - parseInt(lastSplash, 10) > twelveHours) {
      setSplashDone(false);
    }
  }, []);

  useEffect(() => {
    trackEvent('page_view', undefined, user?.id);
    
    // Heartbeat for visitor tracking
    const interval = setInterval(() => {
      fetch('/api/ping').catch(() => {});
    }, 45000); // Every 45 seconds
    
    return () => clearInterval(interval);
  }, [location.pathname, user?.id]);

  // The splash screen is "complete" only when the animation is done AND data is synced
  const isSyncing = settingsLoading || authLoading;
  const showSplash = !splashDone || (isSyncing && !splashDone);

  if (showSplash) {
    return <SplashScreen 
      onComplete={() => {
        localStorage.setItem("last_splash_seen", Date.now().toString());
        setSplashDone(true);
      }} 
      isSyncing={isSyncing} 
    />;
  }

  return (
    <>
      <Toaster 
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#1a242a', // brand-bg
            color: '#fff',
            border: '1px solid rgba(58, 134, 255, 0.2)', // brand-primary
            boxShadow: '0 0 15px rgba(0,0,0,0.5)',
          },
          success: {
            iconTheme: {
              primary: '#3a86ff', // brand-primary
              secondary: '#1a242a',
            },
            style: {
              border: '1px solid rgba(58, 134, 255, 0.3)',
              boxShadow: '0 0 15px rgba(58, 134, 255, 0.2)',
            },
          },
          error: {
            iconTheme: {
              primary: '#3a86ff', // brand-primary
              secondary: '#18181b',
            },
            style: {
              border: '1px solid rgba(239, 68, 68, 0.3)',
              boxShadow: '0 0 15px rgba(239, 68, 68, 0.2)',
            },
          },
        }}
      />
      <ScrollToTop />
      <Routes>
        {/* Storefront Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="box-office" element={<BoxOffice />} />
          <Route path="shop" element={<Shop />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="search" element={<SearchResults />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="terms" element={<Terms />} />
          <Route path="returns" element={<Returns />} />
          
          {/* Protected Storefront Routes */}
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="order-success" element={<OrderSuccess />} />

          <Route element={<ProtectedRoute />}>
            <Route path="watchlist" element={<Watchlist />} />
            <Route path="viewing-history" element={<ViewingHistory />} />
            <Route path="account" element={<Account />} />
          </Route>

          <Route path="product/:id" element={<ProductDetails />} />
        </Route>

        {/* Admin Dashboard Layout */}
        <Route path="/admin" element={<ProtectedRoute requireAdmin={true} />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="products" replace />} />
            <Route path="products" element={<ProductManager />} />
            <Route path="collections" element={<CollectionsManager />} />
            <Route path="media" element={<MediaManager />} />
            <Route path="stats" element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="coupons" element={<CouponsManager />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="users" element={<UsersView />} />
            <Route path="reports" element={<ReportsView />} />
            <Route path="audit" element={<AuditLogView />} />
            <Route path="automation" element={<AutomationManager />} />
            <Route path="social-ai" element={<SocialMediaAI />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <MusicProvider>
          <CartProvider>
            <BrowserRouter basename={import.meta.env.BASE_URL}>
              <AppContent />
              <GlobalMusicPlayer />
            </BrowserRouter>
          </CartProvider>
        </MusicProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}


