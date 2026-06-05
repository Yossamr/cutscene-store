import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "motion/react";
import { UserPlus, Phone, Lock, User, AlertCircle, Clapperboard } from "lucide-react";
import { CinematicLoader } from "../components/CinematicLoader";
import toast from "react-hot-toast";
import { cn } from "../lib/utils";

const GENRES = ["Sci-Fi", "Action", "Horror", "Drama", "Comedy", "Cyberpunk", "Fantasy", "Space"];

export function Register() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const toggleGenre = (genre: string) => {
    setFavoriteGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await register({ name, phone, password, favoriteGenres });
      toast.success("Ticket secured! Please log in.");
      navigate("/login");
    } catch (err: any) {
      toast.error(err.message || "Failed to secure ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl overflow-hidden rounded-3xl border border-brand-dark/10 bg-brand-card p-8 backdrop-blur-xl shadow-2xl"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
            <UserPlus className="h-8 w-8" />
          </div>
          <h1 className="font-brand text-3xl font-black uppercase tracking-tight text-brand-dark italic">
            Get Your <span className="text-brand-primary">VIP Ticket</span>
          </h1>
          <p className="mt-2 text-sm text-brand-dark/60">Join the premiere and set your cinematic preferences.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/50">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-dark/60" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-brand-dark/5 bg-brand-bg py-3 pl-11 pr-4 text-brand-dark placeholder:text-brand-dark/70 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
                  placeholder="Stanley Kubrick"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/60">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-dark/60" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-brand-dark/5 bg-brand-bg py-3 pl-11 pr-4 text-brand-dark placeholder:text-brand-dark/70 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
                  placeholder="01234567890"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/60">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-dark/60" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-brand-dark/5 bg-brand-bg py-3 pl-11 pr-4 text-brand-dark placeholder:text-brand-dark/70 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-brand-dark/5">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-dark/60">
              <Clapperboard className="h-4 w-4" />
              Favorite Genres (Optional)
            </label>
            <p className="text-[10px] text-brand-dark/70">Help our AI recommend the best fits for you.</p>
            <div className="flex flex-wrap gap-2 pt-2">
              {GENRES.map(genre => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => toggleGenre(genre)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                    favoriteGenres.includes(genre)
                      ? "border-brand-primary bg-brand-primary/10 text-brand-primary shadow-[0_0_10px_rgba(58,134,255,0.1)]"
                      : "border-brand-dark/5 bg-brand-bg text-brand-dark/60 hover:border-brand-primary/30 hover:text-brand-dark/20"
                  )}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary py-3.5 text-xs font-black uppercase tracking-widest text-brand-dark transition-all hover:bg-brand-primary/80 disabled:opacity-50 shadow-[0_0_20px_rgba(58,134,255,0.3)]"
          >
            {isSubmitting ? (
              <CinematicLoader size="sm" />
            ) : (
              "Secure Ticket"
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-brand-dark/60">
          Already have a ticket?{" "}
          <Link to="/login" className="font-black text-brand-primary hover:text-brand-dark transition-colors">
            Enter here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
