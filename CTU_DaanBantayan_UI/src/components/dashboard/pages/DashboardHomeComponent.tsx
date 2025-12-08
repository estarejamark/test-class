import { SectionCards } from "@/components/dashboard/section-cards";
import { OverviewCards } from "@/components/dashboard/OverviewCards";
import { StudentDashboardOverview } from "@/components/dashboard/pages/StudentDashboardOverview";
import { TeacherDashboardOverview } from "@/components/dashboard/pages/TeacherDashboardOverview";
import { AdviserDashboardOverview } from "@/components/dashboard/pages/AdviserDashboardOverview";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DashboardLoading } from "@/components/utils";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts";
import {
  IconBook,
  IconUsers,
  IconChalkboard,
  IconTrendingUp,
} from "@tabler/icons-react";
import React, { useEffect, useState } from "react";
import { dashboardService } from "@/services/dashboard.service";
import {
  DashboardStats,
  SubjectsByGradeData,
  StudentsPerSectionData,
  TeacherLoadStatusData,
  AdviserSummary,
  Role,
} from "@/types/api";
import { useAuth } from "@/contexts/auth.context";

// DashboardHomeProps removed (not used)

// Dashboard data interfaces
interface DashboardData {
  stats: DashboardStats;
  subjectsOverview: Array<{
    id: string;
    subject: string;
    grade: string;
    teacher: AdviserSummary;
    sections: number;
    students: number;
  }>;
  teacherLoadsOverview: Array<{
    id: string;
    teacher: AdviserSummary;
    subject: string;
    section: string;
    schedule: string;
    status: string;
  }>;
  sectionsOverview: Array<{
    id: string;
    section: string;
    grade: string;
    adviser: AdviserSummary;
    students: number;
    status: string;
  }>;
  subjectsByGrade: SubjectsByGradeData[];
  studentsPerSection: StudentsPerSectionData[];
  teacherLoadStatus: TeacherLoadStatusData[];
}



// Chart configurations
const pieChartConfig: ChartConfig = {
  students: {
    label: "Students",
  },
};

const barChartConfig: ChartConfig = {
  subjects: {
    label: "Subjects",
  },
};

