
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { API_BASE_URL } from "../config";
import { apiFetch } from "../lib/api";

export interface User {
  id: string;
  name: string;
  phone: string;
  role: string;
  points?: number;
  preferences?: {
    favoriteGenres: string[];
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: any) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log("AuthContext initialized. API_BASE_URL:", API_BASE_URL);

  useEffect(() => {
    const syncAuth = async () => {
      const storedToken = localStorage.getItem("cutscene_token");
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        setToken(storedToken);
        const userData = await apiFetch("/api/auth/me");
        setUser(userData);
        localStorage.setItem("cutscene_user", JSON.stringify(userData));
      } catch (error) {
        console.error("Auth sync error:", error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    syncAuth();
  }, []);

  const login = async (credentials: any) => {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: credentials,
    });

    // Store the VIP Ticket
    localStorage.setItem("cutscene_token", data.token);
    localStorage.setItem("cutscene_user", JSON.stringify(data.user));
    
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (userData: any) => {
    const data = await apiFetch("/api/auth/register", {
      method: "POST",
      body: userData,
    });

    // Store the VIP Ticket
    localStorage.setItem("cutscene_token", data.token);
    localStorage.setItem("cutscene_user", JSON.stringify(data.user));
    
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("cutscene_token");
    localStorage.removeItem("cutscene_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
