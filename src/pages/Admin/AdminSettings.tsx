import { useState, useEffect } from "react";
import { useSettings } from "../../context/SettingsContext";
import { Save, Loader2, Megaphone, Image as ImageIcon, Clapperboard, Plus, Trash2, Sparkles, Send, Gift } from "lucide-react";
import toast from "react-hot-toast";
import { apiFetch } from "../../lib/api";

export function AdminSettings() {
  const { settings, updateSettings, loading } = useSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [formData, setFormData] = useState(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleAnnouncementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      announcement: {
        ...prev.announcement,
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };

  const handleHeroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        [name]: value
      }
    }));
  };

  const handleTelegramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      telegram_config: {
        ...(prev.telegram_config || { token: "", chatId: "" }),
        [name]: value
      }
    }));
  };

  const handleCategoryImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Automatically clean Google Redirects if pasted
    let cleanedValue = value;
    if (value.includes('google.com/url')) {
      try {
        const urlObj = new URL(value);
        cleanedValue = urlObj.searchParams.get('q') || urlObj.searchParams.get('url') || value;
        cleanedValue = decodeURIComponent(cleanedValue);
      } catch (e) {
        console.error("Error cleaning URL in input:", e);
      }
    }

    setFormData(prev => ({
      ...prev,
      categoryImages: {
        ...(prev.categoryImages || { movies: "", tvShows: "", anime: "" }),
        [name]: cleanedValue
      }
    }));
  };

  const handleTestTelegram = async () => {
    if (!formData.telegram_config?.chatId) {
      toast.error("Please enter a Chat ID first");
      return;
    }

    setIsTesting(true);
    try {
      // We'll add a test endpoint or just use the existing settings update and then a separate test call
      // For now, let's just try to send a test message via a new API route we'll create
      await apiFetch('/api/settings/test-telegram', {
        method: 'POST',
        body: formData.telegram_config
      });
      toast.success("Test notification sent & ID saved securely!");
      
      // Update the context settings so it's in sync
      updateSettings({ telegram_config: formData.telegram_config });
    } catch (error: any) {
      toast.error(error.message || "Failed to send test notification");
    } finally {
      setIsTesting(false);
    }
  };

  const [isExporting, setIsExporting] = useState(false);
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await apiFetch('/api/admin/export-db', { method: 'POST' });
      
      // Also download it directly for the user
      if (response.data) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.data, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href",     dataStr);
        downloadAnchorNode.setAttribute("download", "static-data.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      }

      toast.success(response.message || "Database exported and downloaded successfully.");
    } catch (error: any) {
      toast.error(error.message || "Failed to export data.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings(formData);
      toast.success("Settings updated successfully!");
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-brand text-3xl font-black italic text-brand-dark">Store Settings</h1>
        <p className="mt-2 text-brand-dark/60">Manage your announcement bar, hero banner, and collections.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Telegram Notifications Settings */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-primary/20 bg-gradient-to-br from-white to-brand-primary/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-primary/10 rounded-lg">
                <Send className="h-5 w-5 text-brand-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-brand-dark">Admin Notifications</h2>
                <p className="text-sm text-gray-500">Get instant Telegram alerts for new orders.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTestTelegram}
              disabled={isTesting}
              className="flex items-center gap-2 rounded-xl bg-brand-primary/10 px-4 py-2 text-sm font-bold text-brand-primary hover:bg-brand-primary/20 transition-colors disabled:opacity-50"
            >
              {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Test Connection
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-dark/80 mb-1">Bot Token</label>
              <input
                type="password"
                name="token"
                value={formData.telegram_config?.token || ""}
                onChange={handleTelegramChange}
                placeholder="Enter Bot Token"
                className="w-full rounded-xl bg-gray-50 border-gray-200 px-4 py-2 text-brand-dark focus:ring-2 focus:ring-brand-primary/50"
              />
              <p className="mt-1 text-[10px] text-gray-400">
                1. Search for <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-brand-primary underline">@BotFather</a> to create a bot.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-dark/80 mb-1">Admin Chat ID</label>
              <input
                type="text"
                name="chatId"
                value={formData.telegram_config?.chatId || ""}
                onChange={handleTelegramChange}
                placeholder="Enter your Chat ID"
                className="w-full rounded-xl bg-gray-50 border-gray-200 px-4 py-2 text-brand-dark focus:ring-2 focus:ring-brand-primary/50"
              />
              <p className="mt-1 text-[10px] text-gray-400">
                2. Send <b>/start</b> to your bot, then get your ID from <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-brand-primary underline">@userinfobot</a>.
              </p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-[11px] text-amber-700 leading-relaxed">
              <b>⚠️ Important:</b> You MUST send a message to your bot in Telegram first before testing, otherwise you will get a "chat not found" error.
            </p>
          </div>
        </div>

        {/* Free Poster Offer Settings */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-brand-primary/10 rounded-lg">
              <Gift className="h-5 w-5 text-brand-primary" />
            </div>
            <h2 className="text-xl font-bold text-brand-dark">Free Poster Offer</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <input
                type="checkbox"
                id="free_poster_offer_enabled"
                name="free_poster_offer_enabled"
                checked={formData.free_poster_offer_enabled || false}
                onChange={(e) => setFormData(prev => ({ ...prev, free_poster_offer_enabled: e.target.checked }))}
                className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
              <label htmlFor="free_poster_offer_enabled" className="font-medium text-brand-dark flex flex-col">
                <span>Enable "Free Poster" Offer</span>
                <span className="text-sm text-gray-500 font-normal">When enabled, customers can choose 1 free poster in the cart. The hero banner will also change to promote this offer.</span>
              </label>
            </div>
          </div>
        </div>

        {/* Eid Offer Settings (زرار العيد) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#16a34a]/30 bg-gradient-to-br from-white to-emerald-50/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Sparkles className="h-5 w-5 text-emerald-600 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-dark font-brand italic text-emerald-700">العيد (Eid Festival Offer)</h2>
              <p className="text-sm text-gray-500">Configure storewide pre-ordering, countdown timer ending at the fourth day of Eid, and celebratory Eid aesthetics.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4">
              <input
                type="checkbox"
                id="eid_offer_enabled"
                name="eid_offer_enabled"
                checked={formData.eid_offer_enabled || false}
                onChange={(e) => setFormData(prev => ({ ...prev, eid_offer_enabled: e.target.checked }))}
                className="h-6 w-6 rounded border-emerald-500 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="eid_offer_enabled" className="font-medium text-brand-dark flex flex-col cursor-pointer select-none">
                <span className="text-emerald-700 font-bold text-lg flex items-center gap-2">
                  🌙 زرار العيد (Enable Eid Offer & Pre-Orders)
                </span>
                <span className="text-sm text-gray-600 leading-relaxed max-w-2xl">
                  عند التفعيل: سيتحول المتجر بالكامل لحدث العيد، سيتم وسم <b>كل المنتجات</b> بأنها <b>Pre-Order (حجز مسبق)</b>، وسيبدأ عداد زمني تنازلي ينتهي بانتهاء يوم <b>رابع أيام العيد</b> عند كل المنتجات، كما سيتأهل أي أوردر للحصول على <b>بوستر هدية مجاني يختاره العميل بنفسه</b> من السلة.
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Announcement Bar Settings */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-brand-primary/10 rounded-lg">
              <Megaphone className="h-5 w-5 text-brand-primary" />
            </div>
            <h2 className="text-xl font-bold text-brand-dark">Announcement Bar</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <input
                type="checkbox"
                id="isVisible"
                name="isVisible"
                checked={formData.announcement.isVisible}
                onChange={handleAnnouncementChange}
                className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
              <label htmlFor="isVisible" className="font-medium text-brand-dark">
                Show Announcement Bar
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-sm font-medium text-brand-dark/80 mb-1">Main Text</label>
                <input
                  type="text"
                  name="text"
                  value={formData.announcement.text}
                  onChange={handleAnnouncementChange}
                  className="w-full rounded-xl bg-gray-50 border-gray-200 px-4 py-2 text-brand-dark focus:ring-2 focus:ring-brand-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark/80 mb-1">Highlight Text (e.g. $50)</label>
                <input
                  type="text"
                  name="highlightText"
                  value={formData.announcement.highlightText}
                  onChange={handleAnnouncementChange}
                  className="w-full rounded-xl bg-gray-50 border-gray-200 px-4 py-2 text-brand-dark focus:ring-2 focus:ring-brand-primary/50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-brand-dark/80 mb-1">Promo Code</label>
                <input
                  type="text"
                  name="code"
                  value={formData.announcement.code}
                  onChange={handleAnnouncementChange}
                  className="w-full rounded-xl bg-gray-50 border-gray-200 px-4 py-2 text-brand-dark focus:ring-2 focus:ring-brand-primary/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hero Banner Settings */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-brand-primary/10 rounded-lg">
              <ImageIcon className="h-5 w-5 text-brand-primary" />
            </div>
            <h2 className="text-xl font-bold text-brand-dark">Hero Banner</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-dark/80 mb-1">Title Start</label>
                <input
                  type="text"
                  name="title"
                  value={formData.hero.title}
                  onChange={handleHeroChange}
                  className="w-full rounded-xl bg-gray-50 border-gray-200 px-4 py-2 text-brand-dark focus:ring-2 focus:ring-brand-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark/80 mb-1">Highlighted Word</label>
                <input
                  type="text"
                  name="highlightTitle"
                  value={formData.hero.highlightTitle}
                  onChange={handleHeroChange}
                  className="w-full rounded-xl bg-gray-50 border-gray-200 px-4 py-2 text-brand-dark focus:ring-2 focus:ring-brand-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark/80 mb-1">Title End</label>
                <input
                  type="text"
                  name="subtitle"
                  value={formData.hero.subtitle}
                  onChange={handleHeroChange}
                  className="w-full rounded-xl bg-gray-50 border-gray-200 px-4 py-2 text-brand-dark focus:ring-2 focus:ring-brand-primary/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-dark/80 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.hero.description}
                onChange={handleHeroChange}
                rows={2}
                className="w-full rounded-xl bg-gray-50 border-gray-200 px-4 py-2 text-brand-dark focus:ring-2 focus:ring-brand-primary/50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-dark/80 mb-1">Background Image URL</label>
                <input
                  type="text"
                  name="imageUrl"
                  value={formData.hero.imageUrl}
                  onChange={handleHeroChange}
                  className="w-full rounded-xl bg-gray-50 border-gray-200 px-4 py-2 text-brand-dark focus:ring-2 focus:ring-brand-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark/80 mb-1">Button Text</label>
                <input
                  type="text"
                  name="buttonText"
                  value={formData.hero.buttonText}
                  onChange={handleHeroChange}
                  className="w-full rounded-xl bg-gray-50 border-gray-200 px-4 py-2 text-brand-dark focus:ring-2 focus:ring-brand-primary/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Category Images Settings */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-brand-primary/10 rounded-lg">
              <ImageIcon className="h-5 w-5 text-brand-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-dark">Category Images (Box Office)</h2>
              <p className="text-sm text-gray-500">Set the background images for the main categories in the Box Office page.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-dark/80 mb-1">Movies (أفلام)</label>
                <input
                  type="text"
                  name="movies"
                  value={formData.categoryImages?.movies || ""}
                  onChange={handleCategoryImagesChange}
                  placeholder="Image URL"
                  className="w-full rounded-xl bg-gray-50 border-gray-200 px-4 py-2 text-brand-dark focus:ring-2 focus:ring-brand-primary/50"
                />
                {formData.categoryImages?.movies?.includes('google.com/url') && (
                  <p className="mt-1 text-[10px] text-amber-600 font-bold">⚠️ Google Redirect detected - cleaning automatically...</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark/80 mb-1">TV Shows (مسلسلات)</label>
                <input
                  type="text"
                  name="tvShows"
                  value={formData.categoryImages?.tvShows || ""}
                  onChange={handleCategoryImagesChange}
                  placeholder="Image URL"
                  className="w-full rounded-xl bg-gray-50 border-gray-200 px-4 py-2 text-brand-dark focus:ring-2 focus:ring-brand-primary/50"
                />
                {formData.categoryImages?.tvShows?.includes('google.com/url') && (
                  <p className="mt-1 text-[10px] text-amber-600 font-bold">⚠️ Google Redirect detected - cleaning automatically...</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark/80 mb-1">Anime (انمي)</label>
                <input
                  type="text"
                  name="anime"
                  value={formData.categoryImages?.anime || ""}
                  onChange={handleCategoryImagesChange}
                  placeholder="Image URL"
                  className="w-full rounded-xl bg-gray-50 border-gray-200 px-4 py-2 text-brand-dark focus:ring-2 focus:ring-brand-primary/50"
                />
                {formData.categoryImages?.anime?.includes('google.com/url') && (
                  <p className="mt-1 text-[10px] text-amber-600 font-bold">⚠️ Google Redirect detected - cleaning automatically...</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Static Deployment Settings */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-primary/20 bg-gradient-to-br from-white to-black/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-dark rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-brand-dark">Export for GitHub Pages</h2>
                <p className="text-sm text-gray-500">Bake current database data directly into the source code for static hosting.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleExportData}
              disabled={isExporting}
              className="flex items-center gap-2 rounded-xl bg-black px-6 py-2 text-sm font-bold text-white hover:bg-black/80 transition-colors disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Export Data to File
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Clicking this button will download the latest database data (Products, Collections, and all Store Settings) and save it to the <code>public/static-data.json</code> file in your AI Studio project. Once successful, you can download the project and it will be completely static and ready to host on GitHub Pages without a backend!
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-brand-primary px-8 py-3 font-bold text-white hover:bg-brand-primary/90 transition-colors shadow-lg shadow-brand-primary/20 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