const lineChartConfig: ChartConfig = {
  assigned: {
    label: "Assigned",
  },
  pending: {
    label: "Pending",
  },
};
export function DashboardHomeComponent() {
  const { user, profile } = useAuth();
  const role = user?.role;
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charts are configured inline where used; duplicated local constants removed.

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log("🔄 Loading dashboard data...");

        const apiData = await dashboardService.getAllDashboardData(role, profile || undefined);

        setDashboardData(apiData);
        console.log("✅ Dashboard data loaded successfully");
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [role, profile]);

  // Show loading state
  if (isLoading) {
    return <DashboardLoading text="Loading dashboard data..." />;
  }

  // Helper to safely render a person value which may be a string or an object
  const formatPerson = (person: unknown) => {
    if (!person) return "";
    if (typeof person === "string") return person;
    if (typeof person === "object") {
      const p = person as Record<string, unknown>;
      // prefer firstName + lastName, then name/fullName, then email/userEntity
      const firstName = (p["firstName"] as string) || "";
      const lastName = (p["lastName"] as string) || "";
      const fullName = `${firstName} ${lastName}`.trim();
      if (fullName) return fullName;
      const name = p["name"] as string | undefined;
      if (name) return name;
      const full = p["fullName"] as string | undefined;
      if (full) return full;
      const userEntity = p["userEntity"] as Record<string, unknown> | undefined;
      if (userEntity) {
        const ueEmail = userEntity["email"] as string | undefined;
        if (ueEmail) return ueEmail;
      }
      const email = p["email"] as string | undefined;
      if (email) return email;
      return "Unknown";
    }
    return String(person);
  };

  // Role-based rendering
  if (role === Role.STUDENT) {
    return <StudentDashboardOverview />;
  }

  if (role === Role.TEACHER) {
    return <TeacherDashboardOverview />;
  }

  if (role === Role.ADVISER) {
    return <AdviserDashboardOverview />;
  }

  // For ADMIN role, show the full dashboard
  // Always show dashboard with data (API or dummy)
  if (!dashboardData) return null;

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards isLoading={isLoading} stats={dashboardData.stats} />

        {/* Overview Tables Section */}
        <div className="px-4 lg:px-6 space-y-6">
          {/* Subjects Overview */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBook className="h-5 w-5" />
                Overview of Subjects
              </CardTitle>
              <CardDescription>
                Current subject assignments and coverage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Sections</TableHead>
                      <TableHead>Students</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData.subjectsOverview.map((subject) => (
                      <TableRow key={subject.id}>
                        <TableCell className="font-medium">
                          {subject.subject}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{subject.grade}</Badge>
                        </TableCell>
                        <TableCell>{formatPerson(subject.teacher)}</TableCell>
                        <TableCell>{subject.sections}</TableCell>
                        <TableCell>{subject.students}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Teacher Loads Overview */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconChalkboard className="h-5 w-5" />
                Overview of Teacher Loads
              </CardTitle>
              <CardDescription>
                Current teacher assignments and schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData.teacherLoadsOverview.map((load) => (
                      <TableRow key={load.id}>
                        <TableCell className="font-medium">
                          {formatPerson(load.teacher)}
                        </TableCell>
                        <TableCell>{load.subject}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{load.section}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {load.schedule}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              load.status === "Assigned"
                                ? "default"
                                : "secondary"
                            }>
                            {load.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Sections Overview */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconUsers className="h-5 w-5" />
                Overview of Sections
              </CardTitle>
              <CardDescription>
                Section details and student distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Section</TableHead>
                      <TableHead>Adviser</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData.sectionsOverview.map((section) => (
                      <TableRow key={section.id}>
                        <TableCell className="font-medium">
                          <Badge variant="outline">{section.section}</Badge>
                        </TableCell>
                        <TableCell>{formatPerson(section.adviser)}</TableCell>
                        <TableCell>{section.students}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              section.status === "ACTIVE"
                                ? "default"
                                : "secondary"
                            }>
                            {section.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile/Tablet Message for Charts */}
        <div className="lg:hidden px-4 lg:px-6">
          <Card className="w-full">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <IconTrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Charts Available on Desktop Only
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                For the best viewing experience, charts and analytics are only
                available on desktop computers.
              </p>
              <p className="text-xs text-muted-foreground">
                Please use a desktop or laptop computer to view detailed charts
                and graphs.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section - Desktop Only */}
        <div className="hidden lg:block px-4 lg:px-6 space-y-6">
          {/* Charts Grid - Desktop: Side by Side */}
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {/* Pie Chart - Students per Section */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconTrendingUp className="h-5 w-5" />
                  Students per Section
                </CardTitle>
                <CardDescription>
                  Distribution of students across sections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={pieChartConfig}
                  className="h-[300px] sm:h-[400px] w-full">
                  <PieChart width={400} height={300}>
                    <defs>
                      <linearGradient
                        id="blueGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#1d4ed8" />
                      </linearGradient>
                      <linearGradient
                        id="greenGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                      <linearGradient
                        id="purpleGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                      <linearGradient
                        id="orangeGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#d97706" />
                      </linearGradient>
                      <linearGradient
                        id="redGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#dc2626" />
                      </linearGradient>
                    </defs>
                    <Pie
                      data={dashboardData.studentsPerSection}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius="80%"
                      fill="#8884d8"
                      dataKey="value">
                      {dashboardData.studentsPerSection.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Bar Chart - Subjects per Grade Level */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconBook className="h-5 w-5" />
                  Subjects per Grade Level
                </CardTitle>
                <CardDescription>
                  Number of subjects taught per grade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={barChartConfig}
                  className="h-[300px] sm:h-[400px] w-full">
                  <BarChart
                    data={dashboardData.subjectsByGrade}
                    width={400}
                    height={300}>
                    <defs>
                      <linearGradient
                        id="barGradient"
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#1d4ed8" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="grade" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="subjects" fill="url(#barGradient)" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Line Chart - Teacher Load Status */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconChalkboard className="h-5 w-5" />
                Teacher Load Status (Assigned vs Pending)
              </CardTitle>
              <CardDescription>
                Assigned vs Pending teacher loads over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={lineChartConfig}
                className="h-[300px] sm:h-[400px] w-full">
                <LineChart
                  data={dashboardData.teacherLoadStatus}
                  width={800}
                  height={300}>
                  <defs>
                    <linearGradient
                      id="assignedGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient
                      id="pendingGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#dc2626" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="assigned"
                    stroke="url(#assignedGradient)"
                    strokeWidth={3}
                    name="Assigned"
                  />
                  <Line
                    type="monotone"
                    dataKey="pending"
                    stroke="url(#pendingGradient)"
                    strokeWidth={3}
                    name="Pending"
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
