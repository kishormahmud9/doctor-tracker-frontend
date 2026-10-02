import type { Admin } from "@/types";

const TOKEN_KEY = "doctor_tracker_auth_token";
const ADMIN_KEY = "doctor_tracker_auth_admin";

/**
 * Safe local session abstraction for managing JWT and authenticated admin profile.
 * All operations check for browser environment (window/localStorage availability).
 * Never stores passwords or sensitive credentials.
 */
export const session = {
  /**
   * Retrieves the stored JWT token, or null if unauthenticated or running on server.
   */
  getToken(): string | null {
    if (typeof window === "undefined") {
      return null;
    }
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  /**
   * Retrieves the stored admin profile, or null if unavailable or malformed.
   */
  getAdmin(): Admin | null {
    if (typeof window === "undefined") {
      return null;
    }
    try {
      const data = localStorage.getItem(ADMIN_KEY);
      if (!data) return null;
      return JSON.parse(data) as Admin;
    } catch {
      return null;
    }
  },

  /**
   * Persists the JWT token and safe admin profile to storage.
   */
  setSession(token: string, admin: Admin): void {
    if (typeof window === "undefined") {
      return;
    }
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
    } catch {
      // Storage quota exceeded or disabled in private browsing
    }
  },

  /**
   * Completely clears the stored authentication session.
   */
  clearSession(): void {
    if (typeof window === "undefined") {
      return;
    }
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ADMIN_KEY);
    } catch {
      // Ignore storage errors on cleanup
    }
  },

  /**
   * Checks if an authentication token exists in storage.
   */
  hasSession(): boolean {
    return Boolean(this.getToken());
  },
};

export default session;
