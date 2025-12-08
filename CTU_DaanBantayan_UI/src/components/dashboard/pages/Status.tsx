"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AlertTriangle, Clock, CheckCircle, RotateCcw, UserCheck } from "lucide-react"; // [CHANGE] Added UserCheck for Admin icon
import { useAuth } from "@/contexts/auth.context";
import { useSettings } from "@/contexts/settings.context";
import { quarterPackagesService } from "@/services/quarter-packages.service";
import { QuarterPackageResponse, ScheduleResponse, Quarter, RecordApprovalResponse, ApprovalAction } from "@/types/api";
import { Role } from "@/types/auth";

// [CHANGE] Updated type to include adviser-specific status
type SubmissionStatus = "Draft" | "Returned" | "ForAdviser" | "ForwardedToAdmin";

interface StatusProps {
  selectedSchedule: ScheduleResponse | null;
  // [CHANGE] Added props for role-based behavior
  userRole?: string;
  isAdvisorySection?: boolean;
}

export default function Status({ selectedSchedule, userRole, isAdvisorySection }: StatusProps) {
  const { user, profile } = useAuth();
  // [CHANGE] Updated role check: Allow teachers and advisers
  if (user?.role !== "TEACHER" && user?.role !== "ADVISER") {
    return <p className="text-center text-red-500 mt-10">Access denied. Status view is for teachers and advisers only.</p>;
  }

  const { activeQuarter } = useSettings();
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>("Draft");
  const [quarterPackage, setQuarterPackage] = useState<QuarterPackageResponse | null>(null);
  const [approvalHistory, setApprovalHistory] = useState<RecordApprovalResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Load quarter package data on mount
  useEffect(() => {
    loadQuarterPackageData();
  }, []);

  const loadQuarterPackageData = async () => {
    if (!selectedSchedule?.section.id || !activeQuarter?.activeQuarter) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const quarterPackageData = await quarterPackagesService.getQuarterPackage(
        selectedSchedule.section.id,
        activeQuarter.activeQuarter as Quarter
      );

      if (quarterPackageData) {
        setQuarterPackage(quarterPackageData);

        // [CHANGE] Role-based status mapping
        let mappedStatus: SubmissionStatus = "Draft";
        const { status } = quarterPackageData;
        if (status === "PENDING") {
          mappedStatus = "Draft";
        } else if (status === "RETURNED") {
          mappedStatus = "Returned";
        } else if (status === "APPROVED" || status === "PUBLISHED") {
          // For advisers on advisory sections, approved packages are forwarded to Admin
          mappedStatus = (profile?.isAdviser && isAdvisorySection) ? "ForwardedToAdmin" : "ForAdviser";
        }
        setSubmissionStatus(mappedStatus);

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
    } finally {
      setLoading(false);
    }
  };

  // [CHANGE] Updated to include new status
  const getStatusIcon = (status: SubmissionStatus) => {
    switch (status) {
      case "Draft":
        return <Clock className="h-5 w-5" />;
      case "Returned":
        return <RotateCcw className="h-5 w-5" />;
      case "ForAdviser":
        return <CheckCircle className="h-5 w-5" />;
      case "ForwardedToAdmin":
        return <UserCheck className="h-5 w-5" />; // Icon for Admin forwarding
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  // [CHANGE] Updated descriptions to handle adviser-specific statuses
  const getStatusDescription = (status: SubmissionStatus) => {
    switch (status) {
      case "Draft":
        return {
          title: "Draft Status",
          description: "Your work is saved privately. You can continue editing anytime. Not yet visible to the adviser.",
          items: [
            "Your work is saved privately.",
            "You can continue editing anytime.",
            "Not yet visible to the adviser."
          ]
        };
      case "Returned":
        return {
          title: "Returned for Revision",
          description: "The adviser reviewed your submission. Revisions are required. You can now edit and resubmit once changes are made.",
          items: [
            "The adviser reviewed your submission.",
            "Revisions are required.",
            "You can now edit and resubmit once changes are made."
          ]
        };
      case "ForAdviser":
        return {
          title: "Submitted to Adviser",
          description: "Your submission is currently with the adviser. Waiting for review and validation. Editing is locked until returned.",
          items: [
            "Your submission is currently with the adviser.",
            "Waiting for review and validation.",
            "Editing is locked until returned."
          ]
        };
      case "ForwardedToAdmin":
        return {
          title: "Forwarded to Admin",
          description: "Your submission (for advisory section) has been forwarded directly to Admin for final validation. Editing is locked.",
          items: [
            "Your submission has been forwarded directly to Admin.",
            "Waiting for final validation.",
            "Editing is locked until returned."
          ]
        };
      default:
        return {
          title: "Unknown Status",
          description: "Status information is not available.",
          items: []
        };
    }
  };

  const statusInfo = getStatusDescription(submissionStatus);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="text-center">Loading status information...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Submission Status</h1>
        <p className="text-muted-foreground mt-2">
          Check the current progress of your quarter package.
        </p>
      </div>

      {!selectedSchedule && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please select a class and subject from the main dashboard first to view submission status.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(submissionStatus)}
              Current Status
            </CardTitle>
            <CardDescription>
              {statusInfo.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <StatusBadge status={submissionStatus} />
              <ul className="list-disc ml-5 text-sm space-y-1">
                {statusInfo.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              {submissionStatus === "Returned" && (
                <Button variant="outline" className="w-full mt-4">
                  Edit & Resubmit
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Package Information</CardTitle>
            <CardDescription>
              Details about your quarter package submission
            </CardDescription>
          </CardHeader>
          <CardContent>
            {quarterPackage ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Package ID:</span>
                  <Badge variant="outline">{quarterPackage.id}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant="secondary">{quarterPackage.status}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Quarter:</span>
                  <Badge variant="outline">{quarterPackage.quarter}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Last Updated:</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(quarterPackage.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                {quarterPackage.remarks && (
                  <div className="mt-4">
                    <span className="text-sm font-medium">Remarks:</span>
                    <p className="text-sm text-muted-foreground mt-1 p-2 bg-gray-50 rounded">
                      {quarterPackage.remarks}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No quarter package found. Please save your work first.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {approvalHistory.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Approval History</CardTitle>
            <CardDescription>
              Track the review process of your quarter package
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {approvalHistory.map((record, index) => (
                <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    {record.action === ApprovalAction.APPROVE ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : record.action === ApprovalAction.RETURN ? (
                      <RotateCcw className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{record.action}</span>
                      <Badge variant="outline" className="text-xs">
                        {new Date(record.createdAt).toLocaleDateString()}
                      </Badge>
                    </div>
                    {record.remarks && (
                      <p className="text-sm text-muted-foreground">{record.remarks}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      By: {record.approver.fullName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
