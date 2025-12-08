"use client";

/**
 * Auth Methods Hook
 * Provides core authentication methods and business logic
 */

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { LoginRequest, UserResponse, ProfileResponse, Role } from "@/types/auth";

// Helper function to determine redirect path based on role
function getRedirectPath(role: Role): string {
  switch (role) {
    case Role.ADMIN:
      return "/admin-dashboard";
    case Role.TEACHER:
      return "/teacher-dashboard";
    case Role.STUDENT:
      return "/student-dashboard";
    default:
      return "/dashboard";
  }
}

/**
 * Custom hook for auth methods
 */
export function useAuthMethods(
  loginSuccess: (user: UserResponse, profile: ProfileResponse | null) => void,
  loginFailure: (error: string) => void,
  logout: () => void,
  updateProfile: (profile: ProfileResponse) => void,
  setLoading: (loading: boolean) => void
) {
  const router = useRouter();

  // Login function
  const login = useCallback(
    async (credentials: LoginRequest) => {
      try {
        // Always clear auth data before login to prevent stale session issues
        if (typeof window !== "undefined") {
          localStorage.removeItem("ctu_auth_state");
          sessionStorage.removeItem("ctu_auth_state");
        }

        setLoading(true);
        console.log("🔐 Starting login process...");
        const loginResponse = await authService.login(credentials);
        console.log("✅ Login successful:", loginResponse);

        // Check if profile completion is required based on the login response
        const needsProfileCompletion = !loginResponse.profileComplete && loginResponse.userResponse.role === "STUDENT";

        // Try to get current user profile from /api/profiles/me after successful login
        let profile: ProfileResponse | null = null;

        try {
          console.log("📱 Fetching user profile from /api/profiles/me...");
          profile = await authService.getCurrentUser();
          console.log("📱 Profile fetched successfully:", profile);
        } catch (profileError) {
          console.warn(
            "⚠️ Could not fetch user profile - user may need to complete profile:",
            profileError
          );
          // If profile doesn't exist (404), mark for completion
          // This is a fallback in case the profileComplete flag is not accurate
        }

        loginSuccess(loginResponse.userResponse, profile);

        // Always redirect to dashboard - don't block on profile completion
        // Profile completion will be handled as an optional reminder in the dashboard
        const urlParams = new URLSearchParams(window.location.search);
        const redirectPath =
          urlParams.get("redirect") ||
          getRedirectPath(loginResponse.userResponse.role);

        console.log("🚀 Redirecting to:", redirectPath);

        // Additional debug: Verify router is functional and log current pathname before redirect
        console.debug("Current pathname before redirect:", window.location.pathname);

        // Add try-catch to catch errors during router.push
        try {
          await router.push(redirectPath);
          console.log("Redirect successful");
        } catch (err) {
          console.error("Redirect error:", err);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Login failed";
        console.error("❌ Login failed:", errorMessage);
        loginFailure(errorMessage);
        throw error;
      }
    },
    [loginSuccess, loginFailure, setLoading, router]
  );

  // Logout function
  const logoutUser = useCallback(async () => {
    try {
      console.log("🚪 Starting logout process...");
      await authService.logout();
      console.log("✅ Logout successful");
    } catch (error) {
      console.error("❌ Logout error:", error);
    } finally {
      logout();
      router.push("/login");
    }
  }, [logout, router]);

  // Refresh token function
  const refreshToken = useCallback(async (userId: string) => {
    try {
      console.log("🔄 Refreshing token...");
      await authService.refreshToken(userId);
      console.log("✅ Token refresh successful");
    } catch (error) {
      console.error("❌ Token refresh failed:", error);
      logout();
    }
  }, [logout]);

  // Get current user function - only call when explicitly needed
  const getCurrentUser = useCallback(async () => {
    try {
      console.log("👤 Fetching current user...");
      const profile = await authService.getCurrentUser();
      // Return profile instead of dispatching
      return profile;
    } catch (error) {
      console.error("❌ Failed to get current user:", error);
      // Don't logout automatically, let user decide
      throw error;
    }
  }, []);

  // Refresh profile function - only call when explicitly needed
  const refreshProfile = useCallback(async () => {
    try {
      console.log("🔄 Refreshing profile...");
      const profile = await authService.getCurrentUser();
      updateProfile(profile);
    } catch (error) {
      console.error("❌ Failed to refresh profile:", error);
      // Don't logout on profile refresh failure, just log the error
    }
  }, [updateProfile]);

  return {
    login,
    logout: logoutUser,
    refreshToken,
    getCurrentUser,
    refreshProfile,
  };
}
