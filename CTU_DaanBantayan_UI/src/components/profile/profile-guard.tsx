"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth.context";
import ProfileCompletionModal from "./profile-completion-modal";

interface ProfileGuardProps {
  children: React.ReactNode;
}

/**
 * ProfileGuard component that ensures users have completed their profile
 * before they can access the application. Shows a modal that forces
 * profile completion if the user doesn't have a profile.
 */
export default function ProfileGuard({ children }: ProfileGuardProps) {
  const pathname = usePathname();
  const { user, profile, isProfileComplete, authState } = useAuth();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Don't show the profile completion modal on landing page "/" or login page "/login"
    if (pathname === "/" || pathname === "/login") {
      setShowModal(false);
      return;
    }

    // Only check for profile completion if user is authenticated and not loading
    if (authState.isAuthenticated && !authState.isLoading && user) {
      // If user is authenticated but has no profile, they need to complete it
      if (!isProfileComplete && profile === null) {
        console.log("📝 User needs to complete profile - showing modal");
        setShowModal(true);
        return;
      }

      // If profile exists and is complete, hide modal
      if (isProfileComplete && profile) {
        console.log("✅ Profile is complete - hiding modal");
        setShowModal(false);
        return;
      }
    }

    // If not authenticated or still loading, hide modal
    if (!authState.isAuthenticated || authState.isLoading) {
      setShowModal(false);
    }
  }, [
    authState.isAuthenticated,
    authState.isLoading,
    user,
    isProfileComplete,
    profile,
    pathname,
  ]);

  const handleModalClose = () => {
    // Allow closing the modal - profile completion is now optional
    setShowModal(false);
  };

  // Always render children - profile completion is now optional
  // Profile completion modal will be shown as a reminder, not a blocker

  // Render children normally if profile is complete or user is not authenticated
  return (
    <>
      {children}

      {/* Profile completion modal for edge cases */}
      <ProfileCompletionModal isOpen={showModal} onClose={handleModalClose} />
    </>
  );
}
