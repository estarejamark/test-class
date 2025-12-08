"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Calculator, Save, Send, Users, BarChart3, Package, Calendar, Briefcase, Grid3X3, List, Table as TableIcon } from "lucide-react";
import { enrollmentService, EnrolledStudentResponse } from "@/services/enrollment.service";
import { gradesService } from "@/services/grades.service";
import { feedbackService } from "@/services/feedback.service";
import { quarterPackagesService } from "@/services/quarter-packages.service";
import { ScheduleResponse, Quarter, QuarterPackageResponse, RecordApprovalResponse } from "@/types/api";
import { GradeResponse, FeedbackResponse } from "@/types/grades";
import { useAuth } from "@/contexts/auth.context";
import { useSettings } from "@/contexts/settings.context";
import { useTeacherSettings } from "@/hooks/useTeacherSettings";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/StatusBadge";


interface QuarterlyEncodingComponentProps {
  selectedSchedule: ScheduleResponse | null;
  onNavigate?: (item: string) => void;
}

interface StudentGradeData {
  studentId: string;
  studentName: string;
  written: number | null;
  performance: number | null;
  exam: number | null;
  final: number | null;
  feedback: string;
  existingGrades: GradeResponse[];
  existingFeedback: FeedbackResponse | null;
}

export default function QuarterlyEncodingComponent({ selectedSchedule, onNavigate }: QuarterlyEncodingComponentProps) {
  const { user } = useAuth();
  const { activeQuarter } = useSettings();
  const { settings: teacherSettings } = useTeacherSettings();
  const [students, setStudents] = useState<StudentGradeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudentResponse[]>([]);
  const [submissionStatus, setSubmissionStatus] = useState<"Draft" | "Returned" | "ForAdviser">("Draft");
  const [quarterPackage, setQuarterPackage] = useState<QuarterPackageResponse | null>(null);
  const [approvalHistory, setApprovalHistory] = useState<RecordApprovalResponse[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'card' | 'compact'>('table');

  // Initialize view mode from teacher settings
  useEffect(() => {
    if (teacherSettings?.appearance?.defaultGradingView) {
      setViewMode(teacherSettings.appearance.defaultGradingView);
    }
  }, [teacherSettings]);

  // Grade weights (configurable)
  const GRADE_WEIGHTS = {
    written: 0.30,      // 30%
    performance: 0.50,  // 50%
    exam: 0.20          // 20%
  };

  // Load enrolled students when schedule changes
  useEffect(() => {
    if (selectedSchedule?.section.id) {
      loadEnrolledStudents();
    }
  }, [selectedSchedule]);

  // Load existing grades and feedback when students or quarter change
  useEffect(() => {
    if (enrolledStudents.length > 0 && selectedSchedule && activeQuarter) {
      loadExistingData();
    }
  }, [enrolledStudents, activeQuarter, selectedSchedule]);

  // Load quarter package data when section or quarter changes
  useEffect(() => {
    if (selectedSchedule?.section.id && activeQuarter?.activeQuarter) {
      loadQuarterPackageData();
    }
  }, [selectedSchedule?.section.id, activeQuarter?.activeQuarter]);

  const loadEnrolledStudents = async () => {
    if (!selectedSchedule?.section.id) return;

    try {
      setLoading(true);
      const enrolled = await enrollmentService.getEnrolledStudents(selectedSchedule.section.id);
      setEnrolledStudents(enrolled);

      // Initialize student grade data
      const initialStudents: StudentGradeData[] = enrolled.map(student => ({
        studentId: student.studentId,
        studentName: student.studentName,
        written: null,
        performance: null,
        exam: null,
        final: null,
        feedback: "",
        existingGrades: [],
        existingFeedback: null,
      }));
      setStudents(initialStudents);
    } catch (error) {
      console.error("Failed to load enrolled students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const loadExistingData = async () => {
    if (!selectedSchedule?.section.id || !selectedSchedule?.subject.id || !activeQuarter?.activeQuarter) return;

    try {
      const gradePromises = enrolledStudents.map(student =>
        gradesService.getGradesForStudent(student.studentId, selectedSchedule.section.id, activeQuarter.activeQuarter)
      );

      const feedbackPromises = enrolledStudents.map(student =>
        feedbackService.getFeedbackForStudent(student.studentId, selectedSchedule.section.id, activeQuarter.activeQuarter)
      );

      const [gradesResults, feedbackResults] = await Promise.all([
        Promise.all(gradePromises),
        Promise.all(feedbackPromises)
      ]);

      // Update students with existing data
      const updatedStudents = students.map((student, index) => {
        const existingGrades = gradesResults[index] || [];
        const existingFeedback = feedbackResults[index];

        // Extract component grades
        const writtenGrade = existingGrades.find((g: GradeResponse) => g.gradeType === "WRITTEN");
        const performanceGrade = existingGrades.find((g: GradeResponse) => g.gradeType === "PERFORMANCE");
        const examGrade = existingGrades.find((g: GradeResponse) => g.gradeType === "EXAM");
        const finalGrade = existingGrades.find((g: GradeResponse) => g.gradeType === "FINAL");

        // Calculate final grade if components exist but no final grade
        let calculatedFinal = finalGrade?.score || null;
        if (!calculatedFinal && writtenGrade && performanceGrade && examGrade) {
          calculatedFinal = calculateFinalGrade(
            writtenGrade.score,
            performanceGrade.score,
            examGrade.score
          );
        }

        return {
          ...student,
          written: writtenGrade?.score || null,
          performance: performanceGrade?.score || null,
          exam: examGrade?.score || null,
          final: calculatedFinal,
          feedback: existingFeedback?.feedback || "",
          existingGrades,
          existingFeedback,
        };
      });

      setStudents(updatedStudents);
      } catch (error) {
      console.error("Failed to load existing data:", error);
      // Don't show error toast here as it's not critical for initial load
    }
  };

  const loadQuarterPackageData = async () => {
    if (!selectedSchedule?.section.id || !activeQuarter?.activeQuarter) return;

    try {
      const quarterPackageData = await quarterPackagesService.getQuarterPackage(
        selectedSchedule.section.id,
        activeQuarter.activeQuarter as Quarter
      );

      if (quarterPackageData) {
        setQuarterPackage(quarterPackageData);

        // Map package status to component status
        const statusMap: Record<string, "Draft" | "Returned" | "ForAdviser"> = {
          PENDING: "Draft",
          RETURNED: "Returned",
          APPROVED: "ForAdviser",
          PUBLISHED: "ForAdviser",
        };
        setSubmissionStatus(statusMap[quarterPackageData.status] || "Draft");

        // Load approval history if package exists
        const history = await quarterPackagesService.getApprovalHistory(quarterPackageData.id);
        setApprovalHistory(history);
      } else {
        // No package exists, set to draft
        setQuarterPackage(null);
        setSubmissionStatus("Draft");
        setApprovalHistory([]);
      }
    } catch (error) {
      console.error("Failed to load quarter package data:", error);
      // Set default state on error
      setQuarterPackage(null);
      setSubmissionStatus("Draft");
      setApprovalHistory([]);
    }
  };

  const calculateFinalGrade = (written: number, performance: number, exam: number): number => {
    return Math.round(
      (written * GRADE_WEIGHTS.written) +
      (performance * GRADE_WEIGHTS.performance) +
      (exam * GRADE_WEIGHTS.exam)
    );
  };

  const handleGradeChange = (studentId: string, gradeType: 'written' | 'performance' | 'exam', value: string) => {
    const numValue = value === "" ? null : parseFloat(value);

    // Validate input
    if (numValue !== null && (numValue < 0 || numValue > 100)) {
      toast.error("Grade must be between 0 and 100");
      return;
    }

    setStudents(prev =>
      prev.map(student => {
        if (student.studentId !== studentId) return student;

        const updated = { ...student, [gradeType]: numValue };

        // Auto-calculate final grade if all components are present
        if (updated.written !== null && updated.performance !== null && updated.exam !== null) {
          updated.final = calculateFinalGrade(updated.written, updated.performance, updated.exam);
        } else {
          updated.final = null;
        }

        return updated;
      })
    );
  };

  const handleFeedbackChange = (studentId: string, feedback: string) => {
    // Limit feedback to 300 characters
    if (feedback.length > 300) {
      toast.error("Feedback cannot exceed 300 characters");
      return;
    }

    setStudents(prev =>
      prev.map(student =>
        student.studentId === studentId
          ? { ...student, feedback }
          : student
      )
    );
  };

  const validateData = (): boolean => {
    for (const student of students) {
      if (student.written === null || student.performance === null || student.exam === null) {
        toast.error(`Please enter all grades for ${student.studentName}`);
        return false;
      }
      if (student.feedback.trim().length === 0) {
        toast.error(`Please enter feedback for ${student.studentName}`);
        return false;
      }
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!selectedSchedule?.section.id || !selectedSchedule?.subject.id || !activeQuarter?.activeQuarter) return;

    try {
      setSaving(true);

      // Save grades and feedback for each student
      const savePromises = students.map(async (student) => {
        const promises = [];

        // Save component grades
        if (student.written !== null) {
          promises.push(
            gradesService.recordGrade(
              student.studentId,
              selectedSchedule.subject.id,
              selectedSchedule.section.id,
              activeQuarter.activeQuarter,
              "WRITTEN",
              student.written
            )
          );
        }

        if (student.performance !== null) {
          promises.push(
            gradesService.recordGrade(
              student.studentId,
              selectedSchedule.subject.id,
              selectedSchedule.section.id,
              activeQuarter.activeQuarter,
              "PERFORMANCE",
              student.performance
            )
          );
        }

        if (student.exam !== null) {
          promises.push(
            gradesService.recordGrade(
              student.studentId,
              selectedSchedule.subject.id,
              selectedSchedule.section.id,
              activeQuarter.activeQuarter,
              "EXAM",
              student.exam
            )
          );
        }

        // Save final grade directly (calculated on frontend)
        if (student.final !== null) {
          promises.push(
            gradesService.recordGrade(
              student.studentId,
              selectedSchedule.subject.id,
              selectedSchedule.section.id,
              activeQuarter.activeQuarter,
              "FINAL",
              student.final
            )
          );
        }

        // Save feedback
        if (student.feedback.trim()) {
          promises.push(
            feedbackService.recordFeedback(
              student.studentId,
              selectedSchedule.section.id,
              activeQuarter.activeQuarter,
              student.feedback.trim()
            )
          );
        }

        return Promise.all(promises);
      });

      await Promise.all(savePromises);
      toast.success("Grades and feedback saved as draft");

      // Reload data to get updated records
      await loadExistingData();
    } catch (error) {
      console.error("Failed to save draft:", error);
      toast.error("Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitToAdviser = async () => {
    if (!validateData()) return;

    if (!selectedSchedule?.section.id || !activeQuarter?.activeQuarter || !user?.id) {
      toast.error("Missing required information for submission");
      return;
    }

    try {
      setSubmitting(true);

      // First save all data
      await handleSaveDraft();

      // Create or update quarter package
      let packageToSubmit = quarterPackage;
      if (!packageToSubmit) {
        // Create new quarter package if it doesn't exist
        packageToSubmit = await quarterPackagesService.createQuarterPackage(
          selectedSchedule.section.id,
          activeQuarter.activeQuarter as Quarter
        );
        setQuarterPackage(packageToSubmit);
      }

      // Submit the quarter package
      if (packageToSubmit) {
        await quarterPackagesService.submitQuarterPackage(packageToSubmit.id, user.id);

        // Reload quarter package data to update status
        await loadQuarterPackageData();

        toast.success("Records submitted to adviser for review");
      } else {
        throw new Error("Unable to submit package: missing package information");
      }
    } catch (error) {
      console.error("Failed to submit to adviser:", error);
      toast.error("Failed to submit to adviser");
    } finally {
      setSubmitting(false);
    }
  };

  if (!selectedSchedule) {
    return (
      <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <Alert>
            <AlertDescription>
              Please select a class and subject first to encode grades and feedback.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Header */}
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Quarterly Grade Encoding</h2>
            <p className="text-muted-foreground">
              {selectedSchedule.subject.name} - {selectedSchedule.section.name} - {activeQuarter?.activeQuarter || 'Unknown'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline">Current Quarter: {activeQuarter?.activeQuarter || 'Unknown'}</Badge>
            <StatusBadge status={submissionStatus} />
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 mt-4">
          <span className="text-sm font-medium">View Mode:</span>
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="flex items-center gap-1"
            >
              <TableIcon className="h-4 w-4" />
              Table
            </Button>
            <Button
              variant={viewMode === 'card' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('card')}
              className="flex items-center gap-1"
            >
              <Grid3X3 className="h-4 w-4" />
              Card
            </Button>
            <Button
              variant={viewMode === 'compact' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('compact')}
              className="flex items-center gap-1"
            >
              <List className="h-4 w-4" />
              Compact
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Access Panel */}
      <div className="px-4 lg:px-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Quick Actions for {selectedSchedule?.section.name} - {selectedSchedule?.subject.name}
            </CardTitle>
            <CardDescription>
              Access related functions without leaving this page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              <Button
                variant="outline"
                onClick={() => onNavigate?.("my-quarter-package")}
                className="flex items-center gap-2"
              >
                <Package className="h-4 w-4" />
                Manage Quarter Package
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate?.("daily-attendance")}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Mark Attendance
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate?.("select-class-subject")}
                className="flex items-center gap-2"
              >
                <Briefcase className="h-4 w-4" />
                Switch Class
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Access save options and check submission status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => onNavigate?.("save-options")}>
                <Save className="h-4 w-4 mr-2" />
                Save Options
              </Button>
              <Button variant="outline" onClick={() => onNavigate?.("status")}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="px-4 lg:px-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Complete Records</CardTitle>
              <Calculator className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {students.filter(s => s.written !== null && s.performance !== null && s.exam !== null && s.feedback.trim()).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Missing Grades</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {students.filter(s => s.written === null || s.performance === null || s.exam === null).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Missing Feedback</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {students.filter(s => !s.feedback.trim()).length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Grade Encoding */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Grade Encoding</CardTitle>
            <CardDescription>
              Enter grades for Written (30%), Performance (50%), and Exam (20%) components.
              Final grades are auto-calculated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading students...</div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No students enrolled in this section
              </div>
            ) : viewMode === 'table' ? (
              <div className="space-y-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Student Name</TableHead>
                      <TableHead className="text-center">Written (30%)</TableHead>
                      <TableHead className="text-center">Performance (50%)</TableHead>
                      <TableHead className="text-center">Exam (20%)</TableHead>
                      <TableHead className="text-center">Final Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.studentId}>
                        <TableCell className="font-medium">
                          <div>
                            <p>{student.studentName}</p>
                            <p className="text-sm text-muted-foreground">ID: {student.studentId}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={student.written ?? ""}
                            onChange={(e) => handleGradeChange(student.studentId, 'written', e.target.value)}
                            placeholder="0-100"
                            className="w-20 text-center"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={student.performance ?? ""}
                            onChange={(e) => handleGradeChange(student.studentId, 'performance', e.target.value)}
                            placeholder="0-100"
                            className="w-20 text-center"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={student.exam ?? ""}
                            onChange={(e) => handleGradeChange(student.studentId, 'exam', e.target.value)}
                            placeholder="0-100"
                            className="w-20 text-center"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={student.final !== null ? "default" : "secondary"}>
                            {student.final !== null ? `${student.final}%` : "Pending"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : viewMode === 'card' ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {students.map((student) => (
                  <Card key={student.studentId} className="p-4">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium">{student.studentName}</h3>
                        <p className="text-sm text-muted-foreground">ID: {student.studentId}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Written (30%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={student.written ?? ""}
                            onChange={(e) => handleGradeChange(student.studentId, 'written', e.target.value)}
                            placeholder="0-100"
                            className="h-8 text-center"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Performance (50%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={student.performance ?? ""}
                            onChange={(e) => handleGradeChange(student.studentId, 'performance', e.target.value)}
                            placeholder="0-100"
                            className="h-8 text-center"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Exam (20%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={student.exam ?? ""}
                            onChange={(e) => handleGradeChange(student.studentId, 'exam', e.target.value)}
                            placeholder="0-100"
                            className="h-8 text-center"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Final Grade</Label>
                          <div className="h-8 flex items-center justify-center">
                            <Badge variant={student.final !== null ? "default" : "secondary"} className="text-xs">
                              {student.final !== null ? `${student.final}%` : "Pending"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {students.map((student) => (
                  <div key={student.studentId} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{student.studentName}</p>
                      <p className="text-sm text-muted-foreground">ID: {student.studentId}</p>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={student.written ?? ""}
                        onChange={(e) => handleGradeChange(student.studentId, 'written', e.target.value)}
                        placeholder="W"
                        className="w-16 h-8 text-center text-xs"
                      />
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={student.performance ?? ""}
                        onChange={(e) => handleGradeChange(student.studentId, 'performance', e.target.value)}
                        placeholder="P"
                        className="w-16 h-8 text-center text-xs"
                      />
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={student.exam ?? ""}
                        onChange={(e) => handleGradeChange(student.studentId, 'exam', e.target.value)}
                        placeholder="E"
                        className="w-16 h-8 text-center text-xs"
                      />
                      <div className="w-16 h-8 flex items-center justify-center">
                        <Badge variant={student.final !== null ? "default" : "secondary"} className="text-xs">
                          {student.final !== null ? `${student.final}%` : "—"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feedback Section */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Student Feedback</CardTitle>
            <CardDescription>
              Provide qualitative feedback for each student (maximum 300 characters).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {students.map((student) => (
                <div key={student.studentId} className="space-y-2">
                  <Label htmlFor={`feedback-${student.studentId}`}>
                    {student.studentName}
                  </Label>
                  <Textarea
                    id={`feedback-${student.studentId}`}
                    value={student.feedback}
                    onChange={(e) => handleFeedbackChange(student.studentId, e.target.value)}
                    placeholder="Enter feedback for this student..."
                    rows={3}
                    maxLength={300}
                  />
                  <div className="text-sm text-muted-foreground text-right">
                    {student.feedback.length}/300 characters
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Remarks Section */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Quarter Remarks</CardTitle>
            <CardDescription>
              Add any additional remarks or notes for this quarter package (maximum 500 characters).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Textarea
                value={quarterPackage?.remarks || ""}
                onChange={(e) => {
                  const remarks = e.target.value;
                  if (remarks.length <= 500) {
                    setQuarterPackage(prev => prev ? { ...prev, remarks } : null);
                  }
                }}
                placeholder="Enter remarks for this quarter package..."
                rows={4}
                maxLength={500}
              />
              <div className="text-sm text-muted-foreground text-right">
                {(quarterPackage?.remarks || "").length}/500 characters
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

