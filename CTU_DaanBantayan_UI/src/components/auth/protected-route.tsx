"use client";

/**
 * Protected Route Component
 * Handles authentication and authorization for protected pages
 */

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth.context";
import { PageLoading } from "@/components/utils";
import { Role } from "@/types/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: Role[];
  fallbackPath?: string;
  loadingComponent?: React.ReactNode;
  unauthorizedComponent?: React.ReactNode;
}

/**
 * Loading spinner component
 */
const DefaultLoadingComponent = () => <PageLoading text="Loading..." />;

/**
 * Unauthorized access component
 */
// const DefaultUnauthorizedComponent = () => {
//   const router = useRouter();

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-gray-50">
//       <div className="text-center max-w-md mx-auto p-6">
//         <div className="mb-4">
//           <svg
//             className="mx-auto h-16 w-16 text-red-500"
//             fill="none"
//             viewBox="0 0 24 24"
//             stroke="currentColor">
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"
//             />
//           </svg>
//         </div>
//         <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
//         <p className="text-gray-600 mb-6">
//           You don&apos;t have permission to access this page. Please contact
//           your administrator if you believe this is an error.
//         </p>
//         <button
//           onClick={() => router.replace("/")}
//           className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
//           Go to Login
//         </button>
//       </div>
//     </div>
//   );
// };

/**
 * Protected Route Component
 */
export function ProtectedRoute({
  children,
  requiredRoles = [],
  fallbackPath = "/login",
  loadingComponent = <DefaultLoadingComponent />,
  unauthorizedComponent = "/unauthorized",
}: ProtectedRouteProps) {
  const { authState } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect if we're still loading
    if (authState.isLoading) {
      return;
    }

    // Redirect to login if not authenticated
    if (!authState.isAuthenticated) {
      // Store the attempted URL for redirect after login
      const redirectUrl = encodeURIComponent(pathname);
      router.push(`${fallbackPath}?redirect=${redirectUrl}`);
      return;
    }

    // Check role-based authorization
    if (requiredRoles.length > 0 && authState.user) {
      const hasRequiredRole = requiredRoles.includes(authState.user.role);

      if (!hasRequiredRole) {
        // User is authenticated but doesn't have the required role
        console.warn(
          `User with role ${
            authState.user.role
          } attempted to access route requiring roles: ${requiredRoles.join(
            ", "
          )}`
        );
        router.push("/unauthorized");
      }
    }
  }, [
    authState.isLoading,
    authState.isAuthenticated,
    authState.user,
    requiredRoles,
    router,
    pathname,
    fallbackPath,
  ]);

  // Show loading state
  if (authState.isLoading) {
    return loadingComponent;
  }

  // Show login redirect (this should be handled by useEffect, but just in case)
  if (!authState.isAuthenticated) {
    return loadingComponent;
  }

  // Check role authorization
  if (requiredRoles.length > 0 && authState.user) {
    const hasRequiredRole = requiredRoles.includes(authState.user.role);

    if (!hasRequiredRole) {
      return unauthorizedComponent;
    }
  }

  // User is authenticated and authorized
  return <>{children}</>;
}

/**
 * Higher-Order Component for protecting pages
 */
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, "children"> = {}
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

/**
 * Hook for checking if user has specific roles
 */
export function useRoleCheck() {
  const { authState, isAdmin, isTeacher, isStudent } = useAuth();

  const hasRole = (role: Role): boolean => {
    return authState.user?.role === role;
  };

  const hasAnyRole = (roles: Role[]): boolean => {
    return authState.user ? roles.includes(authState.user.role) : false;
  };

  const hasAllRoles = (roles: Role[]): boolean => {
    // For this system, a user can only have one role, so this checks if the user's role is in the required list
    return authState.user ? roles.includes(authState.user.role) : false;
  };

  return {
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin,
    isTeacher,
    isStudent,
    userRole: authState.user?.role,
  };
}

/**
 * Component for conditionally rendering content based on roles
 */
interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[];
  fallback?: React.ReactNode;
}

export function RoleGuard({
  children,
  allowedRoles,
  fallback = null,
}: RoleGuardProps) {
  const { hasAnyRole } = useRoleCheck();

  if (!hasAnyRole(allowedRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Route protection for specific dashboard types
 */
export const AdminRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute requiredRoles={[Role.ADMIN]}>{children}</ProtectedRoute>
);

export const TeacherRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute requiredRoles={[Role.TEACHER]}>{children}</ProtectedRoute>
);

export const StudentRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute requiredRoles={[Role.STUDENT]}>{children}</ProtectedRoute>
);

export const StaffRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute requiredRoles={[Role.ADMIN, Role.TEACHER]}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;
