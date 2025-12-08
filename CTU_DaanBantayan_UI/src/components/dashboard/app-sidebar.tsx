"use client";

import * as React from "react";
import Image from "next/image";
import {
  IconChartBar,
  IconFileDescription,
  IconCalendar,
  IconListDetails,
  IconReport,
  IconSettings,
  IconUsers,
  IconChalkboard,
  IconBriefcase,
  IconPackage,
  IconBell,
} from "@tabler/icons-react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export type NavigationItem =
  | "dashboard"
  | "manage-users-reusable"
  | "manage-sections"
  | "manage-subjects"
  | "manage-class-list"
  | "manage-class-list:"
  | "teacher-loads"
  | "monitor-records"
  | "attendance-overview"
  | "daily-attendance"
  | "reports"
  | "settings"
  | "view-records"
  | "respond-feedback"
  | "acknowledgements"
  | "profile"
  | "request-corrections"
  | "adviser-dashboard"
  | "validate-records"
  | "advisory-class-list"
  | "student-feedback-responses"
  | string; // Allow parameterized navigation like "manage-class-list:sectionId"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onNavigate?: (item: NavigationItem) => void;
  activeItem?: NavigationItem;
  isAdmin?: boolean;
  role?: string;
  isAdviser?: boolean;
}
export function AppSidebar({
  onNavigate,
  activeItem,
  isAdmin,
  role,
  isAdviser,
  ...props
}: AppSidebarProps) {
  const { setOpenMobile } = useSidebar();

  const handleNavigation = (item: NavigationItem) => {
    onNavigate?.(item);
    // Close sidebar on mobile after navigation
    setOpenMobile(false);
  };

  return (
    <>
      <Sidebar collapsible="offcanvas" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleNavigation("dashboard")}
                className="data-[slot=sidebar-menu-button]:!p-2 cursor-pointer flex items-center gap-3">
                <Image
                  src="/logo1.jpg"
                  alt="Academia de San Martin logo"
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                />

                <span className="text-base font-semibold">MCMT Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {role === "STUDENT" ? (
            <>
              {/* Student Dashboard Section */}
              <SidebarGroup>
                <SidebarGroupLabel>Student Dashboard</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleNavigation("dashboard")}
                      className={
                        activeItem === "dashboard"
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "cursor-pointer"
                      }>
                      <IconChartBar />
                      <span>Dashboard Overview</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleNavigation("view-records")}
                      className={
                        activeItem === "view-records"
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "cursor-pointer"
                      }>
                      <IconFileDescription />
                      <span>View Records</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleNavigation("request-corrections")}
                      className={
                        activeItem === "request-corrections"
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "cursor-pointer"
                      }>
                      <IconChalkboard />
                      <span>Request Record Corrections</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleNavigation("notifications")}
                      className={
                        activeItem === "notifications"
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "cursor-pointer"
                      }>
                      <IconBell />
                      <span>Notifications</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleNavigation("settings")}
                      className={
                        activeItem === "settings"
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "cursor-pointer"
                      }>
                      <IconSettings />
                      <span>Settings</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            </>
          ) : role === "ADMIN" ? (
            <>
              {/* Management Section */}
              <SidebarGroup>
                <SidebarGroupLabel>Management</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleNavigation("manage-users-reusable")}
                      className={
                        activeItem === "manage-users-reusable"
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "cursor-pointer"
                      }>
                      <IconUsers />
                      <span>Manage Users</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleNavigation("manage-sections")}
                      className={
                        activeItem === "manage-sections"
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "cursor-pointer"
                      }>
                      <IconListDetails />
                      <span>Manage Sections</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleNavigation("manage-subjects")}
                      className={
                        activeItem === "manage-subjects"
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "cursor-pointer"
                      }>
                      <IconFileDescription />
                      <span>Manage Subjects</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleNavigation("manage-class-list")}
                      className={
                        activeItem === "manage-class-list"
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "cursor-pointer"
                      }>
                      <IconChalkboard />
                      <span>Manage Class List</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                </SidebarMenu>
              </SidebarGroup>
            </>
          ) : null}

          {role !== "STUDENT" && (
            <>
              {/* Academic Monitoring Section */}
              <SidebarGroup>
                <SidebarGroupLabel>Academic Monitoring</SidebarGroupLabel>
                <SidebarMenu>
                  {role === "TEACHER" ? (
                    <>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => handleNavigation("select-class-subject")}
                          className={
                            activeItem === "select-class-subject"
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "cursor-pointer"
                          }>
                          <IconBriefcase />
                          <span>Select Class/Subject from Timetable</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => handleNavigation("daily-attendance")}
                          className={
                            activeItem === "daily-attendance"
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "cursor-pointer"
                          }>
                          <IconCalendar />
                          <span>Daily Attendance</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => handleNavigation("encode-records")}
                          className={
                            activeItem === "encode-records"
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "cursor-pointer"
                          }>
                          <IconChartBar />
                          <span>Encode Records</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => handleNavigation("my-quarter-package")}
                          className={
                            activeItem === "my-quarter-package"
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "cursor-pointer"
                          }>
                          <IconPackage />
                          <span>My Quarter Package</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </>
                  ) : (
                    <>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => handleNavigation("teacher-loads")}
                          className={
                            activeItem === "teacher-loads"
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "cursor-pointer"
                          }>
                          <IconBriefcase />
                          <span>Teacher Loads</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => handleNavigation("monitor-records")}
                          className={
                            activeItem === "monitor-records"
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "cursor-pointer"
                          }>
                          <IconChartBar />
                          <span>Monitor Records</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      {/* <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => handleNavigation("attendance-overview")}
                          className={
                            activeItem === "attendance-overview"
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "cursor-pointer"
                          }>
                          <IconCalendar />
                          <span>Attendance Overview (SKIP)</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem> */}
                    </>
                  )}
                </SidebarMenu>
              </SidebarGroup>
            </>
          )}

          {/* Adviser Panel - Only visible for adviser teachers */}
          {role === "TEACHER" && isAdviser && (
            <SidebarGroup>
              <SidebarGroupLabel>Adviser</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => {
                      console.log("🔄 AppSidebar - Validate Records clicked");
                      handleNavigation("validate-records");
                    }}
                    className={
                      activeItem === "validate-records"
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "cursor-pointer"
                    }>
                    <IconFileDescription />
                    <span>Validate Records</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => handleNavigation("advisory-class-list")}
                    className={
                      activeItem === "advisory-class-list"
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "cursor-pointer"
                    }>
                    <IconListDetails />
                    <span>Advisory Class List</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                      <SidebarMenuButton
                          onClick={() => handleNavigation("student-feedback-responses")}
                          className={
                            activeItem === "student-feedback-responses"
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "cursor-pointer"
                          }>
                          <IconBell />
                          <span>Student Feedback Responses</span>
                      </SidebarMenuButton>
                   </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
          )}

          {/* Reports and Settings - Only for non-students */}
          {role !== "STUDENT" && (
            <SidebarGroup>
              <SidebarGroupLabel>Reports and Settings</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => handleNavigation("reports")}
                    className={
                      activeItem === "reports"
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "cursor-pointer"
                    }>
                    <IconReport />
                    <span>Reports</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => handleNavigation("settings")}
                    className={
                      activeItem === "settings"
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "cursor-pointer"
                    }>
                    <IconSettings />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )}
        </SidebarContent>
      </Sidebar>
    </>
  );
}
