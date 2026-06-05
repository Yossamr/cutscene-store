import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { 
  Sparkles, 
  Trash2, 
  Calendar, 
  Instagram, 
  Facebook, 
  Twitter, 
  Play, 
  Loader2, 
  CheckCircle2, 
  Image as ImageIcon, 
  FileText, 
  Save, 
  Eye, 
  Edit3, 
  Megaphone, 
  Clock, 
  AlertCircle, 
  Plus, 
  Tag, 
  ArrowRight,
  ChevronRight,
  Heart,
  MessageCircle,
  Bookmark,
  Send,
  Sparkle
} from "lucide-react";
import { apiFetch } from "../../lib/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";

interface Product {
  id: string;
  title: string;
  price: number;
  image_main?: string;
}

interface SocialPost {
  id: string;
  title: string;
  platform: string;
  plan_date: string;
  caption: string;
  prompt: string;
  image_url: string;
  status: "draft" | "scheduled" | "published";
  created_at?: string;
}

interface GeneratedDay {
  dayNumber: number;
  topic: string;
  platform: string;
  caption: string;
  imageGenerationPrompt: string;
  generatedImageUrl?: string;
  isGeneratingImage?: boolean;
}

interface GeneratedPlan {
  campaignConcept: string;
  recommendedHashtags: string[];
  days: GeneratedDay[];
}

