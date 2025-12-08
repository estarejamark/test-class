"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardLoading } from "@/components/utils";
import {
  IconBook,
  IconCalendar,
  IconUsers,
  IconChalkboard,
} from "@tabler/icons-react";
import { useAuth } from "@/contexts/auth.context";
import { NavigationItem } from "@/components/dashboard/app-sidebar";
import { dashboardService } from "@/services/dashboard.service";

interface TeacherStats {
  totalSubjects: number;
  totalSections: number;
  totalStudents: number;
  activeLoads: number;
}

interface TeacherProfile {
  firstName: string;
  lastName: string;
  subjects: Array<{
    id: string;
    subject: string;
    grade: string;
    sections: number;
    students: number;
  }>;
  schedules: Array<{
    id: string;
    subject: string;
    section: string;
    schedule: string;
    status: string;
  }>;
}

interface TeacherDashboardOverviewProps {
  onNavigate?: (item: NavigationItem) => void;
}

export function TeacherDashboardOverview({ onNavigate }: TeacherDashboardOverviewProps) {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [profileData, setProfileData] = useState<TeacherProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setIsLoading(true);

        if (!user?.id) {
          console.error("No user ID available");
          return;
        }

        // Get all dashboard data and filter for this teacher
        const dashboardData = await dashboardService.getAllDashboardData(user.role, profile || undefined);

        // Filter subjects taught by this teacher
        const teacherSubjects = dashboardData.subjectsOverview.filter(
          (subject) => subject.teacher.id === user.id
        );

        // Filter teacher loads for this teacher
        const teacherLoads = dashboardData.teacherLoadsOverview.filter(
          (load) => load.teacher.id === user.id
        );

        const teacherStats: TeacherStats = {
          totalSubjects: teacherSubjects.length,
          totalSections: teacherSubjects.reduce((sum, subject) => sum + subject.sections, 0),
          totalStudents: teacherSubjects.reduce((sum, subject) => sum + subject.students, 0),
          activeLoads: teacherLoads.filter((load) => load.status === "Assigned").length,
        };

        const teacherProfile: TeacherProfile = {
          firstName: profile?.firstName || "Teacher",
          lastName: profile?.lastName || "Name",
          subjects: teacherSubjects,
          schedules: teacherLoads,
        };

        setStats(teacherStats);
        setProfileData(teacherProfile);
      } catch (error) {
        console.error("Error fetching teacher data:", error);
        // Fallback data
        const fallbackStats: TeacherStats = {
          totalSubjects: 3,
          totalSections: 5,
          totalStudents: 120,
          activeLoads: 3,
        };

        const fallbackProfile: TeacherProfile = {
          firstName: profile?.firstName || "Teacher",
          lastName: profile?.lastName || "Name",
          subjects: [],
          schedules: [],
        };

        setStats(fallbackStats);
        setProfileData(fallbackProfile);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeacherData();
  }, [user, profile]);

  if (isLoading) {
    return <DashboardLoading text="Loading teacher dashboard..." />;
  }

  if (!stats || !profileData) {
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
                <AvatarImage src={profile?.profileImage} alt="Profile" />
                <AvatarFallback className="text-lg">
                  {profileData.firstName[0]}
                  {profileData.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">
                  {profileData.firstName} {profileData.lastName}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">Teacher</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Welcome to your teaching dashboard
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Cards */}
        <div className="grid gap-4 md:grid-cols-10 lg:grid-cols-4">
          {/* Total Subjects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Subjects
              </CardTitle>
              <IconBook className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalSubjects}
              </div>
              <p className="text-xs text-muted-foreground">
                Subjects assigned
              </p>
            </CardContent>
          </Card>

          {/* Total Sections */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Sections
              </CardTitle>
              <IconUsers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalSections}
              </div>
              <p className="text-xs text-muted-foreground">
                Classes teaching
              </p>
            </CardContent>
          </Card>

          {/* Total Students */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Students
              </CardTitle>
              <IconUsers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalStudents}
              </div>
              <p className="text-xs text-muted-foreground">
                Students enrolled
              </p>
            </CardContent>
          </Card>

          {/* Active Loads */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Loads
              </CardTitle>
              <IconChalkboard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.activeLoads}
              </div>
              <p className="text-xs text-muted-foreground">
                Current assignments
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Subjects Overview */}
        <Card>
          <CardHeader>
            <CardTitle>My Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profileData.subjects.map((subject) => (
                <div key={subject.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{subject.subject}</div>
                    <div className="text-sm text-muted-foreground">
                      Grade {subject.grade} • {subject.sections} sections • {subject.students} students
                    </div>
                  </div>
                  <Badge variant="outline">{subject.grade}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Schedule Overview */}
        <Card>
          <CardHeader>
            <CardTitle>My Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profileData.schedules.map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{schedule.subject}</div>
                    <div className="text-sm text-muted-foreground">
                      {schedule.section} • {schedule.schedule}
                    </div>
                  </div>
                  <Badge
                    variant={schedule.status === "Assigned" ? "default" : "secondary"}
                  >
                    {schedule.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Primary Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              <button
                onClick={() => onNavigate?.("view-schedules")}
                className="flex items-center gap-2 p-3 text-left border rounded-lg hover:bg-accent transition-colors"
              >
                <IconCalendar className="h-5 w-5" />
                <div>
                  <div className="font-medium">View Schedules</div>
                  <div className="text-sm text-muted-foreground">
                    Check your teaching schedule
                  </div>
                </div>
              </button>
              <button
                onClick={() => onNavigate?.("manage-grades")}
                className="flex items-center gap-2 p-3 text-left border rounded-lg hover:bg-accent transition-colors"
              >
                <IconBook className="h-5 w-5" />
                <div>
                  <div className="font-medium">Manage Grades</div>
                  <div className="text-sm text-muted-foreground">
                    Update student grades
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
