"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, CheckCircle, Clock } from "lucide-react";
import { useAuth } from "@/contexts/auth.context";
import { feedbackService } from "@/services/feedback.service";
import { FeedbackResponse } from "@/types/api";
import { toast } from "sonner";

export default function StudentFeedbackResponses() {
  const { profile } = useAuth();
  const [feedbackResponses, setFeedbackResponses] = useState<FeedbackResponse[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<FeedbackResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<FeedbackResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Filter states
  const [quarterFilter, setQuarterFilter] = useState<string>("all");
  const [reviewedFilter, setReviewedFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchFeedbackResponses();
  }, [profile?.isAdviser, profile?.id]);

  useEffect(() => {
    filterResponses();
  }, [feedbackResponses, quarterFilter, reviewedFilter, searchTerm]);

  const fetchFeedbackResponses = async () => {
    if (!profile?.id) return;

    setIsLoading(true);
    try {
      let responses: FeedbackResponse[] = [];

      if (profile.isAdviser) {
        responses = await feedbackService.getFeedbackWithResponsesForAdviser();
      } else {
        responses = await feedbackService.getFeedbackWithResponsesForTeacher();
      }

      setFeedbackResponses(responses);
    } catch (error) {
      toast.error("Failed to load feedback responses");
      console.error("Error fetching feedback responses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterResponses = () => {
    let filtered = [...feedbackResponses];

    // Filter by quarter
    if (quarterFilter !== "all") {
      filtered = filtered.filter(response => response.quarter === quarterFilter);
    }

    // Filter by reviewed status
    if (reviewedFilter !== "all") {
      const isReviewed = reviewedFilter === "reviewed";
      filtered = filtered.filter(response => response.responseReviewed === isReviewed);
    }

    // Filter by search term (student name or section name)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(response =>
        response.studentName.toLowerCase().includes(term) ||
        response.sectionName.toLowerCase().includes(term)
      );
    }

    setFilteredResponses(filtered);
  };

  const handleMarkReviewed = async (feedbackId: string) => {
    try {
      await feedbackService.markResponseReviewed(feedbackId);

      // Update local state
      setFeedbackResponses(prev =>
        prev.map(response =>
          response.id === feedbackId
            ? { ...response, responseReviewed: true }
            : response
        )
      );

      toast.success("Response marked as reviewed");
    } catch (error) {
      toast.error("Failed to mark response as reviewed");
      console.error("Error marking response as reviewed:", error);
    }
  };

  const openResponseDialog = (response: FeedbackResponse) => {
    setSelectedResponse(response);
    setIsDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Student Feedback Responses</h1>
        <Badge variant="outline">
          {profile?.isAdviser ? "Adviser View" : "Teacher View"}
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quarter</label>
              <Select value={quarterFilter} onValueChange={setQuarterFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select quarter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quarters</SelectItem>
                  <SelectItem value="Q1">Q1</SelectItem>
                  <SelectItem value="Q2">Q2</SelectItem>
                  <SelectItem value="Q3">Q3</SelectItem>
                  <SelectItem value="Q4">Q4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={reviewedFilter} onValueChange={setReviewedFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search by student or section..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback Responses ({filteredResponses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading feedback responses...</div>
          ) : filteredResponses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No feedback responses found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Quarter</TableHead>
                  <TableHead>Response Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResponses.map((response) => (
                  <TableRow key={response.id}>
                    <TableCell className="font-medium">
                      {response.studentName}
                    </TableCell>
                    <TableCell>{response.sectionName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{response.quarter}</Badge>
                    </TableCell>
                    <TableCell>
                      {response.studentResponse ? (
                        <Badge
                          variant={response.responseReviewed ? "default" : "secondary"}
                          className="flex items-center gap-1 w-fit"
                        >
                          {response.responseReviewed ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {response.responseReviewed ? "Reviewed" : "Pending"}
                        </Badge>
                      ) : (
                        <Badge variant="outline">No Response</Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(response.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openResponseDialog(response)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {response.studentResponse && !response.responseReviewed && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkReviewed(response.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Response Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Feedback Response Details</DialogTitle>
          </DialogHeader>
          {selectedResponse && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Student</label>
                  <p className="font-medium">{selectedResponse.studentName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Section</label>
                  <p className="font-medium">{selectedResponse.sectionName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Quarter</label>
                  <Badge variant="outline">{selectedResponse.quarter}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date</label>
                  <p>{formatDate(selectedResponse.createdAt)}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Teacher Feedback</label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  <p>{selectedResponse.feedback}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Student Response</label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  {selectedResponse.studentResponse ? (
                    <p>{selectedResponse.studentResponse}</p>
                  ) : (
                    <p className="text-muted-foreground italic">No response yet</p>
                  )}
                </div>
              </div>

              {selectedResponse.studentResponse && (
                <div className="flex items-center justify-between">
                  <Badge
                    variant={selectedResponse.responseReviewed ? "default" : "secondary"}
                    className="flex items-center gap-1"
                  >
                    {selectedResponse.responseReviewed ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {selectedResponse.responseReviewed ? "Reviewed" : "Pending Review"}
                  </Badge>

                  {!selectedResponse.responseReviewed && (
                    <Button
                      onClick={() => {
                        handleMarkReviewed(selectedResponse.id);
                        setIsDialogOpen(false);
                      }}
                    >
                      Mark as Reviewed
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
