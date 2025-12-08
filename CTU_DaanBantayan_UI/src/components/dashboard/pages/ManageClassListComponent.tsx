"use client";

import React, { useState, useEffect } from "react";
import {
  DataManagementTable,
  TableColumn,
  FormField,
  FilterOption,
  BaseItem,
} from "../DataManagementTable";
import { enrollmentService, EnrolledStudentResponse, UnassignedStudentResponse, StudentWithEnrollmentResponse } from "@/services/enrollment.service";
import { sectionsService } from "@/services/sections.service";
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
import { useAuth } from "@/contexts/auth.context";

// Action types for enrollment management
type EnrollmentAction = 'assignStudent' | 'moveStudent' | 'markInactive' | 'viewParentContacts';

// Student interface extending BaseItem
interface Student extends BaseItem {
  studentId: string;
  studentName: string;
  email: string;
  gradeLevel: string;
  currentSectionId?: string;
  currentSectionName?: string;
  parentName: string;
  parentContact: string;
  enrolledAt?: string;
  schoolYear?: string;
  quarter?: string;
}

// Table columns configuration
const enrolledStudentColumns: TableColumn[] = [
  { key: "studentName", label: "Student Name", searchable: true },
  { key: "email", label: "Email", searchable: true },
  { key: "gradeLevel", label: "Grade Level" },
  { key: "parentName", label: "Parent/Guardian", searchable: true },
  { key: "parentContact", label: "Contact" },
  { key: "enrolledAt", label: "Enrolled Date" },
];

const unassignedStudentColumns: TableColumn[] = [
  { key: "studentName", label: "Student Name", searchable: true },
  { key: "email", label: "Email", searchable: true },
  { key: "gradeLevel", label: "Grade Level" },
  { key: "parentName", label: "Parent/Guardian", searchable: true },
  { key: "parentContact", label: "Contact" },
];

// Custom filtering function for student data
const filterStudents = (students: Student[], filters: Record<string, string>): Student[] => {
  return students.filter((student) => {
    // Grade level filter
    const gradeFilter = filters["gradeLevel"];
    if (gradeFilter && gradeFilter !== "All" && gradeFilter !== "") {
      if (student.gradeLevel !== gradeFilter) {
        return false;
      }
    }

    // Section filter
    const sectionFilter = filters["section"];
    if (sectionFilter && sectionFilter !== "All" && sectionFilter !== "") {
      if (sectionFilter === "Not Assigned") {
        // For "Not Assigned", check if student has no current section
        if (student.currentSectionName || student.currentSectionId) {
          return false;
        }
      } else {
        // For specific sections, match the currentSectionName
        if (student.currentSectionName !== sectionFilter) {
          return false;
        }
      }
    }

    return true;
  });
};

// Dynamic filter options generation
const getStudentFilterOptions = (students: Student[], sections: Array<{ id: string; name: string; gradeLevel: string }>, activeTab: 'enrolled' | 'unassigned' | 'all'): FilterOption[] => {
  // Fixed grade levels from 7 to 12
  const allGradeLevels = ['7', '8', '9', '10', '11', '12'];

  const gradeLevelFilter: FilterOption = {
    key: "gradeLevel",
    label: "Grade Level",
    options: allGradeLevels
  };

  const filters: FilterOption[] = [gradeLevelFilter];

  // Section filter logic based on active tab - only for 'all' tab to avoid redundancy with section selector
  if (activeTab === 'all') {
    // For all students, show all sections plus "Not Assigned"
    const allSectionNames = sections
      .filter(section => section.name && section.gradeLevel)
      .map(section => `${section.gradeLevel}-${section.name}`);
    const sectionOptions = Array.from(new Set([...allSectionNames, "Not Assigned"])).sort();

    const sectionFilter: FilterOption = {
      key: "section",
      label: "Section",
      options: sectionOptions
    };

    filters.push(sectionFilter);
  }

  return filters;
};

// Helper function to format contact number for display (09XX XXX XXXX)
const formatContactNumber = (contactNumber: string | undefined): string => {
  if (!contactNumber || contactNumber.length !== 11 || !contactNumber.startsWith("09")) {
    return contactNumber || "";
  }
  return `${contactNumber.substring(0, 4)} ${contactNumber.substring(4, 7)} ${contactNumber.substring(7)}`;
};

