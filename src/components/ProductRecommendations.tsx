import React, { useState, useEffect } from "react";
import { ProductCard, type Product } from "./ProductCard";
import { apiFetch } from "../lib/api";
import { Sparkles } from "lucide-react";
import { CinematicLoader } from "./CinematicLoader";

interface ProductRecommendationsProps {
  currentProductId: string;
  genres: string[];
}

export function ProductRecommendations({
  currentProductId,
  genres,
}: ProductRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const allProducts = await apiFetch("/api/products");

        const formattedProducts: Product[] = allProducts.map((p: any) => ({
          id: p.id,
          title: p.title,
          price: p.price,
          image: p.images?.main,
          trailerVideo: p.images?.trailer,
          rating: p.rating || 0,
          isBoxOfficeHit: p.isBoxOfficeHit || false,
          genres: p.genres || [],
        }));

        // Filter out current product
        const otherProducts = formattedProducts.filter(
          (p) => p.id !== currentProductId,
        );

        // Score products based on genre overlap
        const scoredProducts = otherProducts.map((p) => {
          const overlap = p.genres.filter((g) => genres.includes(g)).length;
          return { ...p, score: overlap };
        });

        // Sort by score (descending), then by rating (descending)
        scoredProducts.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return b.rating - a.rating;
        });

        // Take top 4
        setRecommendations(scoredProducts.slice(0, 4));
      } catch (err) {
        console.error("Failed to load recommendations", err);
      } finally {
        setLoading(false);
      }
    };

    if (currentProductId) {
      fetchRecommendations();
    }
  }, [currentProductId, genres]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <CinematicLoader size="lg" label="Scanning the Archives" />
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="mt-12 border-t border-gray-100 pt-12">
      <div className="flex items-center gap-3 mb-8">
        <Sparkles className="h-6 w-6 text-brand-primary" />
        <h2 className="font-brand text-2xl font-black tracking-tight text-brand-dark">
          Cinematic Recommendations
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {recommendations.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
