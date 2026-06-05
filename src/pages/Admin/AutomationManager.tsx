import React, { useState, useEffect } from "react";
import { Film, CheckCircle2, Loader2, Save, Trash2, X, Plus } from "lucide-react";
import { cn, getDirectDriveLink } from "../../lib/utils";
import { apiFetch } from "../../lib/api";
import toast from "react-hot-toast";

interface FetchedItem {
  url: string;
  title: string;
  error?: boolean;
}

interface ProcessedItem {
  title: string;
  image: string;
}

interface Collection {
  id: string;
  name: string;
  has_sub_collections?: boolean;
  sub_collections?: string[];
}

export function AutomationManager() {
  const [urlsInput, setUrlsInput] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [fetchedItems, setFetchedItems] = useState<FetchedItem[]>([]);
  const [processedItems, setProcessedItems] = useState<ProcessedItem[]>([]);
  
  // Batch Properties
  const [price, setPrice] = useState(499);
  const [season, setSeason] = useState("all-season");
  const [collectionId, setCollectionId] = useState("");
  const [franchise, setFranchise] = useState("");
  const [subCollection, setSubCollection] = useState("");
  const [isGallery, setIsGallery] = useState(false);
  
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const data = await apiFetch("/api/collections");
      setCollections(data);
    } catch (err: any) {
      toast.error("Error fetching collections");
    }
  };

  const handleFetch = async () => {
    // Extract all Google Drive URLs using Regex to handle varying separators (commas, newlines, spaces)
    const urlRegex = /https:\/\/drive\.google\.com\/[^\s,"]+/g;
    const matched = urlsInput.match(urlRegex);
    const urls = matched ? Array.from(new Set(matched)) : [];

    if (urls.length === 0) {
      return toast.error("Please enter at least one valid Google Drive URL");
    }

    setIsFetching(true);
    setFetchedItems([]);
    setProcessedItems([]);
    try {
      const data = await apiFetch("/api/admin/automation/fetch-titles", {
        method: "POST",
        body: { urls }
      });
      
      setFetchedItems(data.results);
      
      // Auto-process titles
      const initialProcessed = data.results.filter((r: any) => !r.error).map((r: any) => {
        // Simple clean up for drive titles: Remove " - Google Drive", ".png", ".jpg"
        let cleanTitle = r.title.replace(" - Google Drive", "").replace(/\.(png|jpg|jpeg)$/i, "").trim();
        return {
          title: cleanTitle,
          image: getDirectDriveLink(r.url) || r.url
        };
      });
      setProcessedItems(initialProcessed);
      if(data.results.some((r: any) => r.error)) {
        toast.error("Some URLs failed to fetch.");
      } else {
        toast.success("All URLs fetched successfully!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch titles");
    } finally {
      setIsFetching(false);
    }
  };

  const handleSaveBulk = async () => {
    if (processedItems.length === 0) return toast.error("No items to save");
    
    setIsSaving(true);
    let successCount = 0;
    
    const loadingToast = toast.loading(`Saving 0/${processedItems.length} items...`);
    
    for (let i = 0; i < processedItems.length; i++) {
      const item = processedItems[i];
      const payload = {
        title: item.title,
        description: "",
        price: price,
        genres: isGallery ? ["لوحة"] : ["أنمي"], // Just a default placeholder
        images: { main: item.image, trailer: "", additional: [] },
        hasColorVariants: false,
        colors: [],
        inventory: { S: 100, M: 100, L: 100 },
        availableSizes: ["S", "M", "L", "XL", "XXL"],
        isBoxOfficeHit: false,
        isGallery: isGallery,
        franchise: franchise,
        collectionId: collectionId,
        subCollection: subCollection,
        season: season,
        isDirectorsCut: false,
        isComingSoon: false,
        isHidden: false,
        btsContent: { title: "", description: "", imageUrl: "" }
      };

      try {
        await apiFetch("/api/admin/products", {
          method: "POST",
          body: payload
        });
        successCount++;
        toast.loading(`Saving ${successCount}/${processedItems.length} items...`, { id: loadingToast });
      } catch (err) {
        console.error(`Failed to save ${item.title}:`, err);
      }
    }
    
    if (successCount === processedItems.length) {
      toast.success(`Successfully saved all ${successCount} items!`, { id: loadingToast });
      setProcessedItems([]);
      setFetchedItems([]);
      setUrlsInput("");
    } else {
      toast.error(`Saved ${successCount} of ${processedItems.length} items. Errors occurred.`, { id: loadingToast });
    }
    setIsSaving(false);
  };

  const updateItemTitle = (index: number, newTitle: string) => {
    const newItems = [...processedItems];
    newItems[index].title = newTitle;
    setProcessedItems(newItems);
  };

  const removeItem = (index: number) => {
    setProcessedItems(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tighter text-brand-dark font-brand italic flex items-center gap-3">
          Automation Hub
        </h1>
        <p className="text-xs text-brand-dark/60 uppercase tracking-[0.2em] mt-1">Batch import from Google Drive links</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-50 rounded-3xl p-6 border border-gray-200">
            <h2 className="text-sm font-black uppercase tracking-widest text-brand-dark mb-4">1. Drive Links</h2>
            <textarea
              value={urlsInput}
              onChange={e => setUrlsInput(e.target.value)}
              placeholder="Paste Google Drive links here (one per line)..."
              className="w-full h-48 rounded-2xl border border-gray-200 bg-white p-4 text-xs font-mono text-brand-dark focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 focus:outline-none transition-all resize-none shadow-sm"
            />
            <button
              onClick={handleFetch}
              disabled={isFetching || urlsInput.trim() === ""}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl bg-brand-primary py-3 text-xs font-black uppercase tracking-widest text-white shadow-sm hover:bg-brand-primary/90 transition-all disabled:opacity-50"
            >
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Fetch Data
            </button>
          </div>

          <div className="bg-gray-50 rounded-3xl p-6 border border-gray-200 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-brand-dark mb-4">2. Batch Settings</h2>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark/60">Price (EGP)</label>
              <input
                type="number" value={price} onChange={e => setPrice(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark/60">Season</label>
              <select
                value={season} onChange={e => setSeason(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 focus:outline-none transition-all"
              >
                <option value="all-season">All Season (كل الفصول)</option>
                <option value="summer">Summer (صيفي)</option>
                <option value="winter">Winter (شتوي)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark/60">Collection / Franchise</label>
              <select
                value={collectionId}
                onChange={e => {
                  const id = e.target.value;
                  const col = collections.find(c => c.id === id);
                  setCollectionId(id);
                  setFranchise(col ? col.name : "");
                  setSubCollection("");
                }}
                className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 focus:outline-none transition-all"
              >
                <option value="">None</option>
                {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {collectionId && collections.find(c => c.id === collectionId)?.has_sub_collections && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark/60">Sub-Collection</label>
                <select
                  value={subCollection} onChange={e => setSubCollection(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 focus:outline-none transition-all"
                >
                  <option value="">None</option>
                  {collections.find(c => c.id === collectionId)?.sub_collections?.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox" id="gallery-bulk" checked={isGallery} onChange={e => setIsGallery(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
              <label htmlFor="gallery-bulk" className="text-xs font-bold font-sans text-brand-dark">Set as Gallery Items (Posters)</label>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {processedItems.length > 0 ? (
            <div className="bg-gray-50 rounded-3xl border border-gray-200 p-6 sm:p-8 overflow-hidden flex flex-col h-full">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-sm font-black uppercase tracking-widest text-brand-dark">3. Review & Edit ({processedItems.length})</h2>
                <button
                  onClick={handleSaveBulk}
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-full bg-brand-dark px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-brand-dark/90 transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save All to DB
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                {processedItems.map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-white border border-gray-100 group relative shadow-sm">
                    <img src={item.image} alt={item.title} className="w-20 h-24 object-cover rounded-xl bg-gray-100" referrerPolicy="no-referrer" />
                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark/60">Product Title</label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={e => updateItemTitle(idx, e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-brand-dark font-bold focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 focus:outline-none transition-all"
                      />
                    </div>
                    <button
                      onClick={() => removeItem(idx)}
                      className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-300">
              <Film className="h-12 w-12 text-brand-dark/20 mb-4" />
              <h3 className="text-lg font-black italic tracking-tighter text-brand-dark font-brand mb-2">No Items Yet</h3>
              <p className="text-sm text-brand-dark/60 max-w-md">Fetch links from the left panel to begin reviewing and editing product titles.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
