import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { Edit, Trash2, Plus, Loader2, AlertCircle, Save, X, Film, CheckCircle2, Zap, PlusCircle } from "lucide-react";
import { cn, getDirectDriveLink, getImageUrl } from "../../lib/utils";
import { apiFetch } from "../../lib/api";
import { API_BASE_URL } from "../../config";
import toast from "react-hot-toast";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  genres: string[];
  images: { main: string; trailer: string; additional: string[] };
  hasColorVariants?: boolean;
  colors?: { name: string; image: string; secondaryImage?: string }[];
  inventory: { S: number; M: number; L: number };
  availableSizes: string[];
  isBoxOfficeHit: boolean;
  isGallery?: boolean;
  franchise?: string;
  collectionId?: string;
  subCollection?: string;
  collection?: {
    id: string;
    name: string;
    poster: string;
  };
  season?: string;
  isDirectorsCut?: boolean;
  isComingSoon?: boolean;
  isHidden?: boolean;
  btsContent?: {
    title: string;
    description: string;
    imageUrl: string;
  };
}

interface Collection {
  id: string;
  name: string;
  has_sub_collections?: boolean;
  sub_collections?: string[];
}

const DEFAULT_DESCRIPTION = `عيش دور الـ Main Character 🎬✨

جبنالك الهودي اللي تصميمه مستوحى من أشهر الأفلام والمسلسلات اللي كلنا بنحبها! ومكتفناش بالشكل وبس، إحنا ركزنا على أعلى جودة ممكنة.

الهودي مصنوع من قطن مصري 100%، يعني أنعم وأريح هودي ممكن تلبسه. والمفاجأة؟ مش بيوبر خالص! مهما غسلته ولبسته هيفضل كأنه لسة طالع من العلبة وشكله جديد دايماً.

قطن مصري 100% ☁️

مستوحى من الأفلام والمسلسلات 📺

ضد الوبر (مش بيوبر وبيعيش معاك!) ✨`;

const initialFormState = {
  title: "",
  description: DEFAULT_DESCRIPTION,
  price: 0,
  genres: "",
  images: { main: "", trailer: "", additional: [] as string[] },
  hasColorVariants: false,
  colors: [] as { name: string; image: string; secondaryImage?: string }[],
  inventory: { S: 0, M: 0, L: 0 },
  availableSizes: ["S", "M", "L"],
  isBoxOfficeHit: false,
  isGallery: false,
  franchise: "",
  collectionId: "",
  subCollection: "",
  season: "all-season",
  isDirectorsCut: false,
  isComingSoon: false,
  isHidden: false,
  btsContent: { title: "", description: "", imageUrl: "" },
};

