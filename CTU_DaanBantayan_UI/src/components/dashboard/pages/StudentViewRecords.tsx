"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DashboardLoading } from "@/components/utils";
import {
  IconCalendar,
  IconFileDescription,
  IconMessage,
  IconCheck,
  IconUser,
  IconDownload,
} from "@tabler/icons-react";
import { useAuth } from "@/contexts/auth.context";

// Types for student records
interface AttendanceRecord {
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  teacherRemarks?: string;
}

interface GradeRecord {
  subject: string;
  grade: string;
  teacher: string;
}

interface FeedbackItem {
  id: string;
  teacherName: string;
  subject: string;
  message: string;
  date: string;
  studentResponse?: string;
  isAcknowledged: boolean;
}

interface QuarterlyPackage {
  quarter: string;
  grades: GradeRecord[];
  attendanceSummary: {
    presentDays: number;
    totalDays: number;
    attendanceRate: number;
  };
  feedback: FeedbackItem[];
  adviserNotes?: string;
  isAcknowledged: boolean;
  publishedAt: string;
}

export function StudentViewRecords() {
  const { user, profile } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [quarterlyPackage, setQuarterlyPackage] = useState<QuarterlyPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  useEffect(() => {
    const fetchStudentRecords = async () => {
      try {
        setIsLoading(true);

        // TODO: Replace with actual API calls
        // For now, using mock data
        const mockAttendanceRecords: AttendanceRecord[] = [
          { date: "2024-01-15", status: "PRESENT", teacherRemarks: "Good participation" },
          { date: "2024-01-14", status: "PRESENT" },
          { date: "2024-01-13", status: "LATE", teacherRemarks: "Arrived 15 minutes late" },
          { date: "2024-01-12", status: "PRESENT" },
          { date: "2024-01-11", status: "ABSENT", teacherRemarks: "Called in sick" },
        ];

        const mockQuarterlyPackage: QuarterlyPackage = {
          quarter: "Q1",
          grades: [
            { subject: "Mathematics", grade: "92", teacher: "Prof. Juan Dela Cruz" },
            { subject: "Science", grade: "88", teacher: "Ms. Ana Rodriguez" },
            { subject: "English", grade: "95", teacher: "Mr. Carlos Mendoza" },
            { subject: "History", grade: "90", teacher: "Dr. Maria Santos" },
          ],
          attendanceSummary: {
            presentDays: 45,
            totalDays: 50,
            attendanceRate: 90,
          },
          feedback: [
            {
              id: "1",
              teacherName: "Prof. Juan Dela Cruz",
              subject: "Mathematics",
              message: "Excellent improvement in problem-solving skills. Keep up the good work!",
              date: "2024-01-20T10:30:00Z",
              studentResponse: "Thank you for the feedback. I'll continue to practice more problems.",
              isAcknowledged: true,
            },
            {
              id: "2",
              teacherName: "Ms. Ana Rodriguez",
              subject: "Science",
              message: "Good participation in experiments. Could improve on written reports.",
              date: "2024-01-18T14:15:00Z",
              isAcknowledged: false,
            },
          ],
          adviserNotes: "Overall excellent performance this quarter. Continue maintaining good attendance and active participation in class activities.",
          isAcknowledged: false,
          publishedAt: "2024-01-20T09:00:00Z",
        };

        setAttendanceRecords(mockAttendanceRecords);
        setQuarterlyPackage(mockQuarterlyPackage);
      } catch (error) {
        console.error("Error fetching student records:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentRecords();
  }, [user]);

  const handleFeedbackResponse = async () => {
    if (!selectedFeedback || !responseText.trim()) return;

    try {
      setIsSubmittingResponse(true);

      // TODO: Replace with actual API call
      setQuarterlyPackage(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          feedback: prev.feedback.map(f =>
            f.id === selectedFeedback.id
              ? { ...f, studentResponse: responseText, isAcknowledged: true }
              : f
          ),
        };
      });

      setSelectedFeedback(null);
      setResponseText("");
    } catch (error) {
      console.error("Error submitting feedback response:", error);
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const handleAcknowledgePackage = async () => {
    try {
      setIsAcknowledging(true);

      // TODO: Replace with actual API call
      setQuarterlyPackage(prev => prev ? { ...prev, isAcknowledged: true } : null);
    } catch (error) {
      console.error("Error acknowledging package:", error);
    } finally {
      setIsAcknowledging(false);
    }
  };

  const getAttendanceStatusBadge = (status: string) => {
    switch (status) {
      case "PRESENT":
        return <Badge variant="default">Present</Badge>;
      case "ABSENT":
        return <Badge variant="destructive">Absent</Badge>;
      case "LATE":
        return <Badge variant="secondary">Late</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const downloadQuarterlyReport = async () => {
    if (!quarterlyPackage || !user || !profile) return;

    // Lazy load jsPDF only when needed
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Quarterly Academic Report", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`${quarterlyPackage.quarter} - ${new Date().getFullYear()}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;

    // Student Info
    doc.setFontSize(10);
    doc.text(`Student: ${profile.firstName} ${profile.lastName}`, margin, yPosition);
    yPosition += 8;
    doc.text(`ID: ${user.id}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += 15;

    // Grades Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Grades", margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    quarterlyPackage.grades.forEach((grade) => {
      doc.text(`${grade.subject}: ${grade.grade}`, margin, yPosition);
      yPosition += 6;
    });
    yPosition += 10;

    // Attendance Summary
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Attendance Summary", margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Days Present: ${quarterlyPackage.attendanceSummary.presentDays}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Total Days: ${quarterlyPackage.attendanceSummary.totalDays}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Attendance Rate: ${quarterlyPackage.attendanceSummary.attendanceRate}%`, margin, yPosition);
    yPosition += 15;

    // Adviser Notes (if available)
    if (quarterlyPackage.adviserNotes) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Adviser Notes", margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const splitNotes = doc.splitTextToSize(quarterlyPackage.adviserNotes, pageWidth - 2 * margin);
      doc.text(splitNotes, margin, yPosition);
      yPosition += splitNotes.length * 5 + 10;
    }

    // Disclaimer at the bottom
    const disclaimerY = pageHeight - 30;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("This is not an official school document.", pageWidth / 2, disclaimerY, { align: "center" });

    // Save the PDF
    const fileName = `${profile.firstName}_${profile.lastName}_${quarterlyPackage.quarter}_Report.pdf`;
    doc.save(fileName);
  };

  if (isLoading) {
    return <DashboardLoading text="Loading student records..." />;
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-4">
      <div className="flex flex-col gap-6 py-4 md:py-6 max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">View Records</h1>
            <p className="text-muted-foreground">
              Review your attendance, grades, and quarterly packages
            </p>
          </div>
        </div>

        {/* Daily Attendance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconCalendar className="h-5 w-5" />
              Daily Attendance
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Your attendance records for the current quarter (Unofficial - subject to teacher verification)
            </p>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Teacher Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {new Date(record.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {getAttendanceStatusBadge(record.status)}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {record.teacherRemarks || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Quarterly Package */}
        {quarterlyPackage && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <IconFileDescription className="h-5 w-5" />
                    {quarterlyPackage.quarter} Official Package
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Published on {new Date(quarterlyPackage.publishedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={downloadQuarterlyReport}
                  >
                    <IconDownload className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  {!quarterlyPackage.isAcknowledged && (
                    <Button
                      onClick={handleAcknowledgePackage}
                      disabled={isAcknowledging}
                    >
                      {isAcknowledging ? "Acknowledging..." : "Acknowledge Package"}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Acknowledgement Status */}
              {quarterlyPackage.isAcknowledged && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <IconCheck className="h-5 w-5 text-green-600" />
                  <span className="text-green-800 font-medium">
                    Package Acknowledged
                  </span>
                </div>
              )}

              {/* Grades */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Grades</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Teacher</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quarterlyPackage.grades.map((grade, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {grade.subject}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{grade.grade}</Badge>
                          </TableCell>
                          <TableCell>{grade.teacher}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Attendance Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Attendance Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {quarterlyPackage.attendanceSummary.presentDays}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Days Present
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {quarterlyPackage.attendanceSummary.totalDays}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total Days
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {quarterlyPackage.attendanceSummary.attendanceRate}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Attendance Rate
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Teacher Feedback */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Teacher Feedback</h3>
                <div className="space-y-4">
                  {quarterlyPackage.feedback.map((feedback) => (
                    <Card key={feedback.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <IconUser className="h-4 w-4" />
                              <span className="font-medium">{feedback.teacherName}</span>
                              <Badge variant="outline">{feedback.subject}</Badge>
                            </div>
                            <p className="text-sm mb-3">{feedback.message}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(feedback.date).toLocaleDateString()}
                            </p>

                            {feedback.studentResponse && (
                              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm font-medium text-blue-900 mb-1">
                                  Your Response:
                                </p>
                                <p className="text-sm text-blue-800">
                                  {feedback.studentResponse}
                                </p>
                              </div>
                            )}
                          </div>

                          {!feedback.studentResponse && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedFeedback(feedback)}
                                >
                                  <IconMessage className="h-4 w-4 mr-1" />
                                  Respond
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Respond to Feedback</DialogTitle>
                                  <DialogDescription>
                                    Share your thoughts on {feedback.teacherName}&apos;s feedback for {feedback.subject}.
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4">
                                  <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm font-medium mb-1">
                                      {feedback.teacherName} ({feedback.subject}):
                                    </p>
                                    <p className="text-sm">{feedback.message}</p>
                                  </div>

                                  <div>
                                    <label className="text-sm font-medium mb-2 block">
                                      Your Response
                                    </label>
                                    <Textarea
                                      placeholder="Share your thoughts..."
                                      value={responseText}
                                      onChange={(e) => setResponseText(e.target.value)}
                                      rows={4}
                                    />
                                  </div>
                                </div>

                                <DialogFooter>
                                  <Button
                                    onClick={handleFeedbackResponse}
                                    disabled={isSubmittingResponse || !responseText.trim()}
                                  >
                                    {isSubmittingResponse ? "Submitting..." : "Submit Response"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Adviser Notes */}
              {quarterlyPackage.adviserNotes && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Adviser Notes</h3>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm">{quarterlyPackage.adviserNotes}</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
