"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { session } from "@/lib/session";
import { authService } from "@/services/auth.service";
import { ApiClientError } from "@/lib/api";
import type { Admin, LoginCredentials } from "@/types";

export interface AuthContextType {
  admin: Admin | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuth = useCallback(async (): Promise<boolean> => {
    const storedToken = session.getToken();
    const storedAdmin = session.getAdmin();

    if (!storedToken) {
      setToken(null);
      setAdmin(null);
      setIsLoading(false);
      return false;
    }

    setToken(storedToken);
    setAdmin(storedAdmin);

    try {
      // Validate token freshness against backend GET /api/auth/me
      const freshAdmin = await authService.getMe(storedToken);
      setAdmin(freshAdmin);
      session.setSession(storedToken, freshAdmin);
      setIsLoading(false);
      return true;
    } catch (err: unknown) {
      if (err instanceof ApiClientError && err.status === 401) {
        // Token has expired or is invalid
        session.clearSession();
        setToken(null);
        setAdmin(null);
        setIsLoading(false);
        return false;
      }

      // If network error occurred, keep session in client state
      setIsLoading(false);
      return true;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      // Yield to next microtask tick to avoid synchronous setState warning in React 19
      await Promise.resolve();
      if (!isMounted) return;

      const storedToken = session.getToken();
      const storedAdmin = session.getAdmin();

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      setToken(storedToken);
      setAdmin(storedAdmin);

      try {
        const freshAdmin = await authService.getMe(storedToken);
        if (isMounted) {
          setAdmin(freshAdmin);
          session.setSession(storedToken, freshAdmin);
        }
      } catch (err: unknown) {
        if (isMounted && err instanceof ApiClientError && err.status === 401) {
          session.clearSession();
          setToken(null);
          setAdmin(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    try {
      const authData = await authService.login(credentials);
      session.setSession(authData.token, authData.admin);
      setToken(authData.token);
      setAdmin(authData.admin);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    session.clearSession();
    setToken(null);
    setAdmin(null);
    router.replace("/login");
  }, [router]);

  const value: AuthContextType = {
    admin,
    token,
    isAuthenticated: Boolean(token),
    isLoading,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
