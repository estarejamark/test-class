"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  IconPlus,
  IconFileDescription,
  IconClock,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { useAuth } from "@/contexts/auth.context";

// Types for correction requests
interface CorrectionRequest {
  id: string;
  recordType: "GRADE" | "ATTENDANCE" | "FEEDBACK";
  description: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  reviewedAt?: string;
  reviewerRemarks?: string;
}

interface CorrectionRequestForm {
  recordType: string;
  description: string;
  reason: string;
}

export function StudentCorrectionRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CorrectionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CorrectionRequestForm>({
    recordType: "",
    description: "",
    reason: "",
  });

  useEffect(() => {
    const fetchCorrectionRequests = async () => {
      try {
        setIsLoading(true);

        // TODO: Replace with actual API call
        // For now, using mock data
        const mockRequests: CorrectionRequest[] = [
          {
            id: "1",
            recordType: "GRADE",
            description: "Mathematics Q1 Grade - Incorrect calculation",
            reason: "The grade shows 85 but should be 92 based on my assignment scores",
            status: "PENDING",
            submittedAt: "2024-01-15T10:30:00Z",
          },
          {
            id: "2",
            recordType: "ATTENDANCE",
            description: "January 10, 2024 - Marked absent but was present",
            reason: "I was in class but the attendance was not recorded properly",
            status: "APPROVED",
            submittedAt: "2024-01-12T14:20:00Z",
            reviewedAt: "2024-01-13T09:15:00Z",
            reviewerRemarks: "Attendance record corrected. Thank you for bringing this to our attention.",
          },
          {
            id: "3",
            recordType: "FEEDBACK",
            description: "Science feedback - Missing assignment reference",
            reason: "The feedback mentions an assignment that I don't recall submitting",
            status: "REJECTED",
            submittedAt: "2024-01-08T16:45:00Z",
            reviewedAt: "2024-01-09T11:30:00Z",
            reviewerRemarks: "Feedback is accurate. Please check your submitted assignments.",
          },
        ];

        setRequests(mockRequests);
      } catch (error) {
        console.error("Error fetching correction requests:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCorrectionRequests();
  }, [user]);

  const handleSubmitRequest = async () => {
    if (!formData.recordType || !formData.description.trim() || !formData.reason.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);

      // TODO: Replace with actual API call
      const newRequest: CorrectionRequest = {
        id: Date.now().toString(),
        recordType: formData.recordType as "GRADE" | "ATTENDANCE" | "FEEDBACK",
        description: formData.description,
        reason: formData.reason,
        status: "PENDING",
        submittedAt: new Date().toISOString(),
      };

      setRequests(prev => [newRequest, ...prev]);

      // Reset form
      setFormData({
        recordType: "",
        description: "",
        reason: "",
      });
      setDialogOpen(false);
    } catch (error) {
      console.error("Error submitting correction request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary"><IconClock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "APPROVED":
        return <Badge variant="default"><IconCheck className="w-3 h-3 mr-1" />Approved</Badge>;
      case "REJECTED":
        return <Badge variant="destructive"><IconX className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRecordTypeLabel = (type: string) => {
    switch (type) {
      case "GRADE":
        return "Grade";
      case "ATTENDANCE":
        return "Attendance";
      case "FEEDBACK":
        return "Feedback";
      default:
        return type;
    }
  };

  if (isLoading) {
    return <DashboardLoading text="Loading correction requests..." />;
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-4">
      <div className="flex flex-col gap-6 py-4 md:py-6 max-w-4xl mx-auto px-4">
        {/* Header with Request Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Record Correction Requests</h1>
            <p className="text-muted-foreground">
              Submit requests to correct grades, attendance, or feedback records
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <IconPlus className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Submit Correction Request</DialogTitle>
                <DialogDescription>
                  Provide details about the record that needs correction. Your request will be reviewed by your teacher and adviser.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="record-type">Record Type</Label>
                  <Select
                    value={formData.recordType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, recordType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select record type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GRADE">Grade</SelectItem>
                      <SelectItem value="ATTENDANCE">Attendance</SelectItem>
                      <SelectItem value="FEEDBACK">Feedback</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Brief description of the issue"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="reason">Reason for Correction</Label>
                  <Textarea
                    id="reason"
                    placeholder="Explain why this correction is needed"
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitRequest}
                  disabled={isSubmitting || !formData.recordType || !formData.description.trim() || !formData.reason.trim()}
                >
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Correction Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconFileDescription className="h-5 w-5" />
              Your Correction Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-8">
                <IconFileDescription className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No correction requests yet</h3>
                <p className="text-muted-foreground mb-4">
                  Submit your first correction request to fix any inaccuracies in your records.
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <IconPlus className="w-4 h-4 mr-2" />
                  Submit First Request
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Reviewed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {getRecordTypeLabel(request.recordType)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={request.description}>
                            {request.description}
                          </div>
                          <div className="text-sm text-muted-foreground truncate" title={request.reason}>
                            {request.reason}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(request.status)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(request.submittedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {request.reviewedAt
                            ? new Date(request.reviewedAt).toLocaleDateString()
                            : "-"
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workflow Information */}
        <Card>
          <CardHeader>
            <CardTitle>How Correction Requests Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-semibold">1</span>
                </div>
                <h4 className="font-medium">Submit Request</h4>
                <p className="text-sm text-muted-foreground">
                  You submit the correction request with details
                </p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-600 font-semibold">2</span>
                </div>
                <h4 className="font-medium">Teacher Review</h4>
                <p className="text-sm text-muted-foreground">
                  Your teacher reviews and may approve or reject
                </p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-purple-600 font-semibold">3</span>
                </div>
                <h4 className="font-medium">Adviser/Admin Final</h4>
                <p className="text-sm text-muted-foreground">
                  Adviser and admin provide final approval
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