export function ProductManager() {
  const { token } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedProducts(prev => 
      prev.length === products.length ? [] : products.map(p => p.id)
    );
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to cut these ${selectedProducts.length} scenes?`)) return;
    
    const loadingToast = toast.loading("Cutting scenes...");
    try {
      await Promise.all(selectedProducts.map(id => 
        apiFetch(`/api/admin/products/${id}`, {
          method: "DELETE"
        })
      ));
      
      setProducts(products.filter(p => !selectedProducts.includes(p.id)));
      setSelectedProducts([]);
      toast.success("Scenes cut successfully", { id: loadingToast });
    } catch (err: any) {
      toast.error("Failed to cut some scenes", { id: loadingToast });
    }
  };
  const [isSaving, setIsSaving] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const uploadFile = (file: File, key: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("image", file);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(prev => ({ ...prev, [key]: percentComplete }));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data.url);
          } catch (e) {
            reject(new Error("Invalid response from server"));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));

      xhr.open("POST", `${API_BASE_URL}/api/upload`);
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  };

  useEffect(() => {
    fetchProducts();
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const data = await apiFetch("/api/collections");
      setCollections(data);
    } catch (err: any) {
      console.error("Error fetching collections:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await apiFetch("/api/admin/products");
      
      // Check for duplicate IDs
      const ids = data.map((p: Product) => p.id);
      const uniqueIds = new Set(ids);
      if (ids.length !== uniqueIds.size) {
        console.error("Duplicate product IDs found!", ids);
      }
      
      setProducts(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    console.log("Editing product with ID:", product.id);
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price,
      genres: product.genres.join(", "),
      images: { 
        main: product.images.main, 
        trailer: product.images.trailer || "",
        additional: product.images.additional || []
      },
      hasColorVariants: !!product.hasColorVariants,
      colors: product.colors || [],
      inventory: { S: product.inventory.S, M: product.inventory.M, L: product.inventory.L },
      availableSizes: product.availableSizes || ["S", "M", "L"],
      isBoxOfficeHit: product.isBoxOfficeHit,
      isGallery: !!product.isGallery,
      franchise: product.franchise || "",
      collectionId: product.collectionId || "",
      subCollection: product.subCollection || "",
      season: product.season || "all-season",
      isDirectorsCut: !!product.isDirectorsCut,
      isComingSoon: !!product.isComingSoon,
      isHidden: !!product.isHidden,
      btsContent: product.btsContent || { title: "", description: "", imageUrl: "" },
    });
    setEditingId(product.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDuplicate = (product: Product) => {
    console.log("Duplicating product with ID:", product.id);
    setFormData({
      title: `${product.title} (Copy)`,
      description: product.description,
      price: product.price,
      genres: product.genres.join(", "),
      images: { 
        main: product.images.main, 
        trailer: product.images.trailer || "",
        additional: product.images.additional || []
      },
      hasColorVariants: !!product.hasColorVariants,
      colors: product.colors || [],
      inventory: { S: product.inventory.S, M: product.inventory.M, L: product.inventory.L },
      availableSizes: product.availableSizes || ["S", "M", "L"],
      isBoxOfficeHit: product.isBoxOfficeHit,
      isGallery: !!product.isGallery,
      franchise: product.franchise || "",
      collectionId: product.collectionId || "",
      subCollection: product.subCollection || "",
      season: product.season || "all-season",
      isDirectorsCut: !!product.isDirectorsCut,
      isComingSoon: !!product.isComingSoon,
      isHidden: !!product.isHidden,
      btsContent: product.btsContent || { title: "", description: "", imageUrl: "" },
    });
    setEditingId(null); // It's a new product
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.success("Product duplicated! You can now edit and save it as a new product.");
  };

  const handleDelete = async (id: string) => {
    console.log("Deleting product with ID:", id);
    if (!window.confirm("Are you sure you want to cut this product from the scene?")) return;
    
    const loadingToast = toast.loading("Cutting scene...");
    try {
      await apiFetch(`/api/admin/products/${id}`, {
        method: "DELETE"
      });
      setProducts(products.filter(p => p.id !== id));
      toast.success("Scene cut successfully", { id: loadingToast });
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err.message, { id: loadingToast });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting form. Editing ID:", editingId);
    setIsSaving(true);

    const payload = {
      ...formData,
      genres: formData.genres ? [formData.genres] : [],
    };

    try {
      const url = editingId ? `/api/admin/products/${editingId}` : "/api/admin/products";
      const method = editingId ? "PUT" : "POST";
      console.log("Request URL:", url, "Method:", method);

      await apiFetch(url, {
        method,
        body: payload
      });
      
      await fetchProducts();
      toast.success(editingId ? "Scene updated!" : "New hoodie added to the Set List!");
      setIsFormOpen(false);
      setFormData(initialFormState);
      setEditingId(null);
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

// ... (rest of imports)

// Inside ProductManager component

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-primary" /></div>;
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-brand-dark font-brand italic flex items-center gap-3">
            <Film className="h-8 w-8 text-brand-primary" />
            The Set List
          </h1>
          <p className="text-xs text-brand-dark/60 uppercase tracking-[0.2em] mt-1">Production Inventory Management</p>
        </div>
        <button
          onClick={() => {
            if (isFormOpen) {
              setFormData(initialFormState);
              setEditingId(null);
            }
            setIsFormOpen(!isFormOpen);
          }}
          className={cn(
            "flex items-center gap-2 rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-sm",
            isFormOpen 
              ? "bg-gray-200 hover:bg-gray-300 text-brand-dark" 
              : "bg-brand-primary hover:bg-brand-light text-white shadow-brand-primary/20"
          )}
        >
          {isFormOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {isFormOpen ? "Close Script" : "New Scene"}
        </button>
      </div>

      {isFormOpen && (
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-6">
            <h2 className="text-xl font-black uppercase tracking-widest text-brand-dark font-brand italic">
              {editingId ? "Edit Scene" : "Draft New Scene"}
            </h2>
            <div className="flex gap-2">
              <div className="h-1 w-8 bg-brand-primary rounded-full"></div>
              <div className="h-1 w-2 bg-gray-200 rounded-full"></div>
              <div className="h-1 w-2 bg-gray-200 rounded-full"></div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-dark/60">Movie Title</label>
                <input
                  type="text" required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Inception"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-brand-dark focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-dark/60">
                  Box Office Price (EGP) 
                  {formData.isGallery && <span className="ml-2 text-amber-600 normal-case italic">(Overridden for Gallery)</span>}
                </label>
                <input
                  type="number" required min="0" step="0.01"
                  value={formData.price}
                  disabled={formData.isGallery}
                  onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                  className={cn(
                    "w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-brand-dark focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 focus:outline-none transition-all",
                    formData.isGallery && "opacity-50 cursor-not-allowed"
                  )}
                />
                {formData.isGallery && (
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1">
                    Posters are fixed: 20*30 = 150 EGP | 40*60 = 250 EGP
                  </p>
                )}
              </div>
              <div className="space-y-3 md:col-span-2">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-dark/60">Franchise / Universe (Collection)</label>
                <select
                  value={formData.collectionId}
                  onChange={e => {
                    const selectedId = e.target.value;
                    const selectedCol = collections.find(c => c.id === selectedId);
                    setFormData({
                      ...formData, 
                      collectionId: selectedId,
                      franchise: selectedCol ? selectedCol.name : "",
                      subCollection: "" // Reset sub-collection when collection changes
                    });
                  }}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-brand-dark focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 focus:outline-none transition-all"
                >
                  <option value="">None (Standalone)</option>
                  {collections.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {formData.collectionId && collections.find(c => c.id === formData.collectionId)?.has_sub_collections && (
                <div className="space-y-3 md:col-span-2">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-dark/60">Sub-Collection</label>
                  <select
                    value={formData.subCollection}
                    onChange={e => setFormData({...formData, subCollection: e.target.value})}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-brand-dark focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 focus:outline-none transition-all"
                  >
                    <option value="">None</option>
                    {collections.find(c => c.id === formData.collectionId)?.sub_collections?.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-dark/60">Season (الموسم)</label>
                <select
                  value={formData.season}
                  onChange={e => setFormData({...formData, season: e.target.value})}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-brand-dark focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 focus:outline-none transition-all"
                >
                  <option value="all-season">All Season (كل الفصول)</option>
                  <option value="summer">Summer (صيفي)</option>
                  <option value="winter">Winter (شتوي)</option>
                </select>
              </div>

              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    id="isGallery"
                    checked={formData.isGallery}
                    onChange={e => setFormData({...formData, isGallery: e.target.checked})}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 bg-white checked:bg-brand-primary checked:border-brand-primary transition-all"
                  />
                  <CheckCircle2 className="absolute h-5 w-5 text-brand-dark opacity-0 peer-checked:opacity-100 pointer-events-none p-0.5" />
                </div>
                <label htmlFor="isGallery" className="text-xs font-black uppercase tracking-widest text-brand-dark/60 cursor-pointer select-none">
                  The Gallery Piece (بوستر جداري)
                </label>
              </div>


              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-dark/60">Poster (Main Image)</label>
                  {uploadProgress['main'] !== undefined && uploadProgress['main'] < 100 && (
                    <span className="text-xs font-bold text-brand-primary">{uploadProgress['main']}%</span>
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    type="url"
                    value={formData.images.main}
                    onChange={e => {
                      const directLink = getDirectDriveLink(e.target.value);
                      setFormData(prev => ({...prev, images: {...prev.images, main: directLink}}));
                    }}
                    placeholder="Paste image URL or Google Drive link..."
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-brand-dark focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 focus:outline-none transition-all"
                  />
                  <div className="relative">
                    <input
                      type="file" accept="image/*"
                      disabled={isUploading}
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsUploading(true);
                        setUploadProgress(prev => ({ ...prev, main: 0 }));
                        try {
                          const url = await uploadFile(file, 'main');
                          setFormData(prev => ({...prev, images: {...prev.images, main: url}}));
                          toast.success("Image uploaded successfully");
                        } catch (err: any) {
                          toast.error("Failed to upload image");
                        } finally {
                          setIsUploading(false);
                          setUploadProgress(prev => { const newP = {...prev}; delete newP['main']; return newP; });
                          e.target.value = "";
                        }
                      }}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-brand-dark focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 focus:outline-none transition-all disabled:opacity-50"
                    />
                  </div>
                  <p className="text-[10px] text-amber-600 font-bold mt-1">
                    💡 If using Google Drive, set to "Anyone with the link" (أي شخص لديه الرابط).
                  </p>
                </div>
                {uploadProgress['main'] !== undefined && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div className="bg-brand-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress['main']}%` }}></div>
                  </div>
                )}
                {formData.images.main ? <img src={getDirectDriveLink(formData.images.main)} alt="Main" className="h-20 w-20 object-cover mt-2 rounded-xl" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.border = '2px solid red'; }} /> : null}
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-dark/60">Hover Image (Secondary)</label>
                  {uploadProgress['trailer'] !== undefined && uploadProgress['trailer'] < 100 && (
                    <span className="text-xs font-bold text-brand-primary">{uploadProgress['trailer']}%</span>
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    type="url"
                    value={formData.images.trailer}
                    onChange={e => {
                      const directLink = getDirectDriveLink(e.target.value);
                      setFormData(prev => ({...prev, images: {...prev.images, trailer: directLink}}));
                    }}
                    placeholder="Paste image URL or Google Drive link..."
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-brand-dark focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 focus:outline-none transition-all"
                  />
                  <div className="relative">
                    <input
                      type="file" accept="image/*"
                      disabled={isUploading}
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsUploading(true);
                        setUploadProgress(prev => ({ ...prev, trailer: 0 }));
                        try {
                          const url = await uploadFile(file, 'trailer');
                          setFormData(prev => ({...prev, images: {...prev.images, trailer: url}}));
                          toast.success("Image uploaded successfully");
                        } catch (err: any) {
                          toast.error("Failed to upload image");
                        } finally {
                          setIsUploading(false);
                          setUploadProgress(prev => { const newP = {...prev}; delete newP['trailer']; return newP; });
                          e.target.value = "";
                        }
                      }}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-brand-dark focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 focus:outline-none transition-all disabled:opacity-50"
                    />
                  </div>
                  <p className="text-[10px] text-amber-600 font-bold mt-1">
                    💡 If using Google Drive, set to "Anyone with the link" (أي شخص لديه الرابط).
                  </p>
                </div>
                {uploadProgress['trailer'] !== undefined && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div className="bg-brand-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress['trailer']}%` }}></div>
                  </div>
                )}
                {formData.images.trailer ? <img src={getDirectDriveLink(formData.images.trailer)} alt="Trailer" className="h-20 w-20 object-cover mt-2 rounded-xl" referrerPolicy="no-referrer" /> : null}
              </div>
              <div className="space-y-3 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-dark/60">Additional Images</label>
                  {uploadProgress['additional'] !== undefined && uploadProgress['additional'] < 100 && (
                    <span className="text-xs font-bold text-brand-primary">{uploadProgress['additional']}%</span>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        id="additional-url-input"
                        placeholder="Paste image URL or Google Drive link..."
                        className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-brand-dark focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 focus:outline-none transition-all"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.currentTarget;
                            const url = getDirectDriveLink(input.value);
                            if (url) {
                              setFormData(prev => ({
                                ...prev,
                                images: {
                                  ...prev.images,
                                  additional: [...prev.images.additional, url]
                                }
                              }));
                              input.value = "";
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('additional-url-input') as HTMLInputElement;
                          const url = getDirectDriveLink(input.value);
                          if (url) {
                            setFormData(prev => ({
                              ...prev,
                              images: {
                                ...prev.images,
                                additional: [...prev.images.additional, url]
                              }
                            }));
                            input.value = "";
                          }
                        }}
                        className="rounded-2xl bg-brand-primary px-6 text-xs font-black uppercase tracking-widest text-white hover:bg-brand-light transition-all"
                      >
                        Add URL
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="file" accept="image/*" multiple
                        disabled={isUploading}
                        onChange={async e => {
                          const files = e.target.files;
                          if (!files || files.length === 0) return;
                          
                          setIsUploading(true);
                          setUploadProgress(prev => ({ ...prev, additional: 0 }));
                          try {
                            const newUrls = [];
                            for (let i = 0; i < files.length; i++) {
                              const url = await uploadFile(files[i], `additional_${i}`);
                              newUrls.push(url);
                              setUploadProgress(prev => ({ ...prev, additional: Math.round(((i + 1) / files.length) * 100) }));
                            }
                            
                            setFormData(prev => ({
                              ...prev, 
                              images: {
                                ...prev.images, 
                                additional: [...prev.images.additional, ...newUrls]
                              }
                            }));
                            toast.success("Images uploaded successfully");
                          } catch (err: any) {
                            toast.error("Failed to upload some images");
                          } finally {
                            setIsUploading(false);
                            setUploadProgress(prev => { 
                              const newP = {...prev}; 
                              delete newP['additional']; 
                              for (let i = 0; i < files.length; i++) delete newP[`additional_${i}`];
                              return newP; 
                            });
                            e.target.value = "";
                          }
                        }}
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-brand-dark focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 focus:outline-none transition-all disabled:opacity-50"
                      />
                    </div>
                    <p className="text-[10px] text-amber-600 font-bold mt-1">
                      💡 If using Google Drive, set to "Anyone with the link" (أي شخص لديه الرابط).
                    </p>
                  </div>
                </div>
                {uploadProgress['additional'] !== undefined && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div className="bg-brand-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress['additional']}%` }}></div>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.images.additional.map((url, index) => (
                    <div key={`${url}-${index}`} className="relative">
                      {url ? <img src={getDirectDriveLink(url)} alt={`Additional ${index}`} className="h-20 w-20 object-cover rounded-xl" referrerPolicy="no-referrer" /> : null}
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          images: {
                            ...prev.images,
                            additional: prev.images.additional.filter((_, i) => i !== index)
                          }
                        }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-brand-dark rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3 md:col-span-2 border-t border-gray-100 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-dark/60">Color Variants (الوان المنتج)</label>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.hasColorVariants}
                      onChange={e => {
                        const enabled = e.target.checked;
                        let newColors = [...formData.colors];
                        if (enabled && newColors.length === 0) {
                          newColors = [
                            { name: "White", image: "", secondaryImage: "" },
                            { name: "Black", image: "", secondaryImage: "" }
                          ];
                        }
                        setFormData({...formData, hasColorVariants: enabled, colors: newColors});
                      }}
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                    <span className="ms-3 text-xs font-bold text-gray-500 uppercase tracking-widest">{formData.hasColorVariants ? 'Enabled' : 'Disabled'}</span>
                  </label>
                </div>
                
                {formData.hasColorVariants && (
                  <div className="space-y-4">
                    {formData.colors.map((color, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-white border-2 border-gray-100 rounded-[2rem] shadow-sm relative group/color">
                        <div className="md:col-span-2 flex items-center justify-between">
                           <input
                            type="text"
                            value={color.name}
                            onChange={e => {
                              const newColors = [...formData.colors];
                              newColors[index].name = e.target.value;
                              setFormData({...formData, colors: newColors});
                            }}
                            placeholder="Color Name (e.g. Red / أحمر)"
                            className="bg-transparent border-none p-0 text-lg font-brand font-black tracking-tight text-brand-dark focus:ring-0 placeholder:text-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newColors = formData.colors.filter((_, i) => i !== index);
                              setFormData({...formData, colors: newColors});
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/40">Poster (Main Image)</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="url"
                              value={color.image}
                              onChange={e => {
                                const newColors = [...formData.colors];
                                newColors[index].image = getDirectDriveLink(e.target.value);
                                setFormData({...formData, colors: newColors});
                              }}
                              placeholder="Direct Drive Link"
                              className="flex-1 rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-mono"
                            />
                            <input
                              type="file" accept="image/*"
                              onChange={async e => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setIsUploading(true);
                                try {
                                  const url = await uploadFile(file, `color_${index}_main`);
                                  const newColors = [...formData.colors];
                                  newColors[index].image = url;
                                  setFormData({...formData, colors: newColors});
                                } catch (err: any) {
                                  toast.error("Upload failed");
                                } finally {
                                  setIsUploading(false);
                                }
                              }}
                              className="hidden"
                              id={`upload-color-${index}-main`}
                            />
                            <label htmlFor={`upload-color-${index}-main`} className="p-2 bg-brand-primary/5 text-brand-primary rounded-xl cursor-pointer hover:bg-brand-primary/10">
                              <Plus className="h-4 w-4" />
                            </label>
                          </div>
                          {color.image && (
                            <img src={getImageUrl(color.image)} alt="Preview" className="h-20 w-16 object-cover rounded-xl border border-gray-200" referrerPolicy="no-referrer" />
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/40">Hover Image (Secondary)</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="url"
                              value={color.secondaryImage || ""}
                              onChange={e => {
                                const newColors = [...formData.colors];
                                newColors[index].secondaryImage = getDirectDriveLink(e.target.value);
                                setFormData({...formData, colors: newColors});
                              }}
                              placeholder="Direct Drive Link"
                              className="flex-1 rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-mono"
                            />
                            <input
                              type="file" accept="image/*"
                              onChange={async e => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setIsUploading(true);
                                try {
                                  const url = await uploadFile(file, `color_${index}_hover`);
                                  const newColors = [...formData.colors];
                                  newColors[index].secondaryImage = url;
                                  setFormData({...formData, colors: newColors});
                                } catch (err: any) {
                                  toast.error("Upload failed");
                                } finally {
                                  setIsUploading(false);
                                }
                              }}
                              className="hidden"
                              id={`upload-color-${index}-hover`}
                            />
                            <label htmlFor={`upload-color-${index}-hover`} className="p-2 bg-brand-primary/5 text-brand-primary rounded-xl cursor-pointer hover:bg-brand-primary/10">
                              <Plus className="h-4 w-4" />
                            </label>
                          </div>
                          {color.secondaryImage && (
                            <img src={getImageUrl(color.secondaryImage)} alt="Hover Preview" className="h-20 w-16 object-cover rounded-xl border border-gray-200" referrerPolicy="no-referrer" />
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, colors: [...formData.colors, { name: "", image: "", secondaryImage: "" }]})}
                      className="flex items-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 p-4 text-xs font-black uppercase tracking-widest text-brand-dark/40 hover:border-brand-primary hover:text-brand-primary transition-all w-full justify-center"
                    >
                      <Plus className="h-4 w-4" /> Add Color Option
                    </button>
                  </div>
                )}
              </div>

              {!formData.isGallery && (
                <div className="space-y-3 md:col-span-2">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-dark/60">Available Sizes</label>
                  <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                    {["S", "M", "L", "XL", "XXL", "3XL"].map((size) => (
                      <label key={size} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.availableSizes.includes(size)}
                          onChange={e => {
                            const newSizes = e.target.checked
                              ? [...formData.availableSizes, size]
                              : formData.availableSizes.filter(s => s !== size);
                            setFormData({...formData, availableSizes: newSizes});
                          }}
                          className="h-5 w-5 accent-brand-primary"
                        />
                        <span className="text-sm font-bold text-brand-dark">{size}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="isBoxOfficeHit"
                  checked={formData.isBoxOfficeHit}
                  onChange={e => setFormData({...formData, isBoxOfficeHit: e.target.checked})}
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 bg-white checked:bg-brand-primary checked:border-brand-primary transition-all"
                />
                <CheckCircle2 className="absolute h-5 w-5 text-brand-dark opacity-0 peer-checked:opacity-100 pointer-events-none p-0.5" />
              </div>
              <label htmlFor="isBoxOfficeHit" className="text-xs font-black uppercase tracking-widest text-brand-dark/60 cursor-pointer select-none">
                Mark as Box Office Hit (Featured)
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    id="isDirectorsCut"
                    checked={formData.isDirectorsCut}
                    onChange={e => setFormData({...formData, isDirectorsCut: e.target.checked})}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 bg-white checked:bg-brand-light checked:border-brand-light transition-all"
                  />
                  <Zap className="absolute h-5 w-5 text-brand-dark opacity-0 peer-checked:opacity-100 pointer-events-none p-0.5" />
                </div>
                <label htmlFor="isDirectorsCut" className="text-xs font-black uppercase tracking-widest text-brand-dark/60 cursor-pointer select-none">
                  Director's Cut Edition
                </label>
              </div>
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    id="isComingSoon"
                    checked={formData.isComingSoon}
                    onChange={e => setFormData({...formData, isComingSoon: e.target.checked})}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 bg-white checked:bg-brand-primary checked:border-brand-primary transition-all"
                  />
                  <CheckCircle2 className="absolute h-5 w-5 text-brand-dark opacity-0 peer-checked:opacity-100 pointer-events-none p-0.5" />
                </div>
                <label htmlFor="isComingSoon" className="text-xs font-black uppercase tracking-widest text-brand-dark/60 cursor-pointer select-none">
                  Coming Soon (Waitlist)
                </label>
              </div>
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    id="isHidden"
                    checked={formData.isHidden}
                    onChange={e => setFormData({...formData, isHidden: e.target.checked})}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 bg-white checked:bg-red-500 checked:border-red-500 transition-all"
                  />
                  <X className="absolute h-5 w-5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none p-0.5" />
                </div>
                <label htmlFor="isHidden" className="text-xs font-black uppercase tracking-widest text-brand-dark/60 cursor-pointer select-none">
                  Hide from Shop (Internal Only)
                </label>
              </div>
              <div className="space-y-3 md:col-span-2">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-dark/60">BTS Content (Title, Description, Image URL)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={formData.btsContent?.title || ""}
                    onChange={e => setFormData({...formData, btsContent: {...formData.btsContent!, title: e.target.value}})}
                    placeholder="BTS Title"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-brand-dark focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 focus:outline-none transition-all"
                  />
                  <input
                    type="text"
                    value={formData.btsContent?.description || ""}
                    onChange={e => setFormData({...formData, btsContent: {...formData.btsContent!, description: e.target.value}})}
                    placeholder="BTS Description"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-brand-dark focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 focus:outline-none transition-all"
                  />
                  <input
                    type="url"
                    value={formData.btsContent?.imageUrl || ""}
                    onChange={e => setFormData({...formData, btsContent: {...formData.btsContent!, imageUrl: e.target.value}})}
                    placeholder="BTS Image URL"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-brand-dark focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-2xl px-8 py-3 text-xs font-black uppercase tracking-widest text-brand-dark/60 hover:bg-gray-100 hover:text-brand-dark transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isUploading}
                className="flex items-center gap-2 rounded-2xl bg-brand-primary px-10 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-brand-light disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(58,134,255,0.2)]"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving ? "Saving..." : "Save Scene"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* The Cast List (Inventory Table) */}
      <div className="rounded-3xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest text-brand-dark/60">The Cast List</h3>
          <div className="flex gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-brand-primary"></div>
            <div className="h-1.5 w-1.5 rounded-full bg-brand-dark/20"></div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {selectedProducts.length > 0 && (
            <div className="flex items-center justify-between bg-brand-primary/10 p-4 border-b border-brand-primary/20">
              <span className="text-xs font-black uppercase tracking-widest text-brand-primary">
                {selectedProducts.length} Products Selected
              </span>
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 rounded-full bg-brand-primary/20 px-4 py-2 text-xs font-black uppercase tracking-widest text-brand-primary hover:bg-brand-primary/30 transition-all"
              >
                <Trash2 className="h-3 w-3" /> Delete Selected
              </button>
            </div>
          )}
          <table className="w-full text-left text-sm text-brand-dark/70">
            <thead className="bg-white text-xs uppercase tracking-[0.2em] text-brand-dark/60 border-b border-gray-100">
              <tr>
                <th className="px-8 py-6 font-black">
                  <input type="checkbox" checked={selectedProducts.length === products.length && products.length > 0} onChange={toggleSelectAll} className="accent-brand-primary" />
                </th>
                <th className="px-8 py-6 font-black">Title</th>
                <th className="px-8 py-6 font-black">Collection</th>
                <th className="px-8 py-6 font-black">Price</th>
                <th className="px-8 py-6 font-black">Hit</th>
                <th className="px-8 py-6 font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.length > 0 ? (
                products.map((product, index) => (
                  <tr key={`${product.id}-${index}`} className={cn("hover:bg-gray-50 transition-all duration-300 group", selectedProducts.includes(product.id) && "bg-brand-primary/5")}>
                    <td className="px-8 py-6">
                      <input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={() => toggleProductSelection(product.id)} className="accent-brand-primary" />
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-12 rounded-xl bg-gray-100 overflow-hidden border border-gray-200 group-hover:border-brand-primary/50 transition-all">
                          {product.images?.main ? (
                            <img src={getDirectDriveLink(product.images.main) || undefined} alt={product.title} className="h-full w-full object-cover opacity-80 group-hover:opacity-100" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="h-full w-full bg-gray-200" />
                          )}
                        </div>
                        <span className="font-bold text-brand-dark transition-colors uppercase tracking-tight">{product.title}</span>
                        {product.isGallery && (
                          <span className="ml-2 rounded-full bg-brand-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-brand-primary border border-brand-primary/20">
                            Gallery
                          </span>
                        )}
                        {product.isHidden && (
                          <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-red-600 border border-red-200">
                            Hidden
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-widest text-brand-dark/40">
                          {product.collection?.name || "Standalone"}
                        </span>
                        {product.subCollection && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary mt-1">
                            ↳ {product.subCollection}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 font-mono text-brand-dark/60">{product.price.toLocaleString('ar-EG')} ج.م</td>
                    <td className="px-8 py-6">
                      {product.isBoxOfficeHit ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-black text-brand-primary border border-brand-primary/20 shadow-sm">
                          <Film className="h-3 w-3" /> HIT
                        </span>
                      ) : (
                        <span className="text-brand-dark/60 text-xs font-black uppercase tracking-widest">Indie</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleDuplicate(product)} title="Duplicate" className="p-3 rounded-2xl text-brand-dark/60 hover:text-brand-primary hover:bg-brand-primary/10 transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                        </button>
                        <button onClick={() => handleEdit(product)} title="Edit" className="p-3 rounded-2xl text-brand-dark/60 hover:text-brand-dark hover:bg-gray-100 transition-all">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} title="Delete" className="p-3 rounded-2xl text-brand-dark/60 hover:text-brand-primary hover:bg-brand-primary/10 transition-all">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr key="no-products">
                  <td colSpan={6} className="px-8 py-20 text-center text-brand-dark/60 italic">
                    No products found. Time to write a new script.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
