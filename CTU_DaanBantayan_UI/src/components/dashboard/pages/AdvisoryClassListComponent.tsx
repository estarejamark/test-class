"use client";

import React, { useState, useEffect, useMemo } from "react";
import { adviserService } from "@/services/adviser.service";
import { profilesService } from "@/services/profiles.service";
import { sectionsService } from "@/services/sections.service";
import { settingsService } from "@/services/settings.service";
import { StudentResponse, Profile, Gender, SectionResponse, NotificationTemplate, GradeResponse } from "@/types/api";
import { SchoolYear } from "@/types/settings";
import { useAuth } from "@/contexts/auth.context";
import { Role } from "@/types/auth";
import { TableLoading } from "@/components/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Phone, MessageSquare, UserCheck, Clock, GraduationCap, Save, BarChart3, CheckCircle, Send } from "lucide-react";


// Status types for students
type StudentStatus = "Active" | "Pending Update" | "Graduated";

// Extended student interface with additional computed fields
interface AdvisoryStudent extends StudentResponse {
  fullName: string;
  genderDisplay: "M" | "F";
  status: StudentStatus;
  parentName: string;
  parentContact: string;
  lrn: string;
}

// Helper function to format contact number for display (09XX XXX XXXX)
const formatContactNumber = (contactNumber: string): string => {
  if (!contactNumber || contactNumber.length !== 11 || !contactNumber.startsWith("09")) {
    return contactNumber || "";
  }
  return `${contactNumber.substring(0, 4)} ${contactNumber.substring(4, 7)} ${contactNumber.substring(7)}`;
};

// Badge color function
const getStudentBadgeColor = (key: string, value: unknown) => {
  if (key === "status") {
    switch (value) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Pending Update":
        return "bg-yellow-100 text-yellow-800";
      case "Graduated":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }
  return "bg-gray-100 text-gray-800";
};



// Helper function for contact actions


