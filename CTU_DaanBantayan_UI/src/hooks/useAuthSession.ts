"use client";

/**
 * Auth Session Management Hook
 * Handles session persistence, timeout, and initialization
 */

import { useCallback } from "react";
import { AuthState } from "@/types/auth";

// Storage key for persisting auth state
const AUTH_STORAGE_KEY = "ctu_auth_state";

// Session timeout in milliseconds (24 hours)
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

// Configuration for session behavior
const SESSION_CONFIG = {
  // Set to true to use sessionStorage (clears on browser close)
  // Set to false to use localStorage with timeout (persists across browser restarts)
  useSessionStorage: false, // Use localStorage for persistent sessions
  sessionTimeout: SESSION_TIMEOUT,
};

// Helper function to get storage object based on configuration
const getStorage = () => {
  if (typeof window === "undefined") return null;
  return SESSION_CONFIG.useSessionStorage ? sessionStorage : localStorage;
};

// Helper function to check if session is expired
const isSessionExpired = (timestamp: number): boolean => {
  if (SESSION_CONFIG.useSessionStorage) return false; // sessionStorage doesn't need timeout
  return Date.now() - timestamp > SESSION_CONFIG.sessionTimeout;
};

// Utility function to manually clear all auth data
export const clearAllAuthData = () => {
  if (typeof window === "undefined") return;

  // Clear from both localStorage and sessionStorage to be safe
  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
};

/**
 * Custom hook for auth session management
 */
export function useAuthSession() {
  // Initialize auth state from storage
  const initializeAuth = useCallback(async () => {
    // Restore from storage if available (client-side only)
    if (typeof window !== "undefined") {
      try {
        const storage = getStorage();
        const savedState = storage?.getItem(AUTH_STORAGE_KEY);
if (savedState) {
  const parsed = JSON.parse(savedState);
  console.log("🔄 Checking cached auth state:", parsed);

  try {
    console.log("[useAuthSession] Storage content before expiry check:", savedState);
  } catch (e) {
    console.warn("[useAuthSession] Error logging storage content:", e);
  }

  // Check if session has expired (only for localStorage)
  if (
    !SESSION_CONFIG.useSessionStorage &&
    parsed.timestamp &&
    isSessionExpired(parsed.timestamp)
  ) {
    console.log("⏰ Session expired - clearing auth state");
    storage?.removeItem(AUTH_STORAGE_KEY);
    return null;
  }

  // If we have valid cached auth data and session is not expired, return it
  if (parsed.isAuthenticated && parsed.user) {
    const sessionType = SESSION_CONFIG.useSessionStorage
      ? "session"
      : "persistent";
    console.log(`✅ Using cached auth state (${sessionType} storage)`);
    return {
      isAuthenticated: parsed.isAuthenticated,
      user: parsed.user,
      profile: parsed.profile || null,
    };
  }
}
      } catch (error) {
        console.warn("Failed to restore auth state from storage:", error);
        const storage = getStorage();
        storage?.removeItem(AUTH_STORAGE_KEY);
      }
    }
    return null;
  }, []);

  // Handle browser close/refresh
  const handleBeforeUnload = useCallback(
    (event: BeforeUnloadEvent, isAuthenticated: boolean) => {
      if (isAuthenticated) {
        const message = "Are you sure you want to leave? You will be logged out.";
        event.returnValue = message;
        return message;
      }
    },
    []
  );

  // Handle visibility change (when user switches tabs or minimizes browser)
  const handleVisibilityChange = useCallback(
    (logout: () => void, isAuthenticated: boolean) => {
      if (document.hidden) {
        console.log("👁️ Browser tab hidden");
      } else {
        console.log("👁️ Browser tab visible");
        if (!SESSION_CONFIG.useSessionStorage) {
          const storage = getStorage();
          const savedState = storage?.getItem(AUTH_STORAGE_KEY);
          if (savedState) {
            try {
              const parsed = JSON.parse(savedState);
              if (parsed.timestamp && isSessionExpired(parsed.timestamp)) {
                console.log(
                  "⏰ Session expired while tab was hidden - logging out"
                );
                storage?.removeItem(AUTH_STORAGE_KEY);
                logout();
              }
            } catch (error) {
              console.warn(
                "Error checking session on visibility change:",
                error
              );
            }
          }
        }
      }
    },
    []
  );

  // Handle refresh token event from API client
  const handleRefreshTokenEvent = useCallback(
    async (refreshToken: () => Promise<void>, logout: () => void) => {
      const shouldRefresh = window.confirm(
        "Your session has expired or is invalid. Would you like to refresh your session?"
      );
      if (shouldRefresh) {
        try {
          await refreshToken();
          window.alert("Session refreshed successfully.");
        } catch (error) {
          window.alert("Failed to refresh session. You will be logged out.");
          logout();
        }
      } else {
        logout();
      }
    },
    []
  );

  return {
    initializeAuth,
    handleBeforeUnload,
    handleVisibilityChange,
    handleRefreshTokenEvent,
    clearAllAuthData,
    sessionConfig: SESSION_CONFIG,
  };
}
