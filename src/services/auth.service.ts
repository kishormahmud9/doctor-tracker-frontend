import { apiClient } from "@/lib/api";
import type {
  ApiResponse,
  AuthResponse,
  LoginCredentials,
  Admin,
} from "@/types";

export const authService = {
  /**
   * Submits credentials to POST /api/auth/login.
   * On success, returns token and admin data.
   * Throws ApiClientError on invalid credentials or network errors.
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      credentials
    );

    if (!response.data || !response.data.token) {
      throw new Error(response.message || "Login failed: No authentication token returned");
    }

    return response.data;
  },

  /**
   * Verifies current session by calling GET /api/auth/me with caller-supplied JWT.
   * Returns current Admin profile if token is valid.
   * Throws ApiClientError (with status 401) if token is expired or revoked.
   */
  async getMe(token: string): Promise<Admin> {
    const response = await apiClient.get<ApiResponse<{ admin: Admin }>>(
      "/auth/me",
      { token }
    );

    if (!response.data || !response.data.admin) {
      throw new Error(response.message || "Failed to retrieve authenticated admin profile");
    }

    return response.data.admin;
  },
};

export default authService;