export function AdvisoryClassListComponent() {
  const { authState } = useAuth();

  // Check if user is an adviser (teacher with adviser privileges or dedicated adviser role)
  if ((authState.user?.role !== Role.TEACHER || !authState.profile?.isAdviser) && authState.user?.role !== Role.ADVISER) {
    return <p className="text-center text-red-500 mt-10">Access denied. This page is for advisers only.</p>;
  }

  const [students, setStudents] = useState<AdvisoryStudent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<AdvisoryStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StudentStatus | "All">("All");
  const [sortBy, setSortBy] = useState<"lastName" | "firstName" | "studentId" | "gender">("lastName");

  // Modal states
  const [suggestModalOpen, setSuggestModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<AdvisoryStudent | null>(null);
  const [suggestionText, setSuggestionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SMS Grades modal states
  const [smsGradesModalOpen, setSmsGradesModalOpen] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState<string>("");
  const [customMessage, setCustomMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<NotificationTemplate[]>([]);
  const [studentGrades, setStudentGrades] = useState<GradeResponse[]>([]);
  const [isSendingSms, setIsSendingSms] = useState(false);

  // Adviser section and school year states
  const [adviserSection, setAdviserSection] = useState<SectionResponse | null>(null);
  const [activeSchoolYear, setActiveSchoolYear] = useState<SchoolYear | null>(null);

  // Pending suggestions state (persisted in localStorage)
  const [pendingSuggestions, setPendingSuggestions] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('advisory_pending_suggestions');
      return stored ? JSON.parse(stored) : {};
    }
    return {};
  });

  // Sync pending suggestions to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('advisory_pending_suggestions', JSON.stringify(pendingSuggestions));
    }
  }, [pendingSuggestions]);

  // Load adviser section and school year
  const loadAdviserInfo = async () => {
    if (!authState.isAuthenticated) return;

    try {
      // Load adviser's section directly using the adviser API
      const sectionInfo = await adviserService.getAdviserSectionInfo();
      if (sectionInfo) {
        setAdviserSection({
          id: sectionInfo.id,
          name: sectionInfo.name,
          gradeLevel: sectionInfo.gradeLevel,
          adviser: sectionInfo.adviser
        });
      }

      // Load active school year
      const schoolYear = await settingsService.getActiveSchoolYear();
      if (schoolYear) {
        setActiveSchoolYear(schoolYear);
      }
    } catch (err) {
      console.warn("Failed to load adviser info:", err);
      // Continue with default values if loading fails
    }
  };

  // Adviser info from auth context and fetched data
  const adviserInfo = useMemo(() => {
    const profile = authState.profile;
    const adviserName = profile
      ? `${profile.firstName} ${profile.middleName ? profile.middleName + ' ' : ''}${profile.lastName}`
      : "Adviser";

    const section = adviserSection
      ? `${adviserSection.gradeLevel} – ${adviserSection.name}`
      : "Section"; // Fallback

    const schoolYear = activeSchoolYear
      ? activeSchoolYear.yearRange
      : "2025–2026"; // Fallback

    return {
      name: adviserName,
      section,
      schoolYear
    };
  }, [authState.profile, adviserSection, activeSchoolYear]);

  // Load adviser info and advisory class list
  useEffect(() => {
    loadAdviserInfo();
    loadAdvisoryClassList();
  }, []);

  // Filter and sort students when dependencies change
  useEffect(() => {
    filterAndSortStudents();
  }, [students, searchQuery, statusFilter, sortBy]);

  // Load notification templates when SMS modal opens
  useEffect(() => {
    if (smsGradesModalOpen && selectedStudent) {
      loadNotificationTemplates();
    }
  }, [smsGradesModalOpen, selectedStudent]);

  const loadNotificationTemplates = async () => {
    try {
      const templates = await settingsService.getAllTemplates();
      setAvailableTemplates(templates);
    } catch (err) {
      console.warn("Failed to load notification templates:", err);
    }
  };

  const loadAdvisoryClassList = async () => {
    if (!authState.isAuthenticated) {
      setError("Authentication required. Please log in to access advisory class list.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await adviserService.getAdvisoryClassList();

      // Check if there's an error message
      if (response.message !== "Advisory class retrieved successfully" && response.data.length === 0) {
        setError(response.message);
        setStudents([]);
        return;
      }

      // Transform the data to include computed fields and fetch profile data
      const transformedStudents: AdvisoryStudent[] = await Promise.all(
        response.data.map(async (student) => {
          let profile: Profile | null = null;
          let genderDisplay: "M" | "F" = "M"; // Default to M
          let parentName = "Not Available";
          let parentContact = "Not Available";
          let lrn = "Not Available";

          try {
            // Fetch profile data if profileId exists
            if (student.profileId) {
              profile = await profilesService.getProfileById(student.profileId);
              genderDisplay = profile.gender === Gender.MALE ? "M" : "F";
              parentName = profile.parentName || "Not Available";
              parentContact = profile.parentContact || "Not Available";
              lrn = profile.lrn || "Not Available";
            }
          } catch (profileErr) {
            console.warn(`Failed to fetch profile for student ${student.studentId}:`, profileErr);
            // Continue with default values if profile fetch fails
          }

          // Determine student status based on activity and pending suggestions
          let status: StudentStatus = "Graduated"; // Default
          if (student.isActive) {
            // Check if student has pending suggestions by fetching from API
            try {
              const suggestions = await adviserService.getPendingSuggestionsForStudent(student.studentId);
              const hasPendingSuggestion = suggestions.length > 0;
              status = hasPendingSuggestion ? "Pending Update" : "Active";

              // Update pending suggestions state
              if (hasPendingSuggestion) {
                setPendingSuggestions(prev => ({
                  ...prev,
                  [student.studentId]: suggestions[0] // Take the first suggestion
                }));
              }
            } catch (suggestionErr) {
              console.warn(`Failed to fetch suggestions for student ${student.studentId}:`, suggestionErr);
              status = "Active"; // Default to active if suggestions can't be fetched
            }
          }

          return {
            ...student,
            fullName: `${student.lastName}, ${student.firstName}${student.middleName ? ` ${student.middleName}` : ""}`,
            genderDisplay,
            status,
            parentName,
            parentContact,
            lrn
          };
        })
      );

      setStudents(transformedStudents);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load advisory class list";

      // Handle specific case where adviser has no section assigned
      if (errorMessage.includes("No section found for adviser")) {
        setError("You are not currently assigned to any section. Please contact an administrator to assign you as an adviser to a section.");
      } else {
        setError(errorMessage);
      }
      console.error("Failed to load advisory class list:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortStudents = () => {
    let filtered = [...students];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(student =>
        student.fullName.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        student.studentId.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter(student => student.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "lastName":
          return a.lastName.localeCompare(b.lastName);
        case "firstName":
          return a.firstName.localeCompare(b.firstName);
        case "studentId":
          return a.studentId.localeCompare(b.studentId);
        case "gender":
          return a.genderDisplay.localeCompare(b.genderDisplay);
        default:
          return 0;
      }
    });

    setFilteredStudents(filtered);
  };

  const handleSuggestUpdate = async () => {
    if (!selectedStudent || !suggestionText.trim()) return;

    try {
      setIsSubmitting(true);
      await adviserService.suggestAdvisoryClassUpdate(selectedStudent.studentId, {
        suggestion: suggestionText
      });

      // Store the suggestion in localStorage
      setPendingSuggestions(prev => ({
        ...prev,
        [selectedStudent.studentId]: suggestionText
      }));

      // Update student status to pending update
      setStudents(prev => prev.map(student =>
        student.studentId === selectedStudent.studentId
          ? { ...student, status: "Pending Update" as StudentStatus }
          : student
      ));

      // Reset modal
      setSuggestModalOpen(false);
      setSelectedStudent(null);
      setSuggestionText("");

      alert("Suggestion submitted successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit suggestion";
      alert(`Error: ${errorMessage}`);
      console.error("Failed to submit suggestion:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactAction = (action: "copy" | "sms", contactNumber: string) => {
    switch (action) {
      case "copy":
        navigator.clipboard.writeText(contactNumber);
        alert("Contact number copied to clipboard!");
        break;
      case "sms":
        // Implement SMS functionality using sms: URL scheme
        if (contactNumber && contactNumber.trim()) {
          const smsUrl = `sms:${contactNumber}`;
          window.location.href = smsUrl;
        } else {
          alert("No contact number available for SMS.");
        }
        break;
    }
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const total = filteredStudents.length;
    const active = filteredStudents.filter(s => s.status === "Active").length;
    const pendingUpdate = filteredStudents.filter(s => s.status === "Pending Update").length;
    const graduated = filteredStudents.filter(s => s.status === "Graduated").length;

    return { total, active, pendingUpdate, graduated };
  }, [filteredStudents]);

  // Show loading state
  if (isLoading) {
    return <TableLoading text="Loading advisory class list..." />;
  }

  // Show authentication error
  if (!authState.isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-red-600 text-lg font-semibold">Authentication Required</div>
        <div className="text-gray-600 text-center">
          You must be logged in to access advisory class data.<br />
          Please log in to continue.
        </div>
        <button
          onClick={() => window.location.href = '/login'}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Header */}
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Advisory Class List</h2>
            <p className="text-muted-foreground">
              {adviserInfo.section} - {adviserInfo.name} - {adviserInfo.schoolYear}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Access common advisory tasks and tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => window.open('/dashboard/save-options', '_blank')}>
                <Save className="h-4 w-4 mr-2" />
                Save Options
              </Button>
              <Button variant="outline" onClick={() => window.open('/dashboard/status', '_blank')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Status
              </Button>
              <Button variant="outline" onClick={() => window.open('/dashboard/validate-records', '_blank')}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Validate Records
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Student Statistics</CardTitle>
            <CardDescription>Overview of student enrollment and status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summaryStats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active</CardTitle>
                  <UserCheck className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {summaryStats.active}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Update</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {summaryStats.pendingUpdate}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Graduated</CardTitle>
                  <GraduationCap className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-600">
                    {summaryStats.graduated}
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800 font-medium">Error</div>
          <div className="text-red-600 text-sm">{error}</div>
        </div>
      )}

      {/* Search & Filters Bar */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Search & Filters</CardTitle>
            <CardDescription>Find and organize students by name, status, or other criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <Label htmlFor="search" className="sr-only">Search student name</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search student name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="w-full md:w-48">
                <Label htmlFor="status-filter" className="sr-only">Status</Label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StudentStatus | "All")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Pending Update">Pending Update</SelectItem>
                    <SelectItem value="Graduated">Graduated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="w-full md:w-48">
                <Label htmlFor="sort-by" className="sr-only">Sort By</Label>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lastName">Last Name A-Z</SelectItem>
                    <SelectItem value="firstName">First Name A-Z</SelectItem>
                    <SelectItem value="studentId">ID Number</SelectItem>
                    <SelectItem value="gender">Gender</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student List */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Student List</CardTitle>
            <CardDescription>
              Manage and view student information, contact details, and status
            </CardDescription>
          </CardHeader>
          <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent/Guardian</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Number</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student, index) => (
                  <tr key={student.studentId} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.studentId}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.fullName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.genderDisplay}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.parentName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <span>{formatContactNumber(student.parentContact)}</span>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleContactAction("copy", student.parentContact)}
                            className="h-6 w-6 p-0"
                          >
                            <Phone className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleContactAction("sms", student.parentContact)}
                            className="h-6 w-6 p-0"
                          >
                            <MessageSquare className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge className={getStudentBadgeColor("status", student.status)}>
                        {student.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedStudent(student);
                            setSmsGradesModalOpen(true);
                          }}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Send Grades
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedStudent(student);
                            setSuggestModalOpen(true);
                          }}
                        >
                          Suggest
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No students found matching the current filters.
            </div>
          )}
        </CardContent>
      </Card>
  </div>

      {/* Suggest Update Modal */}
      <Dialog open={suggestModalOpen} onOpenChange={setSuggestModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Suggest Student Information Update</DialogTitle>
            <DialogDescription>
              Student: {selectedStudent?.fullName}<br />
              Section: {adviserInfo.section}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="suggestion">Suggestion Details</Label>
              <Textarea
                id="suggestion"
                placeholder="Describe the changes you want to suggest (e.g., update parent contact number, change parent name, etc.)"
                value={suggestionText}
                onChange={(e) => setSuggestionText(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSuggestModalOpen(false);
                  setSelectedStudent(null);
                  setSuggestionText("");
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSuggestUpdate}
                disabled={!suggestionText.trim() || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Suggestion"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* SMS Grades Modal */}
      <Dialog open={smsGradesModalOpen} onOpenChange={setSmsGradesModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Send Quarter Grades via SMS</DialogTitle>
            <DialogDescription>
              Student: {selectedStudent?.fullName}<br />
              Parent: {selectedStudent?.parentName}<br />
              Contact: {formatContactNumber(selectedStudent?.parentContact || "")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="quarter">Select Quarter</Label>
              <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose quarter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Q1">Quarter 1</SelectItem>
                  <SelectItem value="Q2">Quarter 2</SelectItem>
                  <SelectItem value="Q3">Quarter 3</SelectItem>
                  <SelectItem value="Q4">Quarter 4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="template">Message Template</Label>
              <Select
                value={selectedTemplate?.id?.toString() || ""}
                onValueChange={(value) => {
                  const template = availableTemplates.find(t => t.id.toString() === value);
                  setSelectedTemplate(template || null);
                  if (template) {
                    setCustomMessage(template.content);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose template" />
                </SelectTrigger>
                <SelectContent>
                  {availableTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="message">Custom Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your message..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={6}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSmsGradesModalOpen(false);
                  setSelectedStudent(null);
                  setSelectedQuarter("");
                  setCustomMessage("");
                  setSelectedTemplate(null);
                  setStudentGrades([]);
                }}
                disabled={isSendingSms}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // Handle SMS sending logic here
                  if (selectedStudent && selectedQuarter && customMessage.trim()) {
                    const smsUrl = `sms:${selectedStudent.parentContact}?body=${encodeURIComponent(customMessage)}`;
                    window.location.href = smsUrl;
                    setSmsGradesModalOpen(false);
                    setSelectedStudent(null);
                    setSelectedQuarter("");
                    setCustomMessage("");
                    setSelectedTemplate(null);
                    setStudentGrades([]);
                  } else {
                    alert("Please select a quarter and enter a message.");
                  }
                }}
                disabled={!selectedQuarter || !customMessage.trim() || isSendingSms}
              >
                {isSendingSms ? "Sending..." : "Send SMS"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
