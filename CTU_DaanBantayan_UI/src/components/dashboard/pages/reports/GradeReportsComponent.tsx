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
import { Download, TrendingUp, BookOpen, Users } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { reportsService } from "@/services/reports.service";
import {
  GradeSummaryResponse,
  GradeTrendResponse,
  Quarter,
} from "@/types/api";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export function GradeReportsComponent() {
  const [gradeSummary, setGradeSummary] = useState<GradeSummaryResponse[]>([]);
  const [gradeTrends, setGradeTrends] = useState<GradeTrendResponse[]>([]);
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
      loadGradeSummary();
      loadGradeTrends();
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

  const loadGradeSummary = async () => {
    if (!selectedSection) return;

    setLoading(true);
    try {
      const summary = await reportsService.getGradeSummary(
        selectedYear,
        selectedQuarter === "all" ? undefined : selectedQuarter,
        selectedSection
      );
      setGradeSummary(summary);
    } catch (error) {
      console.error("Failed to load grade summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadGradeTrends = async () => {
    if (!selectedSection) return;

    try {
      const trends = await reportsService.getGradeTrends(
        selectedYear,
        selectedSection
      );
      setGradeTrends(trends);
    } catch (error) {
      console.error("Failed to load grade trends:", error);
    }
  };

  const exportToCSV = () => {
    if (gradeSummary.length === 0) return;

    const headers = [
      "Subject",
      "Average Grade",
      "Passing Rate (%)",
      "Total Students",
      "Lowest Grade",
      "Highest Grade",
    ];
    const csvContent = [
      headers.join(","),
      ...gradeSummary.map((item) =>
        [
          item.subjectName,
          item.averageGrade.toFixed(2),
          item.passingRate.toFixed(2),
          item.totalStudents,
          item.lowestGrade.toFixed(2),
          item.highestGrade.toFixed(2),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grade-summary-${selectedYear || "all"}-${selectedQuarter || "all"}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getGradeDistributionData = () => {
    const ranges = [
      { name: "90-100", min: 90, max: 100, color: "#00C49F" },
      { name: "80-89", min: 80, max: 89, color: "#0088FE" },
      { name: "70-79", min: 70, max: 79, color: "#FFBB28" },
      { name: "60-69", min: 60, max: 69, color: "#FF8042" },
      { name: "0-59", min: 0, max: 59, color: "#FF4444" },
    ];

    return ranges.map((range) => ({
      name: range.name,
      value: gradeSummary.filter(
        (item) =>
          item.averageGrade >= range.min && item.averageGrade <= range.max
      ).length,
      fill: range.color,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Grade Reports
          </CardTitle>
          <CardDescription>
            View grade summaries and trends across subjects and quarters
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
                onValueChange={setSelectedQuarter}
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
                disabled={gradeSummary.length === 0}
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
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradeSummary.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {gradeSummary.length > 0
                ? (
                    gradeSummary.reduce(
                      (sum, item) => sum + item.averageGrade,
                      0
                    ) / gradeSummary.length
                  ).toFixed(1)
                : "0.0"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {gradeSummary.length > 0 ? gradeSummary[0].totalStudents : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
            <CardDescription>
              Distribution of average grades across subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getGradeDistributionData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getGradeDistributionData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Grade Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Grade Trends</CardTitle>
            <CardDescription>
              Average grades and passing rates by quarter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={gradeTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quarter" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="averageGrade"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Average Grade"
                />
                <Line
                  type="monotone"
                  dataKey="passingRate"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="Passing Rate (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Grade Summary Details</CardTitle>
          <CardDescription>
            Detailed breakdown of grades by subject
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : gradeSummary.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No grade data available. Please select a section to view reports.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">Average Grade</TableHead>
                  <TableHead className="text-right">Passing Rate</TableHead>
                  <TableHead className="text-right">Total Students</TableHead>
                  <TableHead className="text-right">Grade Range</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gradeSummary.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {item.subjectName}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          item.averageGrade >= 85
                            ? "default"
                            : item.averageGrade >= 75
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {item.averageGrade.toFixed(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.passingRate.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right">
                      {item.totalStudents}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.lowestGrade.toFixed(1)} -{" "}
                      {item.highestGrade.toFixed(1)}
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
