import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Clapperboard, Image as ImageIcon, Search, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiFetch } from "../../lib/api";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface Collection {
  id: string;
  name: string;
  poster_url: string;
  description: string;
  spotify_url?: string;
  status: 'available' | 'coming_soon';
  has_sub_collections?: boolean;
  sub_collections?: string[];
  category?: string;
}

export default function CollectionsManager() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    poster_url: "",
    description: "",
    spotify_url: "",
    status: 'available' as 'available' | 'coming_soon',
    has_sub_collections: false,
    sub_collections: [] as string[],
    category: "أفلام"
  });
  const [newSubCollection, setNewSubCollection] = useState("");

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/collections");
      setCollections(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Ensure status is explicitly set
    const payload = {
      ...formData,
      status: formData.status || 'available'
    };

    try {
      if (editingCollection) {
        await apiFetch(`/api/collections/${editingCollection.id}`, {
          method: "PUT",
          body: payload
        });
        setSuccess(`Collection "${formData.name}" updated to ${formData.status === 'coming_soon' ? 'Coming Soon' : 'Available'}!`);
      } else {
        await apiFetch("/api/collections", {
          method: "POST",
          body: payload
        });
        setSuccess(`Collection "${formData.name}" created as ${formData.status === 'coming_soon' ? 'Coming Soon' : 'Available'}!`);
      }
      
      setIsModalOpen(false);
      setEditingCollection(null);
      setFormData({ name: "", poster_url: "", description: "", spotify_url: "", status: 'available', has_sub_collections: false, sub_collections: [], category: "أفلام" });
      setNewSubCollection("");
      fetchCollections();
      
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this collection?")) return;
    
    try {
      await apiFetch(`/api/collections/${id}`, { method: "DELETE" });
      setSuccess("Collection deleted successfully!");
      fetchCollections();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openEditModal = (collection: Collection) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      poster_url: collection.poster_url || "",
      description: collection.description || "",
      spotify_url: collection.spotify_url || "",
      status: collection.status || 'available',
      has_sub_collections: collection.has_sub_collections || false,
      sub_collections: collection.sub_collections || [],
      category: collection.category || "أفلام"
    });
    setNewSubCollection("");
    setIsModalOpen(true);
  };

  const filteredCollections = collections.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-brand-dark italic flex items-center gap-3">
            <Clapperboard className="h-8 w-8 text-brand-primary" />
            Collections
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-dark/40 mt-1">
            Manage your movie and series franchises
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCollection(null);
            setFormData({ name: "", poster_url: "", description: "", spotify_url: "", status: 'available', has_sub_collections: false, sub_collections: [], category: "أفلام" });
            setNewSubCollection("");
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20"
        >
          <Plus className="h-4 w-4" />
          Add Collection
        </button>
      </div>

      {/* Status Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl flex items-center gap-3 text-xs font-bold uppercase tracking-widest"
          >
            <AlertCircle className="h-5 w-5" />
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-6 py-4 rounded-2xl flex items-center gap-3 text-xs font-bold uppercase tracking-widest"
          >
            <CheckCircle2 className="h-5 w-5" />
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Filter */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-dark/40" />
        <input
          type="text"
          placeholder="SEARCH COLLECTIONS..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-6 py-3 bg-gray-100 border-none rounded-2xl text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-brand-primary transition-all"
        />
      </div>

      {/* Collections Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-12 w-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-dark/40">Loading Collections...</p>
        </div>
      ) : filteredCollections.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <Clapperboard className="h-12 w-12 text-brand-dark/10 mx-auto mb-4" />
          <p className="text-xs font-bold uppercase tracking-widest text-brand-dark/40">No collections found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCollections.map((collection) => (
            <motion.div
              layout
              key={collection.id}
              className="group bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
            >
              <div className="aspect-[2/3] relative overflow-hidden bg-gray-100">
                {collection.poster_url ? (
                  <img
                    src={collection.poster_url}
                    alt={collection.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-brand-dark/10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => openEditModal(collection)}
                      className="flex-1 bg-white text-brand-dark p-3 rounded-xl hover:bg-brand-primary hover:text-white transition-colors flex items-center justify-center"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(collection.id)}
                      className="flex-1 bg-white text-brand-dark p-3 rounded-xl hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-black uppercase tracking-widest text-brand-dark truncate">
                    {collection.name}
                  </h3>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                    collection.status === 'coming_soon' 
                      ? "bg-amber-100 text-amber-600" 
                      : "bg-emerald-100 text-emerald-600"
                  )}>
                    {collection.status === 'coming_soon' ? 'Coming Soon' : 'Available'}
                  </span>
                </div>
                {collection.description && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-dark/40 mt-1 line-clamp-2">
                    {collection.description}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <h2 className="text-2xl font-black uppercase tracking-widest text-brand-dark italic mb-6">
                  {editingCollection ? "Edit Collection" : "New Collection"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark/40 ml-4">
                      Collection Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="E.G. THE GODFATHER"
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-brand-primary transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark/40 ml-4">
                      Poster URL
                    </label>
                    <input
                      type="url"
                      value={formData.poster_url}
                      onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
                      placeholder="HTTPS://EXAMPLE.COM/POSTER.JPG"
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-brand-primary transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark/40 ml-4">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="BRIEF DESCRIPTION OF THE FRANCHISE..."
                      rows={3}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-brand-primary transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark/40 ml-4">
                      Spotify URL
                    </label>
                    <input
                      type="url"
                      value={formData.spotify_url}
                      onChange={(e) => setFormData({ ...formData, spotify_url: e.target.value })}
                      placeholder="HTTPS://OPEN.SPOTIFY.COM/TRACK/..."
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-brand-primary transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark/40 ml-4">
                      Collection Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'available' | 'coming_soon' })}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-brand-primary transition-all"
                    >
                      <option value="available">Available Now</option>
                      <option value="coming_soon">Coming Soon</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark/40 ml-4">
                      Category (التصنيف)
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-brand-primary transition-all"
                    >
                      <option value="أفلام">أفلام (Movies)</option>
                      <option value="مسلسلات">مسلسلات (TV Shows)</option>
                      <option value="انمي">انمي (Anime)</option>
                    </select>
                  </div>

                  <div className="space-y-4 pt-2 border-t border-gray-100">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.has_sub_collections}
                        onChange={(e) => setFormData({ ...formData, has_sub_collections: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                      />
                      <span className="text-xs font-black uppercase tracking-widest text-brand-dark">
                        Enable Sub-Collections
                      </span>
                    </label>

                    {formData.has_sub_collections && (
                      <div className="space-y-3 pl-8">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newSubCollection}
                            onChange={(e) => setNewSubCollection(e.target.value)}
                            placeholder="SUB-COLLECTION NAME"
                            className="flex-1 px-4 py-3 bg-gray-50 border-none rounded-xl text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-brand-primary transition-all"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (newSubCollection.trim()) {
                                  setFormData({
                                    ...formData,
                                    sub_collections: [...formData.sub_collections, newSubCollection.trim()]
                                  });
                                  setNewSubCollection("");
                                }
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newSubCollection.trim()) {
                                setFormData({
                                  ...formData,
                                  sub_collections: [...formData.sub_collections, newSubCollection.trim()]
                                });
                                setNewSubCollection("");
                              }
                            }}
                            className="px-4 py-3 bg-brand-dark text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-dark/90 transition-all"
                          >
                            Add
                          </button>
                        </div>
                        
                        {formData.sub_collections.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {formData.sub_collections.map((sub, index) => (
                              <div key={index} className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                                <span className="text-xs font-bold uppercase tracking-widest text-brand-dark">{sub}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newSubs = [...formData.sub_collections];
                                    newSubs.splice(index, 1);
                                    setFormData({ ...formData, sub_collections: newSubs });
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-brand-dark/60 hover:bg-gray-100 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-brand-primary text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20"
                    >
                      {editingCollection ? "Save Changes" : "Create Collection"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
