"use client";

import { useState, useEffect } from "react";
import { AppSidebar, NavigationItem } from "@/components/dashboard/app-sidebar";
import { SiteHeader } from "@/components/dashboard/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { DashboardHomeComponent } from "@/components/dashboard/pages/DashboardHomeComponent";
import { AttendanceOverviewComponent } from "@/components/dashboard/pages/AttendanceOverviewComponent";
import { TeacherAdviserReportsComponent } from "@/components/dashboard/pages/TeacherAdviserReportsComponent";
import { SettingsComponent } from "@/components/dashboard/pages/SettingsComponent";
import MyQuarterPackageComponent from "@/components/dashboard/pages/MyQuarterPackageComponent";
import SelectClassSubjectComponent from "@/components/dashboard/pages/SelectClassSubjectComponent";
import AttendanceComponent from "@/components/dashboard/pages/AttendanceComponent";
import QuarterlyEncodingComponent from "@/components/dashboard/pages/QuarterlyEncodingComponent";
import MaintainancePage from "@/components/MaintainancePage";
import SaveOptions from "@/components/dashboard/pages/SaveOptions";
import Status from "@/components/dashboard/pages/Status";
import ValidateRecords from "@/components/dashboard/pages/ValidateRecords";

import { useAuth } from "@/contexts/auth.context";
import { useSettings } from "@/contexts/settings.context";

import { ScheduleResponse } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell } from "lucide-react";
import { schedulesService } from "@/services/schedules.service";
import { AdvisoryClassListComponent } from "./AdvisoryClassListComponent";
import StudentFeedbackResponses from "./StudentFeedbackResponses";

export default function TeacherDashboard() {
  const [activeView, setActiveView] = useState<NavigationItem>("dashboard");
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleResponse | null>(null);

  const { user, profile, refreshProfile } = useAuth();
  const { activeQuarter, quarterUpdateMessage, schoolYear } = useSettings();

  // Ensure profile is always updated
  useEffect(() => {
    refreshProfile();
  }, []);

  // New state for teacher schedules
  const [teacherSchedules, setTeacherSchedules] = useState<ScheduleResponse[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [schedulesError, setSchedulesError] = useState<string | null>(null);

  const handleNavigation = (item: NavigationItem, schedule?: ScheduleResponse) => {
    console.log("🔄 TeacherDashboard - Navigation triggered:", item, schedule ? `with schedule ${schedule.id}` : '');
    setActiveView(item);
    if (schedule) {
      setSelectedSchedule(schedule);
    }
  };

  const handleScheduleSelect = (schedule: ScheduleResponse | null) => {
    setSelectedSchedule(schedule);
  };

  // Fetch and sort teacher schedules when profile id changes
  useEffect(() => {
    if (!profile?.id) return;

    const fetchTeacherSchedules = async () => {
      setIsLoadingSchedules(true);
      setSchedulesError(null);
      try {
        const schedules = await schedulesService.getSchedulesByTeacher(profile.id);

        const dayOrder = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
        const sortedSchedules = schedules.sort((a, b) => {
          const dayDiff = dayOrder.indexOf(a.days) - dayOrder.indexOf(b.days);
          if (dayDiff !== 0) return dayDiff;

          const timeDiff = a.startTime.localeCompare(b.startTime);
          if (timeDiff !== 0) return timeDiff;

          if (a.id < b.id) return -1;
          if (a.id > b.id) return 1;
          return 0;
        });

        setTeacherSchedules(sortedSchedules);
      } catch (error: any) {
        setSchedulesError(error.message || "Failed to load teacher schedules");
      } finally {
        setIsLoadingSchedules(false);
      }
    };

    fetchTeacherSchedules();
  }, [profile?.id]);

  const renderContent = () => {
    console.log("🔄 TeacherDashboard - renderContent called with activeView:", activeView);

    switch (activeView) {
      case "dashboard":
        return <DashboardHomeComponent />;
      case "select-class-subject":
        return (
          <SelectClassSubjectComponent
            onScheduleSelect={handleScheduleSelect}
            selectedSchedule={selectedSchedule}
            teacherSchedules={teacherSchedules}
            isLoadingSchedules={isLoadingSchedules}
            schedulesError={schedulesError}
            onNavigate={handleNavigation}
          />
        );
      case "daily-attendance":
        return <AttendanceComponent selectedSchedule={selectedSchedule} />;
      case "encode-records":
        return <QuarterlyEncodingComponent selectedSchedule={selectedSchedule} onNavigate={handleNavigation} />;
      case "save-options":
        return <SaveOptions selectedSchedule={selectedSchedule} />;

      case "my-quarter-package":
        return <MyQuarterPackageComponent selectedSchedule={selectedSchedule} onNavigate={handleNavigation} />;
      case "status":
        return <Status selectedSchedule={selectedSchedule} />;
      case "attendance-overview":
        return <AttendanceOverviewComponent />;
      case "reports":
        return <TeacherAdviserReportsComponent />;
      case "settings":
        return <SettingsComponent />;
      case "advisory-class-list":
        return <AdvisoryClassListComponent />;
      case "validate-records":
        console.log("🔄 TeacherDashboard - rendering ValidateRecords component");
        return <ValidateRecords />;
      case "adviser-dashboard":
        return <MaintainancePage />;
      case "student-feedback-responses":
        return <StudentFeedbackResponses />;
      default:
        return <DashboardHomeComponent />;
    }
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        variant="inset"
        onNavigate={handleNavigation}
        activeItem={activeView}
        role={user?.role}
        isAdviser={profile?.isAdviser}
      />

      <SidebarInset>
        <SiteHeader activeItem={activeView} />

        {quarterUpdateMessage && (
          <Alert className="mx-4 lg:mx-6 mt-2">
            <Bell className="h-4 w-4" />
            <AlertDescription>{quarterUpdateMessage}</AlertDescription>
          </Alert>
        )}

        {activeView === "select-class-subject" && (
          <div className="px-4 lg:px-6 py-2 text-sm text-muted-foreground border-b border-gray-200">
            <div className="flex items-center gap-4">
              
              <span className="font-medium">School Year:</span>
              <Badge variant="secondary" className="text-xs">
                {schoolYear?.yearRange ?? "Loading..."}
              </Badge>

              <span className="font-medium">Quarter:</span>
              <Badge variant="default" className="text-xs">
              {activeQuarter?.activeQuarter ?? "N/A"} (Active)
            </Badge>
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col">{renderContent()}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
