import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, setToken, removeToken, getStoredUser, setStoredUser, removeStoredUser } from "@/lib/api";

type AppRole = "admin" | "operador";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  devLogin: (role: AppRole) => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, check if we have a stored token and validate it
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored.user);
      setRole(stored.role);
      // Validate token with backend
      api.get("/auth/me")
        .then((data) => {
          setUser(data.user);
          setRole(data.role);
          setStoredUser(data);
        })
        .catch(() => {
          // Token expired or invalid
          removeToken();
          removeStoredUser();
          setUser(null);
          setRole(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    const data = await api.post("/auth/login", { email, password });
    setToken(data.token);
    setUser(data.user);
    setRole(data.role);
    setStoredUser({ user: data.user, role: data.role });
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const data = await api.post("/auth/signup", { email, password, full_name: fullName });
    setToken(data.token);
    setUser(data.user);
    setRole(data.role);
    setStoredUser({ user: data.user, role: data.role });
  };

  const signOut = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    }
    removeToken();
    removeStoredUser();
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        signIn,
        signUp,
        signOut,
        isAdmin: role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
