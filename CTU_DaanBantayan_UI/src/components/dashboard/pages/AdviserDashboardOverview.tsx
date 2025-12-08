"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardLoading } from "@/components/utils";
import {
  IconUsers,
  IconBook,
  IconCalendar,
  IconTrendingUp,
  IconMessage,
} from "@tabler/icons-react";
import { useAuth } from "@/contexts/auth.context";
import { NavigationItem } from "@/components/dashboard/app-sidebar";
import { dashboardService } from "@/services/dashboard.service";

interface AdviserStats {
  totalStudents: number;
  totalSubjects: number;
  sectionName: string;
  gradeLevel: string;
}

interface AdviserProfile {
  firstName: string;
  lastName: string;
  section: {
    id: string;
    name: string;
    gradeLevel: string;
    students: number;
  };
  students: Array<{
    id: string;
    firstName: string;
    lastName: string;
    attendanceRate: number;
  }>;
  subjects: Array<{
    id: string;
    subject: string;
    teacher: string;
  }>;
}

interface AdviserDashboardOverviewProps {
  onNavigate?: (item: NavigationItem) => void;
}

export function AdviserDashboardOverview({ onNavigate }: AdviserDashboardOverviewProps) {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<AdviserStats | null>(null);
  const [profileData, setProfileData] = useState<AdviserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdviserData = async () => {
      try {
        setIsLoading(true);

        if (!user?.id) {
          console.error("No user ID available");
          return;
        }

        // Get all dashboard data and filter for this adviser's section
        const dashboardData = await dashboardService.getAllDashboardData(user.role, profile || undefined);

        // Find sections where this user is the adviser
        const adviserSections = dashboardData.sectionsOverview.filter(
          (section) => section.adviser.id === user.id
        );

        if (adviserSections.length === 0) {
          console.error("No sections found for this adviser");
          return;
        }

        // Use the first section (assuming one adviser per section)
        const section = adviserSections[0];

        const adviserStats: AdviserStats = {
          totalStudents: section.students,
          totalSubjects: dashboardData.subjectsOverview.filter(
            (subject) => subject.grade === section.grade
          ).length,
          sectionName: section.section,
          gradeLevel: section.grade,
        };

        // Get students in this section (mock data for now)
        const students = Array.from({ length: section.students }, (_, i) => ({
          id: `student-${i + 1}`,
          firstName: `Student ${i + 1}`,
          lastName: `Last${i + 1}`,
          attendanceRate: Math.floor(Math.random() * 20) + 80, // 80-100%
        }));

        // Get subjects for this grade level
        const subjects = dashboardData.subjectsOverview
          .filter((subject) => subject.grade === section.grade)
          .map((subject) => ({
            id: subject.id,
            subject: subject.subject,
            teacher: subject.teacher.firstName + " " + subject.teacher.lastName,
          }));

        const adviserProfile: AdviserProfile = {
          firstName: profile?.firstName || "Adviser",
          lastName: profile?.lastName || "Name",
          section: {
            id: section.id,
            name: section.section,
            gradeLevel: section.grade,
            students: section.students,
          },
          students,
          subjects,
        };

        setStats(adviserStats);
        setProfileData(adviserProfile);
      } catch (error) {
        console.error("Error fetching adviser data:", error);
        // Fallback data
        const fallbackStats: AdviserStats = {
          totalStudents: 25,
          totalSubjects: 8,
          sectionName: "7-A",
          gradeLevel: "Grade 7",
        };

        const fallbackProfile: AdviserProfile = {
          firstName: profile?.firstName || "Adviser",
          lastName: profile?.lastName || "Name",
          section: {
            id: "section-1",
            name: "7-A",
            gradeLevel: "Grade 7",
            students: 25,
          },
          students: [],
          subjects: [],
        };

        setStats(fallbackStats);
        setProfileData(fallbackProfile);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdviserData();
  }, [user, profile]);

  if (isLoading) {
    return <DashboardLoading text="Loading adviser dashboard..." />;
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
                  <Badge variant="outline">Class Adviser</Badge>
                  <Badge variant="secondary">{stats.sectionName}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.gradeLevel} • {stats.totalStudents} students
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Cards */}
        <div className="grid gap-4 md:grid-cols-10 lg:grid-cols-4">
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
                In {stats.sectionName}
              </p>
            </CardContent>
          </Card>

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
                {stats.gradeLevel}
              </p>
            </CardContent>
          </Card>

          {/* Average Attendance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Attendance
              </CardTitle>
              <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(profileData.students.reduce((sum, s) => sum + s.attendanceRate, 0) / profileData.students.length)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Current quarter
              </p>
            </CardContent>
          </Card>

          {/* Pending Feedback */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Feedback
              </CardTitle>
              <IconMessage className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.floor(Math.random() * 5)} {/* Mock data */}
              </div>
              <p className="text-xs text-muted-foreground">
                Needs review
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Students Overview */}
        <Card>
          <CardHeader>
            <CardTitle>My Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profileData.students.slice(0, 10).map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      {student.firstName} {student.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Attendance: {student.attendanceRate}%
                    </div>
                  </div>
                  <Badge
                    variant={student.attendanceRate >= 90 ? "default" : student.attendanceRate >= 80 ? "secondary" : "destructive"}
                  >
                    {student.attendanceRate >= 90 ? "Excellent" : student.attendanceRate >= 80 ? "Good" : "Needs Attention"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Subjects Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profileData.subjects.map((subject) => (
                <div key={subject.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{subject.subject}</div>
                    <div className="text-sm text-muted-foreground">
                      Teacher: {subject.teacher}
                    </div>
                  </div>
                  <Badge variant="outline">Active</Badge>
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
                onClick={() => onNavigate?.("manage-students")}
                className="flex items-center gap-2 p-3 text-left border rounded-lg hover:bg-accent transition-colors"
              >
                <IconUsers className="h-5 w-5" />
                <div>
                  <div className="font-medium">Manage Students</div>
                  <div className="text-sm text-muted-foreground">
                    View and update student records
                  </div>
                </div>
              </button>
              <button
                onClick={() => onNavigate?.("view-reports")}
                className="flex items-center gap-2 p-3 text-left border rounded-lg hover:bg-accent transition-colors"
              >
                <IconTrendingUp className="h-5 w-5" />
                <div>
                  <div className="font-medium">View Reports</div>
                  <div className="text-sm text-muted-foreground">
                    Class performance and attendance
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
