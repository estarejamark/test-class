"use client";

/**
 * Authentication Context Provider
 * Manages global authentication state and provides auth methods to the entire app
 *
 * Features:
 * - JWT cookie-based authentication
 * - Persistent state management
 * - Role-based access control
 * - Profile management integration
 * - Automatic token refresh
 */

import React, {
  createContext,
  useContext,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import {
  AuthState,
  AuthContextType,
  LoginRequest,
  UserResponse,
  ProfileResponse,
  Role,
} from "@/types/auth";
import { PageLoading } from "@/components/utils";
import { useAuthState } from "@/hooks/useAuthState";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useAuthMethods } from "@/hooks/useAuth";

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component props
interface AuthProviderProps {
  children: React.ReactNode;
}

// Provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const { authState, actions } = useAuthState();
  const {
    initializeAuth: initSession,
    handleBeforeUnload,
    handleVisibilityChange,
    handleRefreshTokenEvent,
  } = useAuthSession();
  const {
    login,
    logout,
    refreshToken,
    getCurrentUser,
    refreshProfile,
  } = useAuthMethods(
    actions.loginSuccess,
    actions.loginFailure,
    actions.logout,
    actions.updateProfile,
    actions.setLoading
  );
  const router = useRouter();

  // Initialize auth state on component mount
  useEffect(() => {
    const init = async () => {
      actions.initAuth();
      const restoredState = await initSession();
      if (restoredState) {
        actions.restoreFromStorage(restoredState);
      }
      actions.setLoading(false);
    };
    init();
  }, []);

  // Add browser close detection, session management, and refresh token event listener
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Handle browser close/refresh
    const onBeforeUnload = (event: BeforeUnloadEvent) =>
      handleBeforeUnload(event, authState.isAuthenticated);

    // Handle visibility change (when user switches tabs or minimizes browser)
    const onVisibilityChange = () =>
      handleVisibilityChange(actions.logout, authState.isAuthenticated);

    // Handle refresh token event from API client
    const onRefreshTokenEvent = () =>
      handleRefreshTokenEvent(
        () => refreshToken(authState.user?.id || ""),
        actions.logout
      );

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("triggerRefreshToken", onRefreshTokenEvent);

    // Cleanup
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("triggerRefreshToken", onRefreshTokenEvent);
    };
  }, [authState.isAuthenticated, authState.user?.id, actions.logout, handleBeforeUnload, handleVisibilityChange, handleRefreshTokenEvent, refreshToken]);

  // Clear error function
  const clearError = () => {
    actions.clearError();
  };

  // Computed properties
  const isAdmin = authState.user?.role === Role.ADMIN;
  const isTeacher = authState.user?.role === Role.TEACHER;
  const isStudent = authState.user?.role === Role.STUDENT;
  const isProfileComplete = Boolean(
    authState.profile?.firstName && authState.profile?.lastName
  );
  const hasValidSession = authState.isAuthenticated && Boolean(authState.user);

  // Context value
  const contextValue: AuthContextType = {
    authState,
    login,
    logout,
    refreshToken: () => refreshToken(authState.user?.id || ""),
    getCurrentUser,
    refreshProfile,
    clearError,
    user: authState.user,
    profile: authState.profile,
    isProfileComplete,
    isAdmin,
    isTeacher,
    isStudent,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

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

// HOC for components that require authentication
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function AuthenticatedComponent(props: P) {
    const { authState } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!authState.isLoading && !authState.isAuthenticated) {
        const currentPath = window.location.pathname + window.location.search;
        const redirectUrl = `/login?redirect=${encodeURIComponent(
          currentPath
        )}`;
        console.log("🔒 Not authenticated, redirecting to:", redirectUrl);
        router.push(redirectUrl);
      }
    }, [authState.isAuthenticated, authState.isLoading, router]);

    // Show loading spinner while checking authentication
    if (authState.isLoading) {
      return <PageLoading text="Verifying authentication..." />;
    }

    // Don't render component if not authenticated
    if (!authState.isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}

// HOC for components that require specific roles
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles: Role[]
): React.ComponentType<P> {
  return function RoleProtectedComponent(props: P) {
    const { authState } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!authState.isLoading && authState.isAuthenticated) {
        if (!authState.user || !requiredRoles.includes(authState.user.role)) {
          console.log(
            "🚫 Access denied. User role:",
            authState.user?.role,
            "Required:",
            requiredRoles
          );
          router.push("/unauthorized");
        }
      }
    }, [authState, router]);

    // Show loading spinner while checking roles
    if (authState.isLoading) {
      return <PageLoading text="Checking permissions..." />;
    }

    // Don't render if not authenticated or wrong role
    if (
      !authState.isAuthenticated ||
      !authState.user ||
      !requiredRoles.includes(authState.user.role)
    ) {
      return null;
    }

    return <Component {...props} />;
  };
}

// HOC for components that require a complete profile
export function withProfile<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function ProfileRequiredComponent(props: P) {
    const { authState, isProfileComplete } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (
        !authState.isLoading &&
        authState.isAuthenticated &&
        !isProfileComplete
      ) {
        console.log("📝 Profile incomplete, redirecting to profile setup");
        router.push("/profile-setup");
      }
    }, [
      authState.isAuthenticated,
      authState.isLoading,
      isProfileComplete,
      router,
    ]);

    // Show loading spinner while checking profile
    if (authState.isLoading) {
      return <PageLoading text="Loading profile..." />;
    }

    // Don't render if profile is not complete
    if (!authState.isAuthenticated || !isProfileComplete) {
      return null;
    }

    return <Component {...props} />;
  };
}

export default AuthProvider;