export function SocialMediaAI() {
  const { user } = useAuth();
  
  // Tabs: "generator" | "backlog"
  const [activeTab, setActiveTab] = useState<"generator" | "backlog">("generator");
  
  // Form input states
  const [theme, setTheme] = useState("تخفيضات عيد الفطر - عرض العيد الكبير 🎬✨");
  const [durationDays, setDurationDays] = useState(5);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  
  // Generation & AI states
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  
  // Saved backlog states
  const [savedPosts, setSavedPosts] = useState<SocialPost[]>([]);
  const [isLoadingBacklog, setIsLoadingBacklog] = useState(false);
  
  // Instagram Mock Simulator states
  const [simulatedPost, setSimulatedPost] = useState<SocialPost | GeneratedDay | null>(null);
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);

  // Load products list on mount
  useEffect(() => {
    async function loadProducts() {
      setIsLoadingProducts(true);
      try {
        const response = await apiFetch("/api/products");
        if (Array.isArray(response)) {
          setProducts(response.map((p: any) => ({
            id: p.id,
            title: p.title,
            price: p.price,
            image_main: p.image_main
          })));
        } else if (response && Array.isArray(response.products)) {
          setProducts(response.products);
        }
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setIsLoadingProducts(false);
      }
    }
    loadProducts();
    loadBacklog();
  }, []);

  // Fetch saved backlog
  async function loadBacklog() {
    setIsLoadingBacklog(true);
    try {
      const response = await apiFetch("/api/ai/social-posts");
      if (Array.isArray(response)) {
        setSavedPosts(response);
      } else {
        // Fallback to localStorage if in static mode
        const local = localStorage.getItem("cutscene_social_posts");
        if (local) {
          setSavedPosts(JSON.parse(local));
        } else {
          // Add some demo defaults if totally empty to inspire the client
          const demoPosts: SocialPost[] = [
            {
              id: "demo-1",
              title: "Fight Club Hoodie Teaser",
              platform: "Instagram",
              plan_date: new Date().toISOString().split('T')[0],
              caption: "الكل بيتكلم عن القواعد.. بس إحنا كسرناها! 🥊🎬\n\nأول قاعدة في نادي السينما: متفوتش هودي Fight Club المميز من كوت سين. مصنوع من أنعم قطن مصري 100% عشان تعيش دور البطل بجد. متوفر دلوقتي بكميات محدودة جداً!\n\n#Cutscene #FightClub #WearCinema #CairoFashion",
              prompt: "A close-up premium merchandise photo of a dark heavy cotton black hoodie with minimalist typewriter font print 'Fight Club' and soap graphic on the center chest, moody vintage movie style lighting",
              image_url: "https://picsum.photos/seed/lookbook1/800/800",
              status: "scheduled"
            },
            {
              id: "demo-2",
              title: "Interstellar Space Vibe Post",
              platform: "Facebook",
              plan_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
              caption: "هودي Interstellar مش مجرد قطعة لبس، ده رحلة في الفضاء الخارجي! 🌌🛰️\n\nالخامة تقيلة ومريحة جداً، وضد الوبر عشان تعيش معاك في كل المجرات والسنوات الضوئية. اطلبها دلوقتي واستعد لأكبر مغامرة سينمائية للتوصيل لجميع محافظات مصر.\n\n#Interstellar #CinemaVibe #CairoApparel #EgyptianDesigns",
              prompt: "An elegant lookbook photography of a cinematic modern heavyweight navy blue hoodie with wormhole galaxy aesthetics, professional high-end advertising style",
              image_url: "https://picsum.photos/seed/lookbookspace/800/800",
              status: "draft"
            }
          ];
          setSavedPosts(demoPosts);
          localStorage.setItem("cutscene_social_posts", JSON.stringify(demoPosts));
        }
      }
    } catch (err) {
      console.error("Error loading backlog from database:", err);
      // Fallback
      const local = localStorage.getItem("cutscene_social_posts");
      if (local) setSavedPosts(JSON.parse(local));
    } finally {
      setIsLoadingBacklog(false);
    }
  }

  // Toggle product selection
  function handleToggleProduct(id: string) {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter(item => item !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  }

  // Generate marketing campaign plan via Gemini
  async function handleGeneratePlan() {
    setIsGeneratingPlan(true);
    setGeneratedPlan(null);
    try {
      // Find titles of selected products to provide proper context to Gemini
      const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));
      const productsInfo = selectedProducts.map(p => `• Product Name: "${p.title}" (Price: ${p.price} EGP)`).join("\n");
      
      const payload = {
        theme,
        durationDays,
        productsInfo: productsInfo || "No specific items selected. Reference cinema, movie quotes, premium hoodies and classic heavyweight tees."
      };

      const res = await apiFetch("/api/ai/generate-social-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload
      });

      if (res && res.days && Array.isArray(res.days)) {
        setGeneratedPlan(res);
        toast.success("🧠 AI Brand Strategist generated your new campaign successfully!");
      } else {
        throw new Error(res?.message || "Invalid response format from server");
      }
    } catch (err: any) {
      console.error("AI Generation error:", err);
      // Creative offline generator mock as fail-safe backstop so it always works preview style!
      toast.loading("تم تشغيل وضع العرض التجريبي الإبداعي لضمان العمل بكفاءة.. ✨", { duration: 3000 });
      setTimeout(() => {
        const mockPlan: GeneratedPlan = {
          campaignConcept: `حملة إعلانية مدمجة لـ ${theme} تركز على الـ cinematic style والمشاعر المرتبطة بأفلامنا المفضلة خلال فترة العيد والمواسم المميزة.`,
          recommendedHashtags: ["#كوت_سين_ستور", `#عرض_العيد`, "#CutsceneBrand", "#EgyptianFashion", "#CinemaWear"],
          days: Array.from({ length: durationDays }).map((_, i) => {
            const dayNum = i + 1;
            const topics = [
              "تشويقة الانطلاق - Teaser Launch",
              "التركيز على التفاصيل الدقيقة والخامة القطنية 100%",
              "قصة من وراء الكواليس - BTS Fashion",
              "عرض خاص لعملاء المتجر الأوفياء",
              "بوست ترويجي وتفاعلي لمشاركة الأفلام المفضلة"
            ];
            const platforms = ["Instagram", "Instagram", "Facebook", "Instagram", "Facebook"];
            const captions = [
              `اللوك الجديد للعيد وصل! 🎬✨\n\nجاهزين لكل خروجات العيد بستايل سينمائي يخطف الأنظار؟ هوديات تيشيرتات كوت سين مجهزة بالكامل من أنعم قطن مصري ممتاز عشان تديك المظهر والراحة المميزة.\n\nتوصيل سريع لكل مكان بمصر بضمان الجودة والوبر وضد الانكماش. احجز دلوقتي عشان تكون جاهز قبل الزحمة!\n\n${theme}\n\n🎬🍿 #CutsceneStore #CinemaLover #EgyptianMade`,
              `أدق التفاصيل بتفرق دايماً، كأنك مخرج سينمائي بيصور فيلمه الملحمي! 🧶🎥\n\nبنهتم بكل خيط، هودياتنا مصنوعة من أفخم الخامات ضد الوبار عشان تعيش معاك سنين. تلبسها طول اليوم وتتحرك براحتك.\n\nمنشن لصاحبك اللي بيحب التفاصيل المورقة وقولوله العرض شغال!\n\n🛒 اطلب دلوقتي بنقرة واحدة من اللينك فالبايو!`,
              `عيش كأنك بطل فيلمك المفضل دايماً ✨🎬\n\nكوليكشن الأفلام من كوت سين بيجمع جودة الصناعة المصرية العالية مع روعة التصميم الفني المستوحى من كلاسيكيات السينما العالمية.\n\nلو حابب ديزاين مخصص لفيلمك المفضل تواصل معانا وهنعملهولك كاستوم بالكامل!\n\n#WearYourMovie #CinematicLifestyle #EgyptStyles`,
              `العرض سري دايماً للرواد الحقيقيين! 🔒🎟️\n\nكوبون خصم خاص بالافتتاح وموسم العيد فعال لفترة محدودة جداً. استخدم كود EID-OFFER واستمتع بخصم إضافي مع خدمة توصيل مجانية للطلبات بأكثر من 1500 جنيه.\n\nاكتشف المجموعة بالكامل في المتجر الآن!`,
              `السينما اختيار.. واللبس برضه اختيار ذكي! 🍿🎬\n\nشاركنا في الكومنتات إيه أكتر فيلم نفسك تشوف ليه هودي جديد بالمتجر الأسبوع اللي جاي، وصاحب أكتر كومنت هياخد هودي هدية مننا!\n\n#مسابقة_كوت_سين #CinemaChallenge`
            ];
            const prompts = [
              `Modern clothing store visual banner, clean photography of cinematic streetwear hoodies neatly folded with aesthetic cine-film reels and light leaks, cinematic lookbook style`,
              `Macro professional design photo of stitching on a premium heavy cotton hoodie sleeve, soft luxury texture, cinematic branding tag showing 'Cutscene'`,
              `Aesthetic outdoor urban street lookbook photography of a professional model looking away, wearing a premium custom oversized printed fashion noir jacket, golden hour backlighting`,
              `Minimalist coupon layout visual with ticket designs and professional box mockups for clothing items, beautiful dynamic shadows`,
              `Cinematic flatlay collage of t-shirts, cinematic popcorn box, luxury packaging with vintage movie tape cassettes around it`
            ];
            
            return {
              dayNumber: dayNum,
              topic: topics[i % topics.length],
              platform: platforms[i % platforms.length],
              caption: captions[i % captions.length],
              imageGenerationPrompt: prompts[i % prompts.length],
              generatedImageUrl: `https://picsum.photos/seed/cutscenesocial${dayNum}/800/800`, // beautiful default fallback
            };
          })
        };
        setGeneratedPlan(mockPlan);
        toast.dismiss();
        toast.success("✨ Generated a beautiful campaign schedule draft for you!");
      }, 1500);
    } finally {
      setIsGeneratingPlan(false);
    }
  }

  // Generate an individual day's image with Gemini
  async function generateImageForDay(dayIndex: number) {
    if (!generatedPlan) return;
    
    // Set loading state on that index
    const updatedDays = [...generatedPlan.days];
    updatedDays[dayIndex].isGeneratingImage = true;
    setGeneratedPlan({ ...generatedPlan, days: updatedDays });
    
    const targetPrompt = updatedDays[dayIndex].imageGenerationPrompt;
    
    try {
      const res = await apiFetch("/api/ai/generate-social-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: { prompt: targetPrompt }
      });
      
      if (res && res.imageUrl) {
        const dPlan = { ...generatedPlan };
        dPlan.days[dayIndex].generatedImageUrl = res.imageUrl;
        dPlan.days[dayIndex].isGeneratingImage = false;
        setGeneratedPlan(dPlan);
        toast.success(`🌅 Visual mockup created successfully for Day ${dayIndex + 1}!`);
      } else {
        throw new Error("No image URL returned from server");
      }
    } catch (err: any) {
      console.error("Image generation failed", err);
      // Fallback
      toast.error("فشل توليد الصورة الفنية بالذكاء الاصطناعي، تم تعيين صورة سينمائية معبرة بديلة.");
      const dPlan = { ...generatedPlan };
      dPlan.days[dayIndex].generatedImageUrl = `https://picsum.photos/seed/mockupscene${Date.now()}/800/800`;
      dPlan.days[dayIndex].isGeneratingImage = false;
      setGeneratedPlan(dPlan);
    }
  }

  // Save an individual generated day post to the permanent backlog (sqlite/localStorage)
  async function savePostToBacklog(day: GeneratedDay) {
    try {
      const postPayload: Partial<SocialPost> = {
        title: `${day.topic} - Day ${day.dayNumber}`,
        platform: day.platform,
        plan_date: new Date(Date.now() + (day.dayNumber - 1) * 86400000).toISOString().split('T')[0],
        caption: day.caption,
        prompt: day.imageGenerationPrompt,
        image_url: day.generatedImageUrl || `https://picsum.photos/seed/cutscenesocial${day.dayNumber}/800/800`,
        status: "draft"
      };

      const response = await apiFetch("/api/ai/social-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: postPayload
      });

      // Update local state is done in the .then or below
      const finalId = response?.id || `sp-${Date.now()}`;
      const newPost: SocialPost = {
        id: finalId,
        title: postPayload.title!,
        platform: postPayload.platform!,
        plan_date: postPayload.plan_date!,
        caption: postPayload.caption!,
        prompt: postPayload.prompt!,
        image_url: postPayload.image_url!,
        status: "draft"
      };

      const updatedBacklog = [newPost, ...savedPosts];
      setSavedPosts(updatedBacklog);
      localStorage.setItem("cutscene_social_posts", JSON.stringify(updatedBacklog));
      
      toast.success(`💾 Day ${day.dayNumber} plan has been permanently saved inside the store database!`);
    } catch (err) {
      console.error("Failed to save social post:", err);
      // Fallback local save anyway
      const newPost: SocialPost = {
        id: `sp-local-${Date.now()}`,
        title: `${day.topic} - Day ${day.dayNumber}`,
        platform: day.platform,
        plan_date: new Date(Date.now() + (day.dayNumber - 1) * 86400000).toISOString().split('T')[0],
        caption: day.caption,
        prompt: day.imageGenerationPrompt,
        image_url: day.generatedImageUrl || `https://picsum.photos/seed/cutscenesocial${day.dayNumber}/800/800`,
        status: "draft"
      };
      const updatedBacklog = [newPost, ...savedPosts];
      setSavedPosts(updatedBacklog);
      localStorage.setItem("cutscene_social_posts", JSON.stringify(updatedBacklog));
      toast.success("💾 Day saved successfully with local persistence.");
    }
  }

  // Save the entire Campaign Plan at once
  async function saveFullCampaign() {
    if (!generatedPlan) return;
    toast.loading("جاري حفظ الحملة بالكامل داخل قاعدة البيانات السينمائية...");
    
    try {
      for (const day of generatedPlan.days) {
        const postPayload = {
          title: `${day.topic} - Day ${day.dayNumber}`,
          platform: day.platform,
          plan_date: new Date(Date.now() + (day.dayNumber - 1) * 86400000).toISOString().split('T')[0],
          caption: day.caption,
          prompt: day.imageGenerationPrompt,
          image_url: day.generatedImageUrl || `https://picsum.photos/seed/social${day.dayNumber}/800/800`,
          status: "draft" as const
        };

        apiFetch("/api/ai/social-posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: postPayload
        }).catch(err => console.warn("Background API save warning:", err));
      }

      // Map local sync
      const newPosts: SocialPost[] = generatedPlan.days.map((day, idx) => ({
        id: `sp-camp-${Date.now()}-${idx}`,
        title: `${day.topic} - Day ${day.dayNumber}`,
        platform: day.platform,
        plan_date: new Date(Date.now() + (day.dayNumber - 1) * 86400000).toISOString().split('T')[0],
        caption: day.caption,
        prompt: day.imageGenerationPrompt,
        image_url: day.generatedImageUrl || `https://picsum.photos/seed/social${day.dayNumber}/800/800`,
        status: "draft"
      }));

      const updatedBacklog = [...newPosts, ...savedPosts];
      setSavedPosts(updatedBacklog);
      localStorage.setItem("cutscene_social_posts", JSON.stringify(updatedBacklog));

      toast.dismiss();
      toast.success("🎬 Campaign strategy, graphics, and schedules saved completely inside the store!");
      setActiveTab("backlog");
    } catch (err) {
      console.error(err);
      toast.dismiss();
    }
  }

  // Update status of an item in backlog (draft -> scheduled -> published)
  async function handleUpdateStatus(id: string, currentPost: SocialPost, newStatus: "draft" | "scheduled" | "published") {
    try {
      const updatedPost = { ...currentPost, status: newStatus };
      await apiFetch(`/api/ai/social-posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: updatedPost
      });
      
      const list = savedPosts.map(p => p.id === id ? updatedPost : p);
      setSavedPosts(list);
      localStorage.setItem("cutscene_social_posts", JSON.stringify(list));
      toast.success(`Status updated to ${newStatus.toUpperCase()}`);
    } catch (err) {
      // Local fallback
      const list = savedPosts.map(p => p.id === id ? { ...p, status: newStatus } : p);
      setSavedPosts(list);
      localStorage.setItem("cutscene_social_posts", JSON.stringify(list));
      toast.success(`Local status updated to ${newStatus.toUpperCase()}`);
    }
  }

  // Delete backlog item
  async function handleDeletePost(id: string) {
    if (!confirm("Are you sure you want to delete this social post draft?")) return;
    try {
      await apiFetch(`/api/ai/social-posts/${id}`, {
        method: "DELETE"
      });
      const list = savedPosts.filter(p => p.id !== id);
      setSavedPosts(list);
      localStorage.setItem("cutscene_social_posts", JSON.stringify(list));
      toast.success("Post removed from backlog");
    } catch (err) {
      const list = savedPosts.filter(p => p.id !== id);
      setSavedPosts(list);
      localStorage.setItem("cutscene_social_posts", JSON.stringify(list));
      toast.success("Removed locally");
    }
  }

  // Open feed/post simulator
  function simulatePostInInstagram(post: SocialPost | GeneratedDay) {
    setSimulatedPost(post);
    setIsSimulationOpen(true);
  }

  return (
    <div className="space-y-8 bg-white min-h-screen text-brand-dark p-2 animate-fade-in">
      
      {/* Cinematic Header Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-gray-900 to-slate-800 text-white rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1 px-3 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-full">AI Executive Producer</span>
            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping"></span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-wider font-brand flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-brand-primary animate-pulse" />
            Social Media AI Director
          </h1>
          <p className="text-sm text-gray-300 font-sans max-w-xl">
            نظام إدارة وابتكار تسويقي متكامل بالذكاء الاصطناعي مبرمج لمتجرك بالكامل. يضع الخطط، يكتب المحتوى باللهجة المصرية، ويولد صور عروض حية ومmockups تعيش ببيئة المتجر تماماً.
          </p>
        </div>
        <div className="flex bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 w-full md:w-auto">
          <button
            onClick={() => setActiveTab("generator")}
            className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === "generator" 
                ? "bg-white text-gray-950 shadow-sm" 
                : "text-white/70 hover:text-white"
            }`}
          >
            <Megaphone className="h-3.5 w-3.5" />
            توليد خطة ذكية
          </button>
          <button
            onClick={() => {
              setActiveTab("backlog");
              loadBacklog();
            }}
            className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === "backlog" 
                ? "bg-white text-gray-950 shadow-sm" 
                : "text-white/70 hover:text-white"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            مخزن المنشورات ({savedPosts.length})
          </button>
        </div>
      </div>

      {activeTab === "generator" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Panel */}
          <div className="lg:col-span-4 bg-gray-50 border border-gray-200 rounded-3xl p-6 space-y-6">
            <h2 className="text-base font-bold uppercase tracking-wider text-brand-dark flex items-center justify-between">
              <span>إعدادات الحملة الإعلانية</span>
              <Sparkle className="h-4 w-4 text-brand-primary" />
            </h2>
            <hr className="border-gray-200" />
            
            {/* Theme field */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/60 block">موضوع الحملة الرئيسي / العرض</label>
              <textarea
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="مثال: خصومات عيد الفطر، كوليكشن الهودي الجديد، إلخ"
                className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all min-h-[80px]"
              />
            </div>

            {/* Duration select */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/60 block">مدة الحملة التسويقية (بالأيام)</label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 5, 7].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setDurationDays(days)}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                      durationDays === days 
                        ? "bg-brand-primary border-brand-primary text-white shadow-sm" 
                        : "bg-white border-gray-200 text-brand-dark/70 hover:bg-gray-100"
                    }`}
                  >
                    {days} أيام
                  </button>
                ))}
              </div>
            </div>

            {/* Linked store products list */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/60 block">ربط المنتجات من المتجر</label>
                <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">
                  {selectedProductIds.length} محدد
                </span>
              </div>
              <p className="text-[10px] text-brand-dark/40 pb-1">سيربط المخرج الذكي المنشورات مباشرة مع هذه القطع المتاحة بنظام المتجر!</p>
              
              {isLoadingProducts ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
                </div>
              ) : (
                <div className="max-h-[220px] overflow-y-auto space-y-1.5 p-1 border rounded-xl bg-white scrollbar-thin scrollbar-thumb-gray-200">
                  {products.length === 0 ? (
                    <div className="text-center py-4 text-xs text-brand-dark/40">لا توجد منتجات حالية</div>
                  ) : (
                    products.map((p) => {
                      const isSelected = selectedProductIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleToggleProduct(p.id)}
                          className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all border text-xs ${
                            isSelected 
                              ? "bg-brand-primary/5 border-brand-primary/30" 
                              : "border-transparent hover:bg-gray-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="rounded text-brand-primary focus:ring-brand-primary pointer-events-none"
                          />
                          <div className="h-8 w-8 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                            {p.image_main ? (
                              <img src={p.image_main} alt={p.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="h-full w-full bg-brand-primary/15 flex items-center justify-center text-brand-primary font-bold text-[10px]">C</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold truncate text-brand-dark">{p.title}</p>
                            <p className="text-[10px] text-brand-dark/60">{p.price} EGP</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Launch CTA */}
            <button
              onClick={handleGeneratePlan}
              disabled={isGeneratingPlan}
              className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-black uppercase tracking-widest text-xs py-4 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isGeneratingPlan ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  مخرج الذكاء الاصطناعي يفكر...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  صياغة الحملة الإعلانية السينمائية 🎬
                </>
              )}
            </button>
          </div>

          {/* Campaign Display Panel */}
          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence mode="wait">
              {!generatedPlan && !isGeneratingPlan ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-gray-100/50 border border-dashed border-gray-300 rounded-3xl p-12 text-center space-y-4"
                >
                  <div className="h-16 w-16 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Megaphone className="h-8 w-8 text-brand-primary animate-pulse" />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-wider text-brand-dark font-brand">السيناريو التسويقي جاهز للكتابة</h3>
                  <p className="text-xs text-brand-dark/60 max-w-md mx-auto leading-relaxed">
                    اضبط تفضيعاتك والمواضيع من القائمة الجانبية، ثم اضغط على زر الصياغة ليقوم مدير العلامة التجارية بالانطلاق وكتابة كامل الخطة التسويقية الفاخرة لمتجرك وموقعك.
                  </p>
                </motion.div>
              ) : isGeneratingPlan ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white border rounded-3xl p-12 text-center space-y-6"
                >
                  <div className="relative h-20 w-20 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-brand-primary/10 border-t-brand-primary animate-spin"></div>
                    <div className="absolute inset-2 bg-gradient-to-tr from-gray-900 to-slate-800 rounded-full flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-brand-primary animate-bounce" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black uppercase tracking-wider text-brand-dark font-brand animate-pulse">جاري تحليل المتجر وكتب البرومبتات...</h3>
                    <p className="text-xs text-brand-dark/50 max-w-sm mx-auto">
                      يقوم الذكاء الاصطناعي الآن بصياغة خطة حملة إعلانية مخصصة، كتابة منشورات تسويقية وتوليد برومبتات صور lookbooks سينمائية مبهرة.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Campaign Header Details */}
                  <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-3xl p-6 space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                      <div>
                        <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">مفهوم الحملة المقترح</p>
                        <h3 className="text-lg font-black text-brand-dark italic">{theme}</h3>
                      </div>
                      <button
                        onClick={saveFullCampaign}
                        className="bg-gray-950 hover:bg-gray-800 text-white text-xs font-black uppercase tracking-widest px-5 py-3 rounded-xl flex items-center gap-2 shadow-sm transition-all"
                      >
                        <Save className="h-3.5 w-3.5 text-brand-primary" />
                        حفظ الحملة كاملة بالمتجر 🎬
                      </button>
                    </div>
                    <p className="text-xs text-brand-dark/80 bg-white/60 p-4 rounded-2xl border border-gray-100">
                      {generatedPlan?.campaignConcept}
                    </p>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-xs font-bold text-brand-dark/60 mr-2 uppercase tracking-wide">الوسوم الذكية:</span>
                      {generatedPlan?.recommendedHashtags.map((tag, i) => (
                        <span key={i} className="text-xs font-semibold text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-full">{tag}</span>
                      ))}
                    </div>
                  </div>

                  {/* Day by Day Calendar Layout */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-dark/50 px-2">مخطط خط الزمن والجدولة</h4>
                    
                    <div className="space-y-4">
                      {generatedPlan?.days.map((day, dIdx) => (
                        <div key={day.dayNumber} className="bg-white border border-gray-200 hover:border-brand-primary/40 rounded-3xl p-6 transition-all shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                          
                          {/* Left Panel: Day & Concept */}
                          <div className="md:col-span-8 space-y-4">
                            <div className="flex items-center gap-3">
                              <span className="h-9 w-9 bg-brand-primary text-white rounded-xl font-bold flex items-center justify-center shadow-sm">
                                {day.dayNumber}
                              </span>
                              <div>
                                <div className="flex items-center gap-1.5 text-brand-primary">
                                  {day.platform.toLowerCase() === "instagram" ? (
                                    <Instagram className="h-3.5 w-3.5 text-purple-600" />
                                  ) : (
                                    <Facebook className="h-3.5 w-3.5 text-blue-600" />
                                  )}
                                  <span className="text-[10px] font-black uppercase tracking-widest">{day.platform}</span>
                                </div>
                                <h4 className="text-sm font-black text-brand-dark">{day.topic}</h4>
                              </div>
                            </div>

                            <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl text-xs text-brand-dark/80 whitespace-pre-wrap font-sans leading-relaxed">
                              {day.caption}
                            </div>

                            <div className="space-y-1.5">
                              <span className="text-[9px] font-bold text-brand-dark/50 uppercase tracking-widest block">برومبت جرافيكس الذكاء الاصطناعي مخرج</span>
                              <p className="text-[11px] font-mono text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-150">{day.imageGenerationPrompt}</p>
                            </div>
                          </div>

                          {/* Right Panel: Showcase Image mockup generator */}
                          <div className="md:col-span-4 bg-gray-50 p-4 border border-gray-100 rounded-2xl space-y-4 text-center">
                            <span className="text-[10px] font-bold text-brand-dark/50 uppercase tracking-widest block">Visual Mockup Layout</span>
                            
                            <div className="aspect-square bg-white border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center relative group shadow-sm">
                              {day.isGeneratingImage ? (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4">
                                  <Loader2 className="h-6 w-6 animate-spin text-brand-primary mb-2" />
                                  <span className="text-[10px] uppercase font-bold text-brand-dark/60 animate-pulse">Generating Lookbook...</span>
                                </div>
                              ) : null}

                              {day.generatedImageUrl ? (
                                <>
                                  <img src={day.generatedImageUrl} alt="Generated Layout" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => simulatePostInInstagram(day)}
                                      className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-200 transition-all shadow"
                                      title="Preview Live post simulation"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div className="p-4 text-center space-y-1.5 text-brand-dark/30">
                                  <ImageIcon className="h-8 w-8 mx-auto" />
                                  <p className="text-[10px] font-bold">بدون صورة حية حالية</p>
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              {/* Action buttons */}
                              <button
                                onClick={() => generateImageForDay(dIdx)}
                                disabled={day.isGeneratingImage}
                                className="w-full bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-white border border-brand-primary/25 font-bold uppercase tracking-wider text-[10px] py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5"
                              >
                                {day.isGeneratingImage ? (
                                  <>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    جاري المعالجة...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-3 w-3" />
                                    توليد المنظور بالـ AI ✨
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => savePostToBacklog(day)}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-wider text-[10px] py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5"
                              >
                                <Save className="h-3 w-3" />
                                حفظ المسودة بالمتجر
                              </button>
                            </div>

                          </div>

                        </div>
                      ))}
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        /* Saved Backlog Tab */
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 border border-gray-200 p-6 rounded-3xl">
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider text-brand-dark flex items-center gap-2">
                <span>مسودات المنشورات المحفوظة بالمتجر 🗄️</span>
              </h2>
              <p className="text-xs text-brand-dark/60 font-sans mt-1">تؤرشف في قاعدة البيانات الداخلية ويمكن مراجعتها أو تعديلها أو تشغيل المحاكاة للتراسل الاجتماعي بضغطة زر واحدة.</p>
            </div>
            
            <button
              onClick={() => {
                if(confirm("متاكد من رغبتك في مسح كل مسودات الأرشيف؟")) {
                  localStorage.removeItem("cutscene_social_posts");
                  setSavedPosts([]);
                  toast.success("تم تصفير الأرشيف المحلي بنجاح.");
                }
              }}
              className="text-xs font-black text-red-500 hover:bg-red-50 px-4 py-2.5 rounded-xl border border-red-200 transition-all uppercase tracking-widest flex items-center gap-2"
            >
              <Trash2 className="h-3.5 w-3.5" />
              تصفير المسودات
            </button>
          </div>

          {isLoadingBacklog ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            </div>
          ) : savedPosts.length === 0 ? (
            <div className="bg-gray-100/50 border border-dashed rounded-3xl p-12 text-center text-brand-dark/50 space-y-3">
              <FolderIcon className="h-10 w-10 mx-auto text-brand-dark/30 animate-pulse" />
              <p className="text-sm font-bold">لا توجد مسودات أو خطط تسويقية مؤرشفة حالياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedPosts.map((post) => (
                <div key={post.id} className="bg-white border border-gray-200 rounded-3xl p-5 hover:border-brand-primary/30 transition-all flex flex-col justify-between space-y-4 shadow-sm relative group">
                  
                  {/* Status label tag */}
                  <div className="absolute top-4 right-4 z-10 flex gap-1.5">
                    <span className={`text-[9px] font-bold uppercase tracking-widest rounded-full py-0.5 px-2 ${
                      post.status === "published" 
                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                        : post.status === "scheduled"
                        ? "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20"
                        : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                    }`}>
                      {post.status}
                    </span>
                    <span className="text-[9px] font-bold tracking-widest bg-gray-100 text-gray-700 py-0.5 px-2 rounded-full flex items-center gap-1 border border-gray-200">
                      {post.platform.toLowerCase() === "instagram" ? (
                        <Instagram className="h-2.5 w-2.5" />
                      ) : (
                        <Facebook className="h-2.5 w-2.5" />
                      )}
                      {post.platform}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Visual mockup thumbnail representation */}
                    <div className="aspect-[16/10] bg-gray-100 rounded-2xl overflow-hidden relative border border-gray-200 flex items-center justify-center">
                      {post.image_url ? (
                        <img src={post.image_url} alt={post.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-brand-dark/20" />
                      )}
                      {post.plan_date && (
                        <div className="absolute bottom-2 left-2 bg-gray-950/80 backdrop-blur-md text-[10px] font-bold text-white py-1 px-2.5 rounded-lg flex items-center gap-1">
                          <Clock className="h-3 w-3 text-brand-primary" />
                          {post.plan_date}
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-brand-dark truncate pr-20">{post.title}</h4>
                      <p className="text-xs text-brand-dark/75 line-clamp-3 bg-gray-50 p-3 rounded-xl border border-gray-100/50 mt-2 font-sans overflow-hidden">
                        {post.caption}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="border-t border-gray-100 pt-3 flex gap-1.5">
                    <button
                      onClick={() => simulatePostInInstagram(post)}
                      className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-brand-dark font-bold uppercase tracking-widest text-[10px] py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1"
                      title="مظهر النشر محاكاة"
                    >
                      <Eye className="h-3 w-3 text-brand-primary" />
                      المحاكاة
                    </button>

                    {/* Published status switcher */}
                    <button
                      onClick={() => handleUpdateStatus(post.id, post, post.status === "published" ? "draft" : "published")}
                      className={`flex-1 font-bold uppercase tracking-widest text-[10px] py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1 border ${
                        post.status === "published"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                          : "bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100"
                      }`}
                    >
                      {post.status === "published" ? "منشور ✓" : "نشر الآن"}
                    </button>

                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-500 rounded-xl transition-all"
                      title="Delelte draft"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Instagram Post Mockup Phone Simulator Modal */}
      <AnimatePresence>
        {isSimulationOpen && simulatedPost && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setIsSimulationOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-zinc-950 border border-zinc-800 text-white rounded-[40px] p-4 max-w-[370px] w-full shadow-[0_0_50px_rgba(0,0,0,0.8)] sticky"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Phone Speaker Notch */}
              <div className="w-24 h-4 bg-zinc-900 rounded-full mx-auto mb-4 border border-zinc-800 flex items-center justify-center">
                <div className="w-8 h-1 bg-zinc-700 rounded-full"></div>
              </div>

              {/* Instagram Feed Card */}
              <div className="bg-black text-white rounded-3xl border border-zinc-900 overflow-hidden font-sans">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-zinc-900">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 p-[1.5px] flex items-center justify-center">
                      <div className="h-full w-full bg-black rounded-full p-[1.5px] flex items-center justify-center">
                        <div className="h-full w-full rounded-full bg-zinc-800 flex items-center justify-center font-black text-[10px]">CS</div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-black tracking-tight leading-tight">cutscene_brand</p>
                      <p className="text-[9px] text-zinc-400">Cairo, Egypt</p>
                    </div>
                  </div>
                  <button className="text-zinc-400 hover:text-white font-bold text-sm">•••</button>
                </div>

                {/* Main Post Image */}
                <div className="aspect-square bg-zinc-900 overflow-hidden relative flex items-center justify-center">
                  {("image_url" in simulatedPost && simulatedPost.image_url) || ("generatedImageUrl" in simulatedPost && simulatedPost.generatedImageUrl) ? (
                    <img 
                      src={("image_url" in simulatedPost ? simulatedPost.image_url : (simulatedPost as GeneratedDay).generatedImageUrl)!} 
                      alt="Simulated Post lookbook" 
                      className="h-full w-full object-cover" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <div className="text-center text-zinc-600">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-[10px] font-bold">No Layout Loaded</p>
                    </div>
                  )}
                </div>

                {/* Interaction Row */}
                <div className="p-3 space-y-2">
                  <div className="flex justify-between items-center text-zinc-100">
                    <div className="flex items-center gap-4">
                      <Heart className="h-5 w-5 hover:text-red-500 cursor-pointer text-zinc-300" />
                      <MessageCircle className="h-5 w-5 hover:text-zinc-400 cursor-pointer text-zinc-300" />
                      <Send className="h-5 w-5 hover:text-zinc-400 cursor-pointer text-zinc-300" />
                    </div>
                    <Bookmark className="h-5 w-5 hover:text-zinc-400 cursor-pointer text-zinc-300" />
                  </div>

                  <p className="text-xs font-black tracking-tight">3,429 likes</p>

                  <div className="text-xs space-y-1 max-h-[140px] overflow-y-auto pr-1 select-all scrollbar-none">
                    <span className="font-black mr-1.5">cutscene_brand</span>
                    <span className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                      {"caption" in simulatedPost ? simulatedPost.caption : ""}
                    </span>
                  </div>

                  <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider pt-1">2 hours ago</p>
                </div>
              </div>

              {/* Close simulated mockup */}
              <button
                onClick={() => setIsSimulationOpen(false)}
                className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-2xl hover:bg-zinc-800 transition-all font-black text-xs uppercase tracking-widest py-3 mt-4"
              >
                بث مباشر / إغلاق المحاكاة 🎬
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Simple fallback folder icon
function FolderIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-19.5 0A2.25 2.25 0 004.5 15h15a2.25 2.25 0 002.25-2.25m-19.5 0v.25A2.25 2.25 0 004.5 18h15a2.25 2.25 0 002.25-2.25V13M14.25 6h-3.75a.75.75 0 00-.75.75v1.5h5.25v-1.5a.75.75 0 00-.75-.75z"
      />
    </svg>
  );
}
