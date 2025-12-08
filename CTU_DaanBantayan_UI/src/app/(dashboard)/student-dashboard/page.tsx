"use client";

import { Suspense } from "react";
import StudentDashboard from "@/components/dashboard/pages/StudentDashboard";
import { withRole } from "@/contexts/auth.context";
import { Role } from "@/types/auth";

// Simple loading component for Suspense fallback
function LoadingDashboard() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="space-y-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  );
}

const ProtectedStudentDashboard = withRole(
  function Dashboard() {
    return (
      <div className="w-full">
        <Suspense fallback={<LoadingDashboard />}>
          <StudentDashboard />
        </Suspense>
      </div>
    );
  },
  [Role.STUDENT]
);

export default ProtectedStudentDashboard;
