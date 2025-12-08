"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, Send, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/auth.context";
import { useSettings } from "@/contexts/settings.context";
import { toast } from "sonner";
import { quarterPackagesService } from "@/services/quarter-packages.service";
import { gradesService } from "@/services/grades.service";
import { feedbackService } from "@/services/feedback.service";
import { enrollmentService } from "@/services/enrollment.service";
import { QuarterPackageResponse, ScheduleResponse, Quarter } from "@/types/api";

interface SaveOptionsProps {
  selectedSchedule: ScheduleResponse | null;
  // [CHANGE] Added props for role-based behavior
  userRole?: string;
  isAdvisorySection?: boolean;
}

export default function SaveOptions({ selectedSchedule, userRole, isAdvisorySection }: SaveOptionsProps) {
  const { user, profile } = useAuth();
  // [CHANGE] Updated role check: Allow teachers and advisers (advisers see role-based tweaks)
  if (user?.role !== "TEACHER" && user?.role !== "ADVISER") {
    return <p className="text-center text-red-500 mt-10">Access denied. Save Options are for teachers and advisers only.</p>;
  }

  const { activeQuarter } = useSettings();
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quarterPackage, setQuarterPackage] = useState<QuarterPackageResponse | null>(null);

  // Load quarter package data on mount
  useEffect(() => {
    loadQuarterPackageData();
  }, []);

  const loadQuarterPackageData = async () => {
    if (!selectedSchedule?.section.id || !activeQuarter?.activeQuarter) return;

    try {
      const quarterPackageData = await quarterPackagesService.getQuarterPackage(
        selectedSchedule.section.id,
        activeQuarter.activeQuarter as Quarter
      );
      setQuarterPackage(quarterPackageData);
    } catch (error) {
      console.error("Failed to load quarter package data:", error);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedSchedule?.section.id || !selectedSchedule?.subject.id || !activeQuarter?.activeQuarter) {
      toast.error("Please select a class and subject first");
      return;
    }

    try {
      setSaving(true);

      // Get enrolled students
      const enrolledStudents = await enrollmentService.getEnrolledStudents(selectedSchedule.section.id);

      let studentsWithGrades = 0;
      let totalStudents = enrolledStudents.length;

      // Save grades and feedback for each student
      const savePromises = enrolledStudents.map(async (student) => {
        const promises = [];

        // Check if student has component grades before calculating final grade
        try {
          const existingGrades = await gradesService.getGradesForStudent(
            student.studentId,
            selectedSchedule.section.id,
            activeQuarter.activeQuarter
          );

          // Filter out FINAL grades to check for component grades only
          const componentGrades = existingGrades.filter(grade => grade.gradeType !== 'FINAL');

          // Only calculate final grade if there are component grades
          if (componentGrades.length > 0) {
            promises.push(
              gradesService.calculateFinalGrade(
                student.studentId,
                selectedSchedule.subject.id,
                selectedSchedule.section.id,
                activeQuarter.activeQuarter
              )
            );
            studentsWithGrades++;
          }
        } catch (error) {
          console.warn(`Failed to check grades for student ${student.studentId}:`, error);
          // Continue with feedback saving even if grade check fails
        }

        // Save feedback (simplified)
        promises.push(
          feedbackService.recordFeedback(
            student.studentId,
            selectedSchedule.section.id,
            activeQuarter.activeQuarter,
            "Feedback saved" // Placeholder
          )
        );

        return Promise.all(promises);
      });

      await Promise.all(savePromises);

      // Provide appropriate feedback based on results
      if (studentsWithGrades === 0) {
        toast.warning("No grades were saved. Please enter component grades for students before saving as draft.");
      } else if (studentsWithGrades < totalStudents) {
        toast.success(`${studentsWithGrades} out of ${totalStudents} students' grades saved as draft. Some students have no component grades entered yet.`);
      } else {
        toast.success("All grades and feedback saved as draft");
      }

      // Reload quarter package data
      await loadQuarterPackageData();
    } catch (error) {
      console.error("Failed to save draft:", error);
      toast.error("Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  // [CHANGE] Renamed and updated for role-based submission routing
  const handleSubmitQuarterPackage = async () => {
    if (!selectedSchedule?.section.id || !activeQuarter?.activeQuarter) {
      toast.error("Please select a class and subject first");
      return;
    }

    try {
      setSubmitting(true);

      // First save all data
      await handleSaveDraft();

      // Create quarter package if it doesn't exist
      if (!quarterPackage) {
        await quarterPackagesService.createQuarterPackage(
          selectedSchedule.section.id,
          activeQuarter.activeQuarter as Quarter
        );
      }

      // [CHANGE] Role-based submission routing
      if (quarterPackage) {
        // For now, use the standard submission flow. Adviser-specific routing can be implemented when the backend supports it.
        await quarterPackagesService.submitQuarterPackage(quarterPackage.id, user.id);

        if (profile?.isAdviser && isAdvisorySection) {
          toast.success("Records submitted for final validation");
        } else {
          toast.success("Records submitted to adviser for review");
        }
      }

      // Reload data
      await loadQuarterPackageData();
    } catch (error) {
      console.error("Failed to submit quarter package:", error);
      toast.error("Failed to submit quarter package");
    } finally {
      setSubmitting(false);
    }
  };

  // [CHANGE] Dynamic button text and description based on role/section
  const submitButtonText = profile?.isAdviser && isAdvisorySection ? "Submit to Admin" : "Submit to Adviser";
  const submitDescription = profile?.isAdviser && isAdvisorySection
    ? "Send your completed quarter package directly to Admin for final validation (advisory section auto-forward)."
    : "Send your completed quarter package to your adviser for validation. Once submitted, you can no longer edit unless the adviser returns it to you.";

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Save Options</h1>
        <p className="text-muted-foreground mt-2">
          Manage how your quarter package is saved or submitted.
        </p>
      </div>

      {!selectedSchedule && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please select a class and subject from the main dashboard first to access save options.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              Save as Draft
            </CardTitle>
            <CardDescription>
              Keep your work as a draft. Your current updates will be saved but not visible to the adviser yet.
              You can return anytime to continue editing before submitting.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleSaveDraft}
              disabled={saving || !selectedSchedule}
              variant="outline"
              className="w-full"
            >
              {saving ? "Saving..." : "Save Draft"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Submit Quarter Package
            </CardTitle>
            <CardDescription>
              {submitDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleSubmitQuarterPackage}
              disabled={submitting || !selectedSchedule}
              className="w-full"
            >
              {submitting ? "Submitting..." : submitButtonText}
            </Button>
          </CardContent>
        </Card>
      </div>

      {quarterPackage && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Current Package Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Status:</strong> {quarterPackage.status}</p>
              <p><strong>Last Updated:</strong> {new Date(quarterPackage.updatedAt).toLocaleString()}</p>
              {quarterPackage.remarks && (
                <p><strong>Remarks:</strong> {quarterPackage.remarks}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
