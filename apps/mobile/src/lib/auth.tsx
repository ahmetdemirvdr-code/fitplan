import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiClient, getStoredToken, setStoredToken, ApiError } from "./api";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  hasProfile: boolean;
  role: string;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const stored = await getStoredToken();
    if (!stored) {
      setUser(null);
      setToken(null);
      return;
    }
    try {
      const data = await apiClient<{ user: AuthUser }>("/api/auth/mobile/me");
      setToken(stored);
      setUser(data.user);
    } catch {
      await setStoredToken(null);
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiClient<{ token: string; user: AuthUser }>(
      "/api/auth/mobile/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }
    );
    await setStoredToken(data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      await apiClient("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      await login(email, password);
    },
    [login]
  );

  const logout = useCallback(async () => {
    await setStoredToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: !!user && !!token,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, token, isLoading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiError };
