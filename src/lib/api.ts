import type { ApiValidationError } from "@/types";
import { session } from "./session";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions extends Omit<RequestInit, "body"> {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
  params?: Record<string, string | number | boolean | undefined | null>;
}

export interface ApiClientErrorParams {
  message: string;
  status: number;
  statusText: string;
  errors?: ApiValidationError[];
  data?: unknown;
  isNetworkError?: boolean;
}

/**
 * Standard typed error thrown on HTTP failures or network errors
 */
export class ApiClientError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly errors?: ApiValidationError[];
  public readonly data?: unknown;
  public readonly isNetworkError: boolean;

  constructor({
    message,
    status,
    statusText,
    errors,
    data,
    isNetworkError = false,
  }: ApiClientErrorParams) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.statusText = statusText;
    this.errors = errors;
    this.data = data;
    this.isNetworkError = isNetworkError;

    // Maintains proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiClientError);
    }
  }

  get isBadRequest(): boolean {
    return this.status === 400;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isValidationError(): boolean {
    return this.status === 400 && Array.isArray(this.errors) && this.errors.length > 0;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }
}

/**
 * Builds the complete URL including query string parameters
 */
function buildUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  let urlString: string;

  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    urlString = endpoint;
  } else {
    const base = API_BASE_URL.replace(/\/+$/, "");
    const cleanEndpoint = endpoint.replace(/^\/+/, "");
    urlString = `${base}/${cleanEndpoint}`;
  }

  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      urlString += (urlString.includes("?") ? "&" : "?") + queryString;
    }
  }

  return urlString;
}

/**
 * Reusable core fetch client supporting typed requests, JSON serialization,
 * optional caller-supplied JWT, error classification, and safe parsing.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = "GET",
    body,
    token,
    params,
    headers: customHeaders,
    ...fetchRest
  } = options;

  const url = buildUrl(endpoint, params);

  const headers = new Headers(customHeaders);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const resolvedToken = token !== undefined ? token : session.getToken();
  if (resolvedToken) {
    headers.set("Authorization", `Bearer ${resolvedToken.trim()}`);
  }

  let serializedBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (
      typeof body === "string" ||
      body instanceof FormData ||
      body instanceof Blob ||
      body instanceof URLSearchParams
    ) {
      serializedBody = body;
    } else {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      serializedBody = JSON.stringify(body);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: serializedBody,
      ...fetchRest,
    });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Network failure while connecting to server";
    throw new ApiClientError({
      message: errorMessage,
      status: 0,
      statusText: "Network Error",
      isNetworkError: true,
    });
  }

  // Safe parsing of response body
  const contentType = response.headers.get("content-type") || "";
  let responseData: unknown = null;

  if (contentType.includes("application/json")) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  } else {
    try {
      responseData = await response.text();
    } catch {
      responseData = null;
    }
  }

  if (!response.ok) {
    let extractedMessage = response.statusText || `Request failed with status ${response.status}`;
    let validationErrors: ApiValidationError[] | undefined;

    if (responseData && typeof responseData === "object") {
      const dataObj = responseData as Record<string, unknown>;
      if (typeof dataObj.message === "string" && dataObj.message.trim()) {
        extractedMessage = dataObj.message;
      } else if (typeof dataObj.error === "string" && dataObj.error.trim()) {
        extractedMessage = dataObj.error;
      }

      if (Array.isArray(dataObj.errors)) {
        validationErrors = dataObj.errors as ApiValidationError[];
      }
    }

    throw new ApiClientError({
      message: extractedMessage,
      status: response.status,
      statusText: response.statusText,
      errors: validationErrors,
      data: responseData,
      isNetworkError: false,
    });
  }

  return responseData as T;
}

/**
 * Convenience methods for common HTTP verbs
 */
apiClient.get = function <T>(
  endpoint: string,
  options?: Omit<RequestOptions, "method">
): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: "GET" });
};

apiClient.post = function <T>(
  endpoint: string,
  body?: unknown,
  options?: Omit<RequestOptions, "method" | "body">
): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: "POST", body });
};

apiClient.put = function <T>(
  endpoint: string,
  body?: unknown,
  options?: Omit<RequestOptions, "method" | "body">
): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: "PUT", body });
};

apiClient.patch = function <T>(
  endpoint: string,
  body?: unknown,
  options?: Omit<RequestOptions, "method" | "body">
): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: "PATCH", body });
};

apiClient.delete = function <T>(
  endpoint: string,
  options?: Omit<RequestOptions, "method">
): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: "DELETE" });
};
