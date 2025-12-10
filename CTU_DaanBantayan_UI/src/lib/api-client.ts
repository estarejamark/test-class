/**
 * API client configuration for communicating with the CTU backend
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";

const API_BASE_URL = "https://test-class-production.up.railway.app";

// Debug logging for API base URL
console.log("🔍 API_BASE_URL:", API_BASE_URL);
console.log("🔍 process.env.NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL);
console.log("🔍 All env vars:", Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC')));
console.log("🔍 NODE_ENV:", process.env.NODE_ENV);

/**
 * Custom error class for API-related errors
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * API response wrapper type
 */
export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  message?: string;
}

/**
 * Generic API client for making HTTP requests using Axios
 */
class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string = API_BASE_URL) {
    console.log("🔧 ApiClient initialized with baseURL:", baseURL);
    this.axiosInstance = axios.create({
      baseURL,
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    this.axiosInstance.interceptors.request.use(
      (config) => {
        const isAuthEndpoint =
          config.url?.includes("/auth/") ||
          config.url?.includes("/profiles/me");

        if (!isAuthEndpoint) {
          console.log("🔍 API Request Debug:", {
            url: config.url,
            method: config.method?.toUpperCase(),
            headers: config.headers,
            withCredentials: config.withCredentials,
            data: config.data,
          });
        }
        return config;
      },
      (error) => {
        console.error("🔥 Request Error:", error);
        return Promise.reject(error);
      }
    );

    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        const isAuthEndpoint =
          response.config.url?.includes("/auth/") ||
          response.config.url?.includes("/profiles/me");

        if (!isAuthEndpoint || response.status < 400) {
          console.log("🔍 API Response Debug:", {
            status: response.status,
            statusText: response.statusText,
            url: response.config.url,
            data: response.data,
          });
        }

        return response;
      },
      (error: AxiosError) => {
        const isAuthEndpoint =
          error.config?.url?.includes("/auth/") ||
          error.config?.url?.includes("/profiles/me");
        const isAuthFailure =
          error.response?.status === 401 || error.response?.status === 403;

        // Detect 401 Unauthorized with Invalid Token
        // Safely extract a potential message from response data without using `any`
        const respData = error.response?.data as unknown;
        const messageFromData =
          typeof respData === "string"
            ? respData
            : respData &&
              typeof respData === "object" &&
              "message" in respData &&
              typeof (respData as { message?: unknown }).message === "string"
            ? (respData as { message: string }).message
            : undefined;

        const isInvalidToken =
          error.response?.status === 401 &&
          typeof messageFromData === "string" &&
          messageFromData.includes("Invalid Token");

        if (isInvalidToken) {
          // Prompt user to refresh token (UI integration required)
          if (window && typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("triggerRefreshToken", {
                detail: {
                  reason: "Invalid Token",
                  status: 401,
                  url: error.config?.url,
                },
              })
            );
          }
        }

        if (!isAuthFailure || !isAuthEndpoint) {
          console.error("🚨 API Response Error:", {
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url,
            method: error.config?.method?.toUpperCase(),
            data: error.response?.data,
            errorMessage: error.message,
          });
        } else {
          console.log("🔐 Authentication required:", {
            status: error.response?.status,
            url: error.config?.url,
          });
        }

        let errorMessage = `HTTP error! status: ${error.response?.status || 0}`;
        let errorDetails: unknown = null;

        if (error.response?.data) {
          if (typeof error.response.data === "string") {
            errorMessage = error.response.data;
            errorDetails = error.response.data;
          } else if (typeof error.response.data === "object") {
            const dataObj = error.response.data as Record<string, unknown>;
            if (typeof dataObj["message"] === "string") {
              errorMessage = dataObj["message"] as string;
            } else if (typeof dataObj["error"] === "string") {
              errorMessage = dataObj["error"] as string;
            }
            errorDetails = dataObj;
          } else {
            errorDetails = error.response.data as unknown;
          }
        } else if (error.request) {
          console.error("🌐 Network Error:", {
            url: error.config?.url,
            method: error.config?.method?.toUpperCase(),
            message: error.message,
            code: error.code,
          });
          errorMessage = "Network error - please check your connection";
          errorDetails = {
            originalError: error.message,
            code: error.code,
          } as unknown;
        } else if (error.message) {
          console.error("⚠️ Request Setup Error:", {
            message: error.message,
            stack: error.stack,
          });
          errorMessage = error.message;
          errorDetails = { originalError: error.message } as unknown;
        }

        // Provide specific error messages for authentication failures
        if (error.response?.status === 401) {
          errorMessage = "Authentication failed. Please log in again.";
        } else if (error.response?.status === 403) {
          errorMessage = "Access denied. You don't have permission to perform this action.";
        } else if (error.response?.status === 500) {
          errorMessage = "Server error. Please try again later.";
        }

        throw new ApiError(
          error.response?.status || 0,
          errorMessage,
          errorDetails
        );
      }
    );
  }

  async get<T>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const response = await this.axiosInstance.get<T>(url, {
      headers,
      withCredentials: true,
    });
    return { data: response.data, status: response.status };
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const response = await this.axiosInstance.post<T>(url, data, {
      headers,
      withCredentials: true,
    });
    return { data: response.data, status: response.status };
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const response = await this.axiosInstance.put<T>(url, data, {
      headers,
      withCredentials: true,
    });
    return { data: response.data, status: response.status };
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const response = await this.axiosInstance.patch<T>(url, data, {
      headers,
      withCredentials: true,
    });
    return { data: response.data, status: response.status };
  }

  async delete<T>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const response = await this.axiosInstance.delete<T>(url, {
      headers,
      withCredentials: true,
    });
    return { data: response.data, status: response.status };
  }
}

export const apiClient = new ApiClient();