// Badge color function
const getStudentBadgeColor = (key: string, value: unknown) => {
  if (key === "gradeLevel") {
    const gradeNum = parseInt(value as string);
    if (gradeNum <= 8) {
      return "bg-blue-100 text-blue-800";
    } else if (gradeNum <= 10) {
      return "bg-green-100 text-green-800";
    } else {
      return "bg-purple-100 text-purple-800";
    }
  }
  return "bg-gray-100 text-gray-800";
};

interface ManageClassListComponentProps {
  preSelectedSectionId?: string;
}

export function ManageClassListComponent({ preSelectedSectionId }: ManageClassListComponentProps) {
  const { authState } = useAuth();
  const [activeTab, setActiveTab] = useState<'enrolled' | 'unassigned' | 'all'>('enrolled');
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<Array<{ id: string; name: string; gradeLevel: string; studentCount?: number }>>([]);
  const [selectedSection, setSelectedSection] = useState<string>(preSelectedSectionId || 'all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sectionsLoading, setSectionsLoading] = useState(false);

  // Modal states
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [targetSection, setTargetSection] = useState<string>('');

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Automatically load data when tab changes
  useEffect(() => {
    if (activeTab === 'enrolled' && selectedSection) {
      // Validate that the selected section exists in the sections list (skip validation for "all")
      const sectionExists = selectedSection === 'all' || sections.some(section => section.id === selectedSection);
      if (sectionExists) {
        loadData(true); // Skip loading state for smoother UX
      } else {
        console.warn(`Selected section ${selectedSection} not found in sections list`);
        setError(`Selected section is no longer available. Please refresh the page and try again.`);
        setEnrolledStudents([]);
      }
    } else if (activeTab === 'unassigned') {
      loadData(true); // Skip loading state for smoother UX
    } else if (activeTab === 'all') {
      loadData(true); // Skip loading state for smoother UX
    }
  }, [selectedSection, activeTab, sections]);

  // Listen for profile updates and auto-refresh users list
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      console.log("📊 Profile updated event received:", event.detail);
      // Auto-refresh users list when any profile is updated
      loadData(true); // Pass true to skip loading state for smoother UX
    };

    // Add event listener for profile updates
    window.addEventListener(
      "profileUpdated",
      handleProfileUpdate as EventListener
    );

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener(
        "profileUpdated",
        handleProfileUpdate as EventListener
      );
    };
  }, []);

  // Listen for student creation/update events from ManageUsersComponent
  useEffect(() => {
    const handleStudentCreated = (event: CustomEvent) => {
      console.log("👤 Student created/updated event received:", event.detail);
      // Auto-refresh class list when a student is created or updated in Manage Users
      loadData(true); // Pass true to skip loading state for smoother UX
    };

    // Add event listener for student creation/update events
    window.addEventListener(
      "studentCreated",
      handleStudentCreated as EventListener
    );

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener(
        "studentCreated",
        handleStudentCreated as EventListener
      );
    };
  }, []);

  const loadData = async (skipLoading = false) => {
    // Check authentication before loading data
    if (!authState.isAuthenticated) {
      setError("Authentication required. Please log in to access enrollment data.");
      setIsLoading(false);
      return;
    }

    try {
      if (!skipLoading) setIsLoading(true);
      setError(null);

      // Load sections with student counts
      await loadSectionsWithCounts();

      // Load students based on active tab
      if (activeTab === 'enrolled' && selectedSection) {
        try {
          if (selectedSection === 'all') {
            // Load all enrolled students when "All Sections" is selected
            const allResponse = await enrollmentService.getAllStudentsWithEnrollmentStatus();
            const enrolledOnly = allResponse.filter(student => student.currentSectionId !== null);
            setEnrolledStudents(enrolledOnly.map(mapStudentWithEnrollmentResponse));
          } else {
            const enrolledResponse = await enrollmentService.getEnrolledStudents(selectedSection);
            setEnrolledStudents(enrolledResponse.map(mapEnrolledStudentResponse));
          }
        } catch (studentErr) {
          console.warn(`Failed to load enrolled students for section ${selectedSection}:`, studentErr);
          setEnrolledStudents([]); // Set empty array instead of crashing
          setError(`Failed to load enrolled students for the selected section. Please try again.`);
        }
      } else if (activeTab === 'unassigned') {
        try {
          const unassignedResponse = await enrollmentService.getUnassignedStudents();
          setUnassignedStudents(unassignedResponse.map(mapUnassignedStudentResponse));
        } catch (studentErr) {
          console.warn("Failed to load unassigned students:", studentErr);
          setUnassignedStudents([]);
          setError(`Failed to load unassigned students. Please try again.`);
        }
      } else if (activeTab === 'all') {
        try {
          const allResponse = await enrollmentService.getAllStudentsWithEnrollmentStatus();
          setAllStudents(allResponse.map(mapStudentWithEnrollmentResponse));
        } catch (studentErr) {
          console.warn("Failed to load all students:", studentErr);
          setAllStudents([]);
          setError(`Failed to load all students. Please try again.`);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load data";
      setError(errorMessage);
      console.error("Failed to load enrollment data:", err);
    } finally {
      if (!skipLoading) setIsLoading(false);
    }
  };

  const loadSectionsWithCounts = async () => {
    try {
      setSectionsLoading(true);
      const sectionsResponse = await sectionsService.getAllSections();
      const sectionsArray = Array.isArray(sectionsResponse) ? sectionsResponse : [];

      // Load sections without counts to avoid network errors
      const sectionsWithoutCounts = sectionsArray.map(section => ({
        id: section.id,
        name: section.name,
        gradeLevel: section.gradeLevel,
        // Remove studentCount to avoid API calls that may fail
      }));

      setSections(sectionsWithoutCounts);
    } catch (err) {
      console.error("Failed to load sections:", err);
      // Don't set error state for sections loading failure as it's not critical
    } finally {
      setSectionsLoading(false);
    }
  };

  const mapEnrolledStudentResponse = (response: EnrolledStudentResponse): Student => ({
    id: parseInt(response.enrollmentId),
    studentId: response.studentId,
    studentName: response.studentName,
    email: response.email,
    gradeLevel: response.gradeLevel,
    currentSectionName: response.sectionName,
    parentName: response.parentName,
    parentContact: formatContactNumber(response.parentContact),
    enrolledAt: response.enrolledAt,
    schoolYear: response.schoolYear,
    quarter: response.quarter,
  });

  const mapUnassignedStudentResponse = (response: UnassignedStudentResponse): Student => ({
    id: parseInt(response.studentId),
    studentId: response.studentId,
    studentName: response.studentName,
    email: response.email,
    gradeLevel: response.gradeLevel,
    parentName: response.parentName,
    parentContact: formatContactNumber(response.parentContact),
  });

  const mapStudentWithEnrollmentResponse = (response: StudentWithEnrollmentResponse): Student => ({
    id: parseInt(response.studentId),
    studentId: response.studentId,
    studentName: response.studentName,
    email: response.email,
    gradeLevel: response.gradeLevel,
    currentSectionId: response.currentSectionId || undefined,
    currentSectionName: response.currentSectionName || undefined,
    parentName: response.parentName,
    parentContact: formatContactNumber(response.parentContact),
    enrolledAt: response.enrolledAt || undefined,
    schoolYear: response.schoolYear || undefined,
    quarter: response.quarter || undefined,
  });

  const handleAssignStudent = async (student: Student) => {
    if (!targetSection) return;

    try {
      await enrollmentService.assignStudentToSection({
        studentId: student.studentId,
        sectionId: targetSection,
      });
      alert(`Student ${student.studentName} has been assigned to the section successfully.`);
      setAssignModalOpen(false);
      setSelectedStudent(null);
      setTargetSection('');
      loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to assign student";
      setError(errorMessage);
      console.error("Failed to assign student:", err);
    }
  };

  const handleMoveStudent = async (student: Student) => {
    if (!targetSection) return;

    try {
      await enrollmentService.moveStudentToSection({
        studentId: student.studentId,
        newSectionId: targetSection,
      });
      alert(`Student ${student.studentName} has been moved to the new section successfully.`);
      setMoveModalOpen(false);
      setSelectedStudent(null);
      setTargetSection('');
      loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to move student";
      setError(errorMessage);
      console.error("Failed to move student:", err);
    }
  };

  const handleMarkInactive = async (student: Student) => {
    if (!confirm(`Are you sure you want to mark ${student.studentName} as inactive (graduated/transferred)?`)) {
      return;
    }

    try {
      await enrollmentService.markStudentInactive(student.studentId);
      alert(`Student ${student.studentName} has been marked as inactive.`);
      loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to mark student inactive";
      setError(errorMessage);
      console.error("Failed to mark student inactive:", err);
    }
  };

  const handleViewParentContacts = (student: Student) => {
    alert(`Parent/Guardian: ${student.parentName}\nContact: ${student.parentContact}`);
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'enrolled':
        return enrolledStudents;
      case 'unassigned':
        return unassignedStudents;
      case 'all':
        return allStudents;
      default:
        return [];
    }
  };

  const getCurrentColumns = () => {
    return activeTab === 'enrolled' ? enrolledStudentColumns : unassignedStudentColumns;
  };

  // Show loading state
  if (isLoading) {
    return <TableLoading text="Loading enrollment data..." />;
  }

  // Show authentication error
  if (!authState.isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-red-600 text-lg font-semibold">
          Authentication Required
        </div>
        <div className="text-gray-600 text-center">
          You must be logged in to access enrollment data.<br />
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

  // Show error state
  if (error && getCurrentData().length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-red-600 text-lg font-semibold">
          Failed to load enrollment data
        </div>
        <div className="text-gray-600">{error}</div>
        <button
          onClick={() => loadData()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-800 font-medium">Error</div>
          <div className="text-red-600 text-sm">{error}</div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('enrolled')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'enrolled'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}>
              Enrolled Students
            </button>
            <button
              onClick={() => setActiveTab('unassigned')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'unassigned'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}>
              Unassigned Students
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}>
              All Students
            </button>
          </nav>
        </div>
      </div>

      {/* Section Selector for Enrolled Students */}
      {activeTab === 'enrolled' && (
        <div className="mb-4 ml-4">
          <Label htmlFor="section-select" className="block mb-2 font-medium">Select Section:</Label>
          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Choose a section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {sections
                .filter(section => !section.name.toLowerCase().includes('all'))
                .map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.gradeLevel}-{section.name} {section.studentCount !== undefined ? `(${section.studentCount} students)` : ''}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <DataManagementTable
        title={`Manage Class List - ${activeTab === 'enrolled' ? 'Enrolled Students' : activeTab === 'unassigned' ? 'Unassigned Students' : 'All Students'}`}
        description="Manage student enrollment in class sections, including assignment, transfers, and parent contact information."
        data={getCurrentData()}
        columns={getCurrentColumns()}
        formFields={[]} // No form fields for this component
        filterOptions={getStudentFilterOptions(getCurrentData(), sections, activeTab)}
        onRefresh={() => loadData()}
        searchPlaceholder="Search students..."
        addButtonText=""
        editModalTitle=""
        addModalTitle=""
        editModalDescription=""
        addModalDescription=""
        getBadgeColor={getStudentBadgeColor}
        actions={{
          edit: false,
          statusToggle: false,
          delete: false,
          changeEmail: false,
          resetPassword: false,
          resetOtp: false,
          assignStudent: activeTab === 'unassigned' || activeTab === 'all',
          moveStudent: activeTab === 'enrolled' || activeTab === 'all',
          markInactive: activeTab === 'enrolled' || activeTab === 'all',
          viewParentContacts: true,
        }}
        onAssignStudent={(student) => {
          setSelectedStudent(student as Student);
          setAssignModalOpen(true);
        }}
        onMoveStudent={(student) => {
          setSelectedStudent(student as Student);
          setMoveModalOpen(true);
        }}
        onMarkInactive={(student) => handleMarkInactive(student as Student)}
        onViewParentContacts={(student) => handleViewParentContacts(student as Student)}
      />

      {/* Assign Student Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Student to Section</DialogTitle>
            <DialogDescription>
              Select a section to assign {selectedStudent?.studentName} to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="target-section">Target Section:</Label>
              <Select value={targetSection} onValueChange={setTargetSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.gradeLevel}-{section.name} {section.studentCount !== undefined ? `(${section.studentCount} students)` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => selectedStudent && handleAssignStudent(selectedStudent)}
                disabled={!targetSection}>
                Assign Student
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move Student Modal */}
      <Dialog open={moveModalOpen} onOpenChange={setMoveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Student to Another Section</DialogTitle>
            <DialogDescription>
              Select a new section to move {selectedStudent?.studentName} to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-section">New Section:</Label>
              <Select value={targetSection} onValueChange={setTargetSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a section" />
                </SelectTrigger>
                <SelectContent>
                  {sections
                    .filter(section => section.id !== selectedStudent?.currentSectionId)
                    .map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.gradeLevel}-{section.name} {section.studentCount !== undefined ? `(${section.studentCount} students)` : ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setMoveModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => selectedStudent && handleMoveStudent(selectedStudent)}
                disabled={!targetSection}>
                Move Student
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
