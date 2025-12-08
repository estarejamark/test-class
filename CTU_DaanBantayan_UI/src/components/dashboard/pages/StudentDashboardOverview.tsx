"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardLoading } from "@/components/utils";
import {
  IconCalendar,
  IconMessage,
  IconAlertTriangle,
  IconUser,
} from "@tabler/icons-react";
import { useAuth } from "@/contexts/auth.context";
import { NavigationItem } from "@/components/dashboard/app-sidebar";
import { dashboardService } from "@/services/dashboard.service";

// Types for student dashboard stats
interface StudentStats {
  attendanceSummary: {
    currentQuarter: string;
    presentDays: number;
    totalDays: number;
    attendanceRate: number;
  };
  pendingFeedbackReplies: number;
  correctionRequestsStatus: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

interface StudentProfile {
  firstName: string;
  lastName: string;
  gradeLevel: string;
  sectionName: string;
  adviserName: string;
  profileImage?: string;
}

interface StudentDashboardOverviewProps {
  onNavigate?: (item: NavigationItem) => void;
}

export function StudentDashboardOverview({ onNavigate }: StudentDashboardOverviewProps) {
  const { user, profile: authProfile } = useAuth();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setIsLoading(true);

        if (!user?.id) {
          console.error("No user ID available");
          return;
        }

        // Fetch student dashboard data using the new service
        const studentData = await dashboardService.getStudentDashboardData(user.id);

        const studentStats: StudentStats = {
          attendanceSummary: studentData.attendanceSummary,
          pendingFeedbackReplies: studentData.pendingFeedbackReplies,
          correctionRequestsStatus: studentData.correctionRequestsStatus,
        };

        const studentProfile: StudentProfile = studentData.profile;

        setStats(studentStats);
        setProfile(studentProfile);
      } catch (error) {
        console.error("Error fetching student data:", error);
        // Fallback to mock data if API fails
        const mockStats: StudentStats = {
          attendanceSummary: {
            currentQuarter: "Q1",
            presentDays: 45,
            totalDays: 50,
            attendanceRate: 90,
          },
          pendingFeedbackReplies: 2,
          correctionRequestsStatus: {
            pending: 1,
            approved: 3,
            rejected: 0,
          },
        };

        const mockProfile: StudentProfile = {
          firstName: authProfile?.firstName || "Student",
          lastName: authProfile?.lastName || "Name",
          gradeLevel: authProfile?.gradeLevel || "Grade 7",
          sectionName: "7-A",
          adviserName: "Dr. Maria Santos",
        };

        setStats(mockStats);
        setProfile(mockProfile);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [user, authProfile]);

  if (isLoading) {
    return <DashboardLoading text="Loading student dashboard..." />;
  }

  if (!stats || !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Unable to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-4">
      <div className="flex flex-col gap-6 py-4 md:py-6 max-w-6xl mx-auto px-4">
        {/* Profile Header */}
        <Card className="w-full">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.profileImage} alt="Profile" />
                <AvatarFallback className="text-lg">
                  {profile.firstName[0]}
                  {profile.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">
                  {profile.firstName} {profile.lastName}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{profile.gradeLevel}</Badge>
                  <Badge variant="outline">{profile.sectionName}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Adviser: {profile.adviserName}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Cards */}
        <div className="grid gap-4 md:grid-cols-10 lg:grid-cols-3">
          {/* Attendance Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Attendance Summary
              </CardTitle>
              <IconCalendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.attendanceSummary.attendanceRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.attendanceSummary.presentDays} of{" "}
                {stats.attendanceSummary.totalDays} days ({stats.attendanceSummary.currentQuarter})
              </p>
            </CardContent>
          </Card>

          {/* Pending Feedback Replies */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Feedback Replies
              </CardTitle>
              <IconMessage className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.pendingFeedbackReplies}
              </div>
              <p className="text-xs text-muted-foreground">
                Responses needed
              </p>
            </CardContent>
          </Card>

          {/* Correction Requests Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Correction Requests
              </CardTitle>
              <IconAlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.correctionRequestsStatus.pending}
              </div>
              <p className="text-xs text-muted-foreground">
                Pending requests
              </p>
              <div className="flex gap-1 mt-2">
                <Badge variant="secondary" className="text-xs">
                  ✓ {stats.correctionRequestsStatus.approved}
                </Badge>
                <Badge variant="destructive" className="text-xs">
                  ✗ {stats.correctionRequestsStatus.rejected}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Primary Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              <button
                onClick={() => onNavigate?.("view-records")}
                className="flex items-center gap-2 p-3 text-left border rounded-lg hover:bg-accent transition-colors"
              >
                <IconUser className="h-5 w-5" />
                <div>
                  <div className="font-medium">View Records</div>
                  <div className="text-sm text-muted-foreground">
                    Check attendance and grades
                  </div>
                </div>
              </button>
              <button
                onClick={() => onNavigate?.("notifications")}
                className="flex items-center gap-2 p-3 text-left border rounded-lg hover:bg-accent transition-colors"
              >
                <IconMessage className="h-5 w-5" />
                <div>
                  <div className="font-medium">Notifications</div>
                  <div className="text-sm text-muted-foreground">
                    View updates and alerts
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
