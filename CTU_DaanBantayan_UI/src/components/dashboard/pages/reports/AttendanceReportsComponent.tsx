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
import { Download, Calendar, Users, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { reportsService } from "@/services/reports.service";
import {
  AttendanceReportResponse,
  DailyAttendanceResponse,
  Quarter,
} from "@/types/api";

export function AttendanceReportsComponent() {
  const [attendanceData, setAttendanceData] = useState<AttendanceReportResponse[]>([]);
  const [dailyAttendanceData, setDailyAttendanceData] = useState<DailyAttendanceResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | undefined>();
  const [selectedQuarter, setSelectedQuarter] = useState<string | undefined>();
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableQuarters] = useState<Quarter[]>([
    Quarter.Q1,
    Quarter.Q2,
    Quarter.Q3,
    Quarter.Q4,
  ]);

  useEffect(() => {
    loadAvailableYears();
  }, []);

  useEffect(() => {
    if (selectedSection) {
      loadAttendanceData();
      loadDailyAttendanceData();
    }
  }, [selectedYear, selectedQuarter, selectedSection]);

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

  const loadAttendanceData = async () => {
    if (!selectedSection) return;

    setLoading(true);
    try {
      const data = await reportsService.getAttendanceReport(
        selectedYear,
        selectedQuarter === "all" ? undefined : selectedQuarter,
        selectedSection
      );
      setAttendanceData(data);
    } catch (error) {
      console.error("Failed to load attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyAttendanceData = async () => {
    if (!selectedSection) return;

    try {
      const data = await reportsService.getDailyAttendanceReport(
        selectedYear,
        selectedQuarter === "all" ? undefined : selectedQuarter,
        selectedSection
      );
      setDailyAttendanceData(data);
    } catch (error) {
      console.error("Failed to load daily attendance data:", error);
    }
  };

  const exportToCSV = () => {
    if (attendanceData.length === 0) return;

    const headers = [
      "Student Name",
      "Present Days",
      "Absent Days",
      "Late Days",
      "Total Days",
      "Attendance Rate (%)",
    ];
    const csvContent = [
      headers.join(","),
      ...attendanceData.map((item) =>
        [
          `"${item.studentName}"`,
          item.presentCount,
          item.absentCount,
          item.lateCount,
          item.totalDays,
          item.attendanceRate.toFixed(2),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-report-${selectedYear || "all"}-${selectedQuarter || "all"}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getAttendanceStats = () => {
    if (attendanceData.length === 0) return { totalStudents: 0, avgAttendance: 0 };

    const totalStudents = attendanceData.length;
    const avgAttendance =
      attendanceData.reduce((sum, item) => sum + item.attendanceRate, 0) /
      totalStudents;

    return { totalStudents, avgAttendance };
  };

  const getAttendanceRateDistribution = () => {
    const ranges = [
      { name: "90-100%", min: 90, max: 100, color: "#00C49F" },
      { name: "80-89%", min: 80, max: 89, color: "#0088FE" },
      { name: "70-79%", min: 70, max: 79, color: "#FFBB28" },
      { name: "60-69%", min: 60, max: 69, color: "#FF8042" },
      { name: "0-59%", min: 0, max: 59, color: "#FF4444" },
    ];

    return ranges.map((range) => ({
      name: range.name,
      value: attendanceData.filter(
        (item) =>
          item.attendanceRate >= range.min && item.attendanceRate <= range.max
      ).length,
      fill: range.color,
    }));
  };

  const stats = getAttendanceStats();

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Attendance Reports
          </CardTitle>
          <CardDescription>
            Monitor student attendance patterns and rates
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

            <div className="min-w-[120px]">
              <label className="text-sm font-medium mb-1 block">Quarter</label>
              <Select
                value={selectedQuarter}
                onValueChange={(value) => setSelectedQuarter(value as Quarter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All quarters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All quarters</SelectItem>
                  {availableQuarters.map((quarter) => (
                    <SelectItem key={quarter} value={quarter}>
                      {quarter}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[200px]">
              <label className="text-sm font-medium mb-1 block">Section</label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {/* TODO: Load sections from API */}
                  <SelectItem value="section-1">Grade 7 - Section A</SelectItem>
                  <SelectItem value="section-2">Grade 8 - Section B</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={exportToCSV}
                disabled={attendanceData.length === 0}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgAttendance.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Attendance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attendanceData.filter((item) => item.attendanceRate >= 90).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Students with ≥90% attendance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Attendance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Attendance Trend</CardTitle>
            <CardDescription>
              Attendance patterns over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyAttendanceData.slice(-14)}> {/* Last 14 days */}
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Bar dataKey="presentCount" fill="#00C49F" name="Present" />
                <Bar dataKey="absentCount" fill="#FF8042" name="Absent" />
                <Bar dataKey="lateCount" fill="#FFBB28" name="Late" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attendance Rate Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Rate Distribution</CardTitle>
            <CardDescription>
              Distribution of attendance rates across students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getAttendanceRateDistribution()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Attendance Details</CardTitle>
          <CardDescription>
            Individual student attendance records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : attendanceData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No attendance data available. Please select a section to view reports.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="text-right">Present</TableHead>
                  <TableHead className="text-right">Absent</TableHead>
                  <TableHead className="text-right">Late</TableHead>
                  <TableHead className="text-right">Total Days</TableHead>
                  <TableHead className="text-right">Attendance Rate</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {item.studentName}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {item.presentCount}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {item.absentCount}
                    </TableCell>
                    <TableCell className="text-right text-yellow-600">
                      {item.lateCount}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.totalDays}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          item.attendanceRate >= 90
                            ? "default"
                            : item.attendanceRate >= 80
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {item.attendanceRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          item.attendanceRate >= 85
                            ? "default"
                            : item.attendanceRate >= 75
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {item.attendanceRate >= 85
                          ? "Excellent"
                          : item.attendanceRate >= 75
                          ? "Good"
                          : "Needs Attention"}
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
