"use client";

import { useState, lazy, Suspense } from "react";
import { AppSidebar, NavigationItem } from "@/components/dashboard/app-sidebar";
import { SiteHeader } from "@/components/dashboard/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Role } from "@/types/auth";
import { DashboardHomeComponent } from "@/components/dashboard/pages/DashboardHomeComponent";
import { SettingsProvider } from "@/contexts/settings.context";

// Lazy load heavy components
const ManageUsersReusable = lazy(() => import("@/components/dashboard/pages/ManageUsersComponent").then(m => ({ default: m.ManageUsersComponent })));
const ManageSectionsComponent = lazy(() => import("@/components/dashboard/pages/ManageSectionsComponent").then(m => ({ default: m.ManageSectionsComponent })));
const ManageSubjectsComponent = lazy(() => import("@/components/dashboard/pages/ManageSubjectsComponent").then(m => ({ default: m.ManageSubjectsComponent })));
const ManageClassListComponent = lazy(() => import("@/components/dashboard/pages/ManageClassListComponent").then(m => ({ default: m.ManageClassListComponent })));
const TeacherLoadsComponent = lazy(() => import("@/components/dashboard/pages/TeacherLoadsComponent"));
const MonitorRecordsComponent = lazy(() => import("@/components/dashboard/pages/MonitorRecordsComponent").then(m => ({ default: m.MonitorRecordsComponent })));
const AttendanceOverviewComponent = lazy(() => import("@/components/dashboard/pages/AttendanceOverviewComponent").then(m => ({ default: m.AttendanceOverviewComponent })));
const ReportsComponent = lazy(() => import("@/components/dashboard/pages/ReportsComponent").then(m => ({ default: m.ReportsComponent })));
const SettingsComponent = lazy(() => import("@/components/dashboard/pages/SettingsComponent").then(m => ({ default: m.SettingsComponent })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

import data from "./data.json";

export default function Page() {
  const [activeView, setActiveView] = useState<NavigationItem>("dashboard");
  const [navigationParams, setNavigationParams] = useState<Record<string, string>>({});

  const handleNavigation = (item: NavigationItem) => {
    // Handle parameterized navigation like "manage-class-list:sectionId"
    if (typeof item === 'string' && item.includes(':')) {
      const [baseItem, param] = item.split(':');
      setActiveView(baseItem as NavigationItem);
      setNavigationParams({ sectionId: param });
    } else {
      setActiveView(item);
      setNavigationParams({});
    }
  };

  const renderContent = () => {
    const content = (() => {
      switch (activeView) {
        case "dashboard":
          return <DashboardHomeComponent />;
        case "manage-users-reusable":
          return <ManageUsersReusable />;
        case "manage-sections":
          return <ManageSectionsComponent />;
        case "manage-subjects":
          return <ManageSubjectsComponent />;
        case "manage-class-list":
          return <ManageClassListComponent preSelectedSectionId={navigationParams.sectionId} />;
        case "teacher-loads":
          return <TeacherLoadsComponent />;
        case "monitor-records":
          return <MonitorRecordsComponent />;
        case "attendance-overview":
          return <AttendanceOverviewComponent />;
        case "reports":
          return <ReportsComponent />;
        case "settings":
          return (
            <SettingsProvider>
              <SettingsComponent />
            </SettingsProvider>
          );
        default:
          return <DashboardHomeComponent />;
      }
    })();

    return <Suspense fallback={<LoadingFallback />}>{content}</Suspense>;
  };

  return (
    <ProtectedRoute requiredRoles={[Role.ADMIN]}>
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
          role="ADMIN"
        />
        <SidebarInset>
          <SiteHeader activeItem={activeView} />
          <div className="flex flex-1 flex-col">{renderContent()}</div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
