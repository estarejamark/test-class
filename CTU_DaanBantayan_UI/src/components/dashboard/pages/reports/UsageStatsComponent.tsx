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
import { Badge } from "@/components/ui/badge";
import { Download, BarChart3, Users, BookOpen, TrendingUp } from "lucide-react";
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
} from "recharts";
import { reportsService } from "@/services/reports.service";
import { UsageStatsResponse } from "@/types/api";

export function UsageStatsComponent() {
  const [usageStats, setUsageStats] = useState<UsageStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("last_30_days");

  const periodOptions = [
    { value: "last_30_days", label: "Last 30 Days" },
    { value: "last_90_days", label: "Last 90 Days" },
  ];

  useEffect(() => {
    loadUsageStats();
  }, [selectedPeriod]);

  const loadUsageStats = async () => {
    setLoading(true);
    try {
      const stats = await reportsService.getUsageStats(selectedPeriod);
      setUsageStats(stats);
    } catch (error) {
      console.error("Failed to load usage stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!usageStats) return;

    const headers = ["Metric", "Value", "Period"];
    const csvContent = [
      headers.join(","),
      `Active Students,${usageStats.activeStudents},${usageStats.period}`,
      `Active Sections,${usageStats.activeSections},${usageStats.period}`,
      `Total Grades,${usageStats.totalGrades},${usageStats.period}`,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usage-stats-${selectedPeriod}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getUsageChartData = () => {
    if (!usageStats) return [];

    return [
      {
        name: "Active Students",
        value: usageStats.activeStudents,
        fill: "#0088FE",
      },
      {
        name: "Active Sections",
        value: usageStats.activeSections,
        fill: "#00C49F",
      },
      {
        name: "Total Grades",
        value: usageStats.totalGrades,
        fill: "#FFBB28",
      },
    ];
  };

  const getTrendData = () => {
    // Mock trend data - in a real implementation, this would come from historical data
    return [
      { period: "Day 1", students: 45, sections: 8, grades: 120 },
      { period: "Day 7", students: 52, sections: 9, grades: 145 },
      { period: "Day 14", students: 48, sections: 8, grades: 132 },
      { period: "Day 21", students: 55, sections: 10, grades: 158 },
      { period: "Day 28", students: usageStats?.activeStudents || 50, sections: usageStats?.activeSections || 9, grades: usageStats?.totalGrades || 150 },
    ];
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Usage Statistics
          </CardTitle>
          <CardDescription>
            Monitor system usage and activity metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="min-w-[200px]">
              <label className="text-sm font-medium mb-1 block">Time Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={exportToCSV}
                disabled={!usageStats}
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
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats?.activeStudents || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Students with recent activity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sections</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats?.activeSections || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Sections with recent activity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Grades</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats?.totalGrades || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Grades recorded in period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Overview Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Overview</CardTitle>
            <CardDescription>
              Current system usage metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getUsageChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Usage Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Trends</CardTitle>
            <CardDescription>
              Activity trends over the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getTrendData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="students"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Active Students"
                />
                <Line
                  type="monotone"
                  dataKey="sections"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="Active Sections"
                />
                <Line
                  type="monotone"
                  dataKey="grades"
                  stroke="#ffc658"
                  strokeWidth={2}
                  name="Total Grades"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Card>
        <CardHeader>
          <CardTitle>System Health Indicators</CardTitle>
          <CardDescription>
            Key metrics and system status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : usageStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Student Engagement Rate</span>
                  <Badge variant="secondary">
                    {usageStats.activeStudents > 0 ? "Good" : "Low"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Section Utilization</span>
                  <Badge variant="secondary">
                    {usageStats.activeSections > 0 ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Grading Activity</span>
                  <Badge variant="secondary">
                    {usageStats.totalGrades > 0 ? "Active" : "Low"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Period</span>
                  <Badge variant="outline">
                    {periodOptions.find(p => p.value === selectedPeriod)?.label}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Data Freshness</span>
                  <Badge variant="outline">Real-time</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Report Status</span>
                  <Badge variant="default">Generated</Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No usage data available for the selected period.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
