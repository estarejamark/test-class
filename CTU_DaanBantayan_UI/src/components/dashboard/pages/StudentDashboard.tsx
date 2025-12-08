"use client";

import { useState } from "react";
import { AppSidebar, NavigationItem } from "@/components/dashboard/app-sidebar";
import { SiteHeader } from "@/components/dashboard/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardHomeComponent } from "@/components/dashboard/pages/DashboardHomeComponent";
import { StudentDashboardOverview } from "@/components/dashboard/pages/StudentDashboardOverview";
import { StudentViewRecords } from "@/components/dashboard/pages/StudentViewRecords";
import { StudentCorrectionRequests } from "@/components/dashboard/pages/StudentCorrectionRequests";
import { StudentNotifications } from "@/components/dashboard/pages/StudentNotifications";
import { StudentSettings } from "@/components/dashboard/pages/StudentSettings";
import MaintainancePage from "@/components/MaintainancePage";
import { useAuth } from "@/contexts/auth.context";

export default function StudentDashboard() {
  const [activeView, setActiveView] = useState<NavigationItem>("dashboard");
  const { user } = useAuth();

  const handleNavigation = (item: NavigationItem) => {
    setActiveView(item);
  };

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return <StudentDashboardOverview onNavigate={handleNavigation} />;
      case "view-records":
        return <StudentViewRecords />;
      case "request-corrections":
        return <StudentCorrectionRequests />;
      case "notifications":
        return <StudentNotifications />;
      case "settings":
        return <StudentSettings />;
      default:
        return <StudentDashboardOverview />;
    }
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }>
      <AppSidebar
        variant="inset"
        onNavigate={handleNavigation}
        activeItem={activeView}
        role={user?.role}
      />
      <SidebarInset>
        <SiteHeader activeItem={activeView} />
        <div className="flex flex-1 flex-col">{renderContent()}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
