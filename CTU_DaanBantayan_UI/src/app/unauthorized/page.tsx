"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth.context";
import { Role } from "@/types/auth";

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleGoBack = () => {
    if (user?.role === Role.ADMIN) {
      router.push("/admin-dashboard");
    } else if (user?.role === Role.TEACHER) {
      router.push("/teacher-dashboard");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mb-4">
          <svg
            className="mx-auto h-16 w-16 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Access Denied
        </h1>
        <p className="text-muted-foreground mb-6">
          You don&apos;t have permission to access this page. Please contact
          your administrator if you believe this is an error.
        </p>
        <Button onClick={handleGoBack}>Return to Your Dashboard</Button>
      </div>
    </div>
  );
}
