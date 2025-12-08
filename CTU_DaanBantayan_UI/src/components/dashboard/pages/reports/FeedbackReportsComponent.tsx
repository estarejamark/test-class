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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, MessageSquare, Search, Filter } from "lucide-react";
import { reportsService } from "@/services/reports.service";
import { FeedbackReportResponse, Quarter } from "@/types/api";

export function FeedbackReportsComponent() {
  const [feedbackData, setFeedbackData] = useState<FeedbackReportResponse[]>([]);
  const [filteredData, setFilteredData] = useState<FeedbackReportResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | undefined>();
  const [selectedQuarter, setSelectedQuarter] = useState<string | undefined>();
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
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
      loadFeedbackData();
    }
  }, [selectedYear, selectedQuarter, selectedSection]);

  useEffect(() => {
    filterData();
  }, [feedbackData, searchTerm]);

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

  const loadFeedbackData = async () => {
    if (!selectedSection) return;

    setLoading(true);
    try {
      const data = await reportsService.getFeedbackReport(
        selectedYear,
        selectedQuarter === "all" ? undefined : selectedQuarter,
        selectedSection
      );
      setFeedbackData(data);
    } catch (error) {
      console.error("Failed to load feedback data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    if (!searchTerm) {
      setFilteredData(feedbackData);
      return;
    }

    const filtered = feedbackData.filter(
      (item) =>
        item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sectionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.feedback.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) return;

    const headers = [
      "Student Name",
      "Section",
      "Quarter",
      "Feedback",
      "Date Submitted",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredData.map((item) =>
        [
          `"${item.studentName}"`,
          `"${item.sectionName}"`,
          item.quarter,
          `"${item.feedback.replace(/"/g, '""')}"`,
          item.createdAt,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback-report-${selectedYear || "all"}-${selectedQuarter || "all"}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getFeedbackStats = () => {
    const totalFeedback = feedbackData.length;
    const positiveFeedback = feedbackData.filter((item) =>
      item.feedback.toLowerCase().includes("good") ||
      item.feedback.toLowerCase().includes("excellent") ||
      item.feedback.toLowerCase().includes("great")
    ).length;
    const negativeFeedback = feedbackData.filter((item) =>
      item.feedback.toLowerCase().includes("bad") ||
      item.feedback.toLowerCase().includes("poor") ||
      item.feedback.toLowerCase().includes("difficult")
    ).length;

    return { totalFeedback, positiveFeedback, negativeFeedback };
  };

  const stats = getFeedbackStats();

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Feedback Reports
          </CardTitle>
          <CardDescription>
            Review student feedback and comments
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

            <div className="flex items-end gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search feedback..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 min-w-[200px]"
                />
              </div>
              <Button
                variant="outline"
                onClick={exportToCSV}
                disabled={filteredData.length === 0}
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
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFeedback}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive Feedback</CardTitle>
            <Filter className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.positiveFeedback}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalFeedback > 0
                ? ((stats.positiveFeedback / stats.totalFeedback) * 100).toFixed(1)
                : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Areas for Improvement</CardTitle>
            <Filter className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.negativeFeedback}
            </div>
            <p className="text-xs text-muted-foreground">
              Feedback needing attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Feedback Details</CardTitle>
          <CardDescription>
            Individual student feedback and comments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {feedbackData.length === 0
                ? "No feedback data available. Please select a section to view reports."
                : "No feedback matches your search criteria."}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredData.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{item.studentName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.sectionName} • {item.quarter}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm">{item.feedback}</p>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <Badge
                      variant={
                        item.feedback.toLowerCase().includes("good") ||
                        item.feedback.toLowerCase().includes("excellent")
                          ? "default"
                          : item.feedback.toLowerCase().includes("bad") ||
                            item.feedback.toLowerCase().includes("difficult")
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {item.feedback.toLowerCase().includes("good") ||
                      item.feedback.toLowerCase().includes("excellent")
                        ? "Positive"
                        : item.feedback.toLowerCase().includes("bad") ||
                          item.feedback.toLowerCase().includes("difficult")
                        ? "Needs Attention"
                        : "Neutral"}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
