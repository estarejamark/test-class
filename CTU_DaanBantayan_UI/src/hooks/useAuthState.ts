"use client";

/**
 * Auth State Management Hook
 * Handles authentication state, reducer, and actions
 */

import { useReducer, useCallback } from "react";
import { AuthState, UserResponse, ProfileResponse } from "@/types/auth";

// Storage key for persisting auth state
const AUTH_STORAGE_KEY = "ctu_auth_state";

// Initial state - always return consistent state for SSR
const getInitialState = (): AuthState => {
  return {
    isAuthenticated: false,
    isLoading: true,
    user: null,
    profile: null,
    error: null,
  };
};

export const initialState: AuthState = getInitialState();

// Action types for auth state management
export type AuthAction =
  | { type: "INIT_AUTH" }
  | { type: "LOGIN_START" }
  | {
      type: "LOGIN_SUCCESS";
      payload: {
        user: UserResponse;
        profile: ProfileResponse | null;
        accessToken?: string;
        refreshToken?: string;
      };
    }
  | { type: "LOGIN_FAILURE"; payload: string }
  | { type: "LOGOUT" }
  | { type: "PROFILE_UPDATE"; payload: ProfileResponse }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "RESTORE_FROM_STORAGE"; payload: Partial<AuthState> };

// Reducer function with improved state management
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "INIT_AUTH":
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case "LOGIN_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case "LOGIN_SUCCESS":
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            AUTH_STORAGE_KEY,
            JSON.stringify({
              isAuthenticated: true,
              user: action.payload.user,
              profile: action.payload.profile,
              accessToken: action.payload.accessToken,
              refreshToken: action.payload.refreshToken,
              timestamp: Date.now(),
            })
          );
          console.log("[useAuthState] LOGIN_SUCCESS - localStorage after set:", localStorage.getItem(AUTH_STORAGE_KEY));
        } catch (error) {
          console.warn("Failed to persist auth state:", error);
        }
      }

      return {
        isAuthenticated: true,
        isLoading: false,
        user: action.payload.user,
        profile: action.payload.profile,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        error: null,
      };

    case "LOGIN_FAILURE":
      // Clear storage on login failure
      if (typeof window !== "undefined") {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        console.log("[useAuthState] LOGIN_FAILURE - localStorage cleared");
      }

      return {
        isAuthenticated: false,
        isLoading: false,
        user: null,
        profile: null,
        error: action.payload,
      };

    case "LOGOUT":
      // Clear storage on logout
      if (typeof window !== "undefined") {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        console.log("[useAuthState] LOGOUT - localStorage cleared");
      }

      return {
        isAuthenticated: false,
        isLoading: false,
        user: null,
        profile: null,
        error: null,
      };

    case "PROFILE_UPDATE":
      const updatedState = {
        ...state,
        profile: action.payload,
      };

      // Update storage with new profile and timestamp
      if (typeof window !== "undefined" && state.isAuthenticated) {
        try {
          const storage = localStorage;
          if (storage) {
            const dataToStore = {
              isAuthenticated: true,
              user: state.user,
              profile: action.payload,
              timestamp: Date.now(),
            };
            storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(dataToStore));
            console.log("[useAuthState] PROFILE_UPDATE - localStorage updated:", storage.getItem(AUTH_STORAGE_KEY));
          }
        } catch (error) {
          console.warn("Failed to persist profile update:", error);
        }
      }

      return updatedState;

    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };

    case "RESTORE_FROM_STORAGE":
      return {
        ...state,
        ...action.payload,
        isLoading: true, // Keep loading true until auth verification
      };

    default:
      return state;
  }
}

/**
 * Custom hook for auth state management
 */
export function useAuthState() {
  const [authState, dispatch] = useReducer(authReducer, initialState);

  // Action creators
  const initAuth = useCallback(() => {
    dispatch({ type: "INIT_AUTH" });
  }, []);

  const loginStart = useCallback(() => {
    dispatch({ type: "LOGIN_START" });
  }, []);

  const loginSuccess = useCallback(
    (user: UserResponse, profile: ProfileResponse | null, accessToken?: string, refreshToken?: string) => {
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user, profile, accessToken, refreshToken },
      });
    },
    []
  );

  const loginFailure = useCallback((error: string) => {
    dispatch({ type: "LOGIN_FAILURE", payload: error });
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: "LOGOUT" });
  }, []);

  const updateProfile = useCallback((profile: ProfileResponse) => {
    dispatch({ type: "PROFILE_UPDATE", payload: profile });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: "SET_LOADING", payload: loading });
  }, []);

  const restoreFromStorage = useCallback((payload: Partial<AuthState>) => {
    dispatch({ type: "RESTORE_FROM_STORAGE", payload });
  }, []);

  return {
    authState,
    actions: {
      initAuth,
      loginStart,
      loginSuccess,
      loginFailure,
      logout,
      updateProfile,
      clearError,
      setLoading,
      restoreFromStorage,
    },
  };
}
