"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, Users, TrendingUp, MessageSquare, UserCheck, Calendar, AlertTriangle, Phone } from "lucide-react";
import { teacherAdviserReportsService } from "@/services/teacher-adviser-reports.service";
import { useAuth } from "@/contexts/auth.context";
import { useSettings } from "@/contexts/settings.context";

export function TeacherAdviserReportsComponent() {
  const [activeTab, setActiveTab] = useState("teacher-grade-summary");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [availableSections, setAvailableSections] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { user, profile } = useAuth();
  const { activeQuarter, schoolYear } = useSettings();

  const isAdviser = profile?.isAdviser || false;

  // Define report tabs based on role
  const reportTabs = [
    // Teacher Reports
    {
      id: "teacher-grade-summary",
      label: "Grade Summary",
      icon: TrendingUp,
      description: "Summary of grades for all subjects in your classes",
      component: "TeacherGradeSummary",
      role: "TEACHER",
    },
    {
      id: "teacher-attendance-summary",
      label: "Attendance Summary",
      icon: Users,
      description: "Attendance overview for your classes",
      component: "TeacherAttendanceSummary",
      role: "TEACHER",
    },
    {
      id: "teacher-student-report",
      label: "Student Report",
      icon: UserCheck,
      description: "Detailed report for individual students",
      component: "TeacherStudentReport",
      role: "TEACHER",
    },
    // Adviser Reports (only for advisers)
    ...(isAdviser ? [
      {
        id: "adviser-class-general",
        label: "Class General",
        icon: FileText,
        description: "General overview of your advisory class",
        component: "AdviserClassGeneral",
        role: "ADVISER",
      },
      {
        id: "adviser-consolidated-attendance",
        label: "Consolidated Attendance",
        icon: Calendar,
        description: "Consolidated attendance report for advisory class",
        component: "AdviserConsolidatedAttendance",
        role: "ADVISER",
      },
      {
        id: "adviser-behavior-conduct",
        label: "Behavior & Conduct",
        icon: AlertTriangle,
        description: "Behavior and conduct reports",
        component: "AdviserBehaviorConduct",
        role: "ADVISER",
      },
      {
        id: "adviser-parent-communication",
        label: "Parent Communication",
        icon: Phone,
        description: "Parent communication records",
        component: "AdviserParentCommunication",
        role: "ADVISER",
      },
    ] : []),
  ];

  // Filter tabs based on role
  const filteredTabs = reportTabs.filter(tab =>
    tab.role === "TEACHER" || (tab.role === "ADVISER" && isAdviser)
  );

  useEffect(() => {
    loadAvailableYears();
    loadAvailableSections();
  }, []);

  useEffect(() => {
    if (selectedYear && selectedSection) {
      loadReportData();
    }
  }, [selectedYear, selectedSection, activeTab]);

  const loadAvailableYears = async () => {
    try {
      const years = await teacherAdviserReportsService.getAvailableYears();
      setAvailableYears(years);
      if (years.length > 0 && !selectedYear) {
        setSelectedYear(years[0]);
      }
    } catch (error) {
      console.error("Failed to load available years:", error);
    }
  };

  const loadAvailableSections = async () => {
    try {
      let sections;
      if (isAdviser) {
        sections = await teacherAdviserReportsService.getAdviserSections();
      } else {
        sections = await teacherAdviserReportsService.getAvailableSections();
      }
      setAvailableSections(sections);
      if (sections.length > 0 && !selectedSection) {
        setSelectedSection(sections[0].id.toString());
      }
    } catch (error) {
      console.error("Failed to load available sections:", error);
    }
  };

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      let data;
      switch (activeTab) {
        case "teacher-grade-summary":
          data = await teacherAdviserReportsService.getTeacherGradeSummary(selectedYear, selectedSection);
          break;
        case "teacher-attendance-summary":
          data = await teacherAdviserReportsService.getTeacherAttendanceSummary(selectedYear, selectedSection);
          break;
        case "teacher-student-report":
          data = await teacherAdviserReportsService.getTeacherStudentReport(selectedYear, selectedSection);
          break;
        case "adviser-class-general":
          data = await teacherAdviserReportsService.getAdviserClassGeneral(selectedYear, selectedSection);
          break;
        case "adviser-consolidated-attendance":
          data = await teacherAdviserReportsService.getAdviserConsolidatedAttendance(selectedYear, selectedSection);
          break;
        case "adviser-behavior-conduct":
          data = await teacherAdviserReportsService.getAdviserBehaviorConduct(selectedYear, selectedSection);
          break;
        case "adviser-parent-communication":
          data = await teacherAdviserReportsService.getAdviserParentCommunication(selectedYear, selectedSection);
          break;
        default:
          data = null;
      }
      setReportData(data);
    } catch (error) {
      console.error("Failed to load report data:", error);
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      await teacherAdviserReportsService.exportReport(activeTab, selectedYear, selectedSection, format);
    } catch (error) {
      console.error("Failed to export report:", error);
    }
  };

  const renderReportContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading report data...</div>
        </div>
      );
    }

    if (!reportData) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No data available. Please select a year and section to view reports.
        </div>
      );
    }

    switch (activeTab) {
      case "teacher-grade-summary":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.averageGrade || "N/A"}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.totalStudents || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Passing Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.passingRate || "N/A"}%</div>
                </CardContent>
              </Card>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Average Grade</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.subjects?.map((subject: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{subject.name}</TableCell>
                    <TableCell>{subject.averageGrade}</TableCell>
                    <TableCell>{subject.studentCount}</TableCell>
                    <TableCell>
                      <Badge variant={subject.status === 'Good' ? 'default' : 'secondary'}>
                        {subject.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      case "teacher-attendance-summary":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Days</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.totalDays || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Present</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{reportData.presentDays || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Absent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{reportData.absentDays || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.attendanceRate || "N/A"}%</div>
                </CardContent>
              </Card>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead>Absent</TableHead>
                  <TableHead>Late</TableHead>
                  <TableHead>Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.students?.map((student: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.present}</TableCell>
                    <TableCell>{student.absent}</TableCell>
                    <TableCell>{student.late}</TableCell>
                    <TableCell>
                      <Badge variant={student.rate >= 85 ? 'default' : 'destructive'}>
                        {student.rate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      case "adviser-class-general":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.totalStudents || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Male</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.maleStudents || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Female</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.femaleStudents || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.averageGrade || "N/A"}</div>
                </CardContent>
              </Card>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Grade Average</TableHead>
                  <TableHead>Attendance Rate</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.students?.map((student: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.gender}</TableCell>
                    <TableCell>{student.gradeAverage}</TableCell>
                    <TableCell>{student.attendanceRate}%</TableCell>
                    <TableCell>
                      <Badge variant={student.status === 'Good' ? 'default' : 'secondary'}>
                        {student.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            Report content for {activeTab} is under development.
          </div>
        );
    }
  };

  return (
    <>
      <div className="h-6" />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="bg-card text-card-foreground rounded-xl border shadow-sm">
          <div className="p-6">
            <div className="space-y-1.5">
              <h2 className="text-2xl font-semibold leading-none tracking-tight">
                {isAdviser ? "Teacher Adviser Reports" : "Teacher Reports"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Generate comprehensive reports for your classes and advisory responsibilities
              </p>
            </div>
          </div>

          <div className="p-6 pt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="flex w-full rounded-none border-b overflow-x-auto">
                {filteredTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex items-center gap-2 data-[state=active]:bg-background"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {filteredTabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="p-6">
                  {renderReportContent()}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}
