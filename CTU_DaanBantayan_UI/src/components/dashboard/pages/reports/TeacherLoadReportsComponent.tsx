import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Users, BookOpen, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { reportsService } from "@/services/reports.service";
import { TeacherLoadReportResponse } from "@/types/api";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export function TeacherLoadReportsComponent() {
  const [teacherLoadData, setTeacherLoadData] = useState<TeacherLoadReportResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | undefined>();
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    loadAvailableYears();
  }, []);

  useEffect(() => {
    loadTeacherLoadData();
  }, [selectedYear, selectedTeacher]);

  const loadAvailableYears = async () => {
    try {
      const years = await reportsService.getAvailableYears();
      setAvailableYears(years);
      if (years.length > 0) {
        setSelectedYear(years[0]);
      }
    } catch (error) {
      console.error("Failed to load available years:", error);
    }
  };

  const loadTeacherLoadData = async () => {
    setLoading(true);
    try {
      const data = await reportsService.getTeacherLoadReport(
        selectedYear,
        selectedTeacher === "all" ? undefined : selectedTeacher
      );
      setTeacherLoadData(data);
    } catch (error) {
      console.error("Failed to load teacher load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (teacherLoadData.length === 0) return;

    const headers = [
      "Teacher Name",
      "Subject Count",
      "Subjects",
      "Sections",
    ];
    const csvContent = [
      headers.join(","),
      ...teacherLoadData.map((item) =>
        [
          `"${item.teacherName}"`,
          item.subjectCount,
          `"${item.subjects}"`,
          `"${item.sections}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `teacher-load-report-${selectedYear || "all"}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getLoadStats = () => {
    if (teacherLoadData.length === 0) return {
      totalTeachers: 0,
      avgSubjects: 0,
      maxSubjects: 0,
      minSubjects: 0
    };

    const totalTeachers = teacherLoadData.length;
    const totalSubjects = teacherLoadData.reduce((sum, item) => sum + item.subjectCount, 0);
    const avgSubjects = totalSubjects / totalTeachers;
    const subjectCounts = teacherLoadData.map(item => item.subjectCount);
    const maxSubjects = Math.max(...subjectCounts);
    const minSubjects = Math.min(...subjectCounts);

    return { totalTeachers, avgSubjects, maxSubjects, minSubjects };
  };

  const getLoadDistribution = () => {
    const ranges = [
      { name: "1-2 subjects", min: 1, max: 2, color: "#00C49F" },
      { name: "3-4 subjects", min: 3, max: 4, color: "#0088FE" },
      { name: "5-6 subjects", min: 5, max: 6, color: "#FFBB28" },
      { name: "7+ subjects", min: 7, max: 100, color: "#FF8042" },
    ];

    return ranges.map((range) => ({
      name: range.name,
      value: teacherLoadData.filter(
        (item) =>
          item.subjectCount >= range.min && item.subjectCount <= range.max
      ).length,
      fill: range.color,
    }));
  };

  const getTopLoadedTeachers = () => {
    return teacherLoadData
      .sort((a, b) => b.subjectCount - a.subjectCount)
      .slice(0, 5);
  };

  const stats = getLoadStats();
  const topLoadedTeachers = getTopLoadedTeachers();

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Teacher Load Reports
          </CardTitle>
          <CardDescription>
            Monitor teacher workload distribution and subject assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="min-w-[120px]">
              <label className="text-sm font-medium mb-1 block">Year</label>
              <Select
                value={selectedYear?.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[200px]">
              <label className="text-sm font-medium mb-1 block">Teacher</label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger>
                  <SelectValue placeholder="All teachers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All teachers</SelectItem>
                  {/* TODO: Load teachers from API */}
                  <SelectItem value="teacher-1">John Smith</SelectItem>
                  <SelectItem value="teacher-2">Jane Doe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={exportToCSV}
                disabled={teacherLoadData.length === 0}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeachers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgSubjects.toFixed(1)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Load</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.maxSubjects}</div>
            <p className="text-xs text-muted-foreground">
              subjects per teacher
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Min Load</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.minSubjects}</div>
            <p className="text-xs text-muted-foreground">
              subjects per teacher
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Load Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Workload Distribution</CardTitle>
            <CardDescription>
              Distribution of subject loads across teachers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getLoadDistribution()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getLoadDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Loaded Teachers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Loaded Teachers</CardTitle>
            <CardDescription>
              Teachers with highest subject loads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topLoadedTeachers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="teacherName"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="subjectCount" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Teacher Load Details</CardTitle>
          <CardDescription>
            Detailed breakdown of teacher workloads and assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : teacherLoadData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No teacher load data available.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher Name</TableHead>
                  <TableHead className="text-right">Subject Count</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Sections</TableHead>
                  <TableHead className="text-center">Load Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teacherLoadData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {item.teacherName}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          item.subjectCount >= 7
                            ? "destructive"
                            : item.subjectCount >= 5
                            ? "secondary"
                            : "default"
                        }
                      >
                        {item.subjectCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={item.subjects}>
                      {item.subjects}
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={item.sections}>
                      {item.sections}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          item.subjectCount >= 7
                            ? "destructive"
                            : item.subjectCount >= 5
                            ? "secondary"
                            : "default"
                        }
                      >
                        {item.subjectCount >= 7
                          ? "Overloaded"
                          : item.subjectCount >= 5
                          ? "Heavy Load"
                          : "Balanced"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
