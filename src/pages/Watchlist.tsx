
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Loader2, Film } from "lucide-react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { ProductCard } from "../components/ProductCard";
import { CinematicLoader } from "../components/CinematicLoader";

interface Product {
  id: string;
  title: string;
  price: number;
  genres: string[];
  image: string;
  rating: number;
  isBoxOfficeHit?: boolean;
}

export function Watchlist() {
  const { token } = useAuth();
  const [watchlist, setWatchlist] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const data = await apiFetch("/api/auth/watchlist");
        const formattedData = data.map((p: any) => ({
          id: p.id,
          title: p.title,
          price: p.price,
          genres: p.genres || [],
          image: p.images?.main || p.image,
          rating: p.rating || 0,
          isBoxOfficeHit: p.isBoxOfficeHit || false
        }));
        setWatchlist(formattedData);
      } catch (error) {
        console.error("Failed to fetch watchlist", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchWatchlist();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <CinematicLoader size="lg" label="Reeling in Your List" />
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="mb-12 text-center">
        <h1 className="font-brand text-4xl font-black uppercase tracking-widest text-brand-primary italic">Your Watchlist</h1>
        <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-brand-dark/50">Saved for later viewing</p>
      </div>

      {watchlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-12">
          <Film className="h-16 w-16 text-brand-dark/90 mb-4" />
          <p className="text-brand-dark/60 font-black uppercase tracking-widest text-[10px]">Your watchlist is empty.</p>
          <Link to="/box-office" className="mt-6 text-brand-primary hover:text-brand-dark font-black uppercase tracking-widest text-[10px]">
            Browse Box Office
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {watchlist.map((product) => (
            <ProductCard key={product.id} product={product as any} />
          ))}
        </div>
      )}
    </div>
  );
}
