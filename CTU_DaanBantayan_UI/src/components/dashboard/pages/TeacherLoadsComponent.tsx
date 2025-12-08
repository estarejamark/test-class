"use client";

import {
  DataManagementTable,
  TableColumn,
  FormField,
  FilterOption,
  BaseItem,
} from "../DataManagementTable";
import { Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { schedulesService } from "@/services/schedules.service";
import { usersService } from "@/services/users.service";
import { subjectsService } from "@/services/subjects.service";
import { sectionsService } from "@/services/sections.service";
import { Profile, Subject, Section, CreateScheduleRequest, CreateScheduleByIdRequest, UpdateScheduleByIdRequest, ApiPaginatedResponse } from "@/types/api";
import { DeleteConfirmationDialog } from "../DeleteConfirmationDialog";

// Teacher Load interface (using string ID to match API UUIDs)
interface TeacherLoad {
  id: string;
  teacherName: string;
  subjectName: string;
  sectionName: string;
  days: string;
  startTime: string;
  endTime: string;
  teacherId?: string;
  subjectId?: string;
  sectionId?: string;
}

// Define table columns
const columns: TableColumn[] = [
  {
    key: "teacherName",
    label: "Teacher Name",
    searchable: true,
  },
  {
    key: "subjectName",
    label: "Subject",
    searchable: true,
    render: (value: unknown) => (
      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
        {value as string}
      </span>
    ),
  },
  {
    key: "sectionName",
    label: "Section",
    searchable: true,
    render: (value: unknown) => (
      <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
        {value as string}
      </span>
    ),
  },
  {
    key: "days",
    label: "Days",
    searchable: true,
    render: (value: unknown) => (
      <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10">
        {value as string}
      </span>
    ),
  },
  {
    key: "schedule",
    label: "Schedule",
    render: (_: unknown, item: unknown) => {
      const teacherLoad = item as TeacherLoad;
      const formatTime = (time: string) => {
        const [hours, minutes] = time.split(":");
        const hour12 = parseInt(hours) % 12 || 12;
        const ampm = parseInt(hours) >= 12 ? "PM" : "AM";
        return `${hour12}:${minutes} ${ampm}`;
      };

      return (
        <div className="flex items-center gap-1 text-sm">
          <Clock className="h-3 w-3" />
          {formatTime(teacherLoad.startTime)} -{" "}
          {formatTime(teacherLoad.endTime)}
        </div>
      );
    },
  },
];

// Define form fields (will be populated with dynamic data)
const getFormFields = (
  teachers: { value: string; label: string }[],
  subjects: { value: string; label: string }[],
  sections: { value: string; label: string }[]
): FormField[] => [
  {
    key: "teacherId",
    label: "Teacher",
    type: "select",
    required: true,
    options: teachers,
  },
  {
    key: "subjectId",
    label: "Subject",
    type: "select",
    required: true,
    options: subjects,
  },
  {
    key: "sectionId",
    label: "Section",
    type: "select",
    required: true,
    options: sections,
  },
  {
    key: "days",
    label: "Days",
    type: "select",
    required: true,
    options: [
      { value: "MWF", label: "Monday, Wednesday, Friday" },
      { value: "TTH", label: "Tuesday, Thursday" },
      { value: "MW", label: "Monday, Wednesday" },
      { value: "TF", label: "Tuesday, Friday" },
      { value: "M", label: "Monday" },
      { value: "T", label: "Tuesday" },
      { value: "W", label: "Wednesday" },
      { value: "TH", label: "Thursday" },
      { value: "F", label: "Friday" },
      { value: "S", label: "Saturday" },
    ],
  },
  {
    key: "startTime",
    label: "Start Time",
    type: "time",
    required: true,
  },
  {
    key: "endTime",
    label: "End Time",
    type: "time",
    required: true,
  },
];

// Define filter options
const getFilterOptions = (
  teachers: { value: string; label: string }[],
  subjects: { value: string; label: string }[],
  sections: { value: string; label: string }[]
): FilterOption[] => [
  {
    key: "teacherId",
    label: "Teacher",
    options: teachers,
  },
  {
    key: "subjectId",
    label: "Subject",
    options: subjects,
  },
  {
    key: "sectionId",
    label: "Section",
    options: sections,
  },
  {
    key: "days",
    label: "Days",
    options: [
      { value: "MWF", label: "Monday, Wednesday, Friday" },
      { value: "TTH", label: "Tuesday, Thursday" },
      { value: "MW", label: "Monday, Wednesday" },
      { value: "TF", label: "Tuesday, Friday" },
      { value: "M", label: "Monday" },
      { value: "T", label: "Tuesday" },
      { value: "W", label: "Wednesday" },
      { value: "TH", label: "Thursday" },
      { value: "F", label: "Friday" },
      { value: "S", label: "Saturday" },
    ],
  },
];

export default function TeacherLoadsComponent() {
  const [teacherLoads, setTeacherLoads] = useState<TeacherLoad[]>([]);
  const [teachers, setTeachers] = useState<{ value: string; label: string }[]>([]);
  const [subjects, setSubjects] = useState<{ value: string; label: string }[]>([]);
  const [sections, setSections] = useState<{ value: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teacherLoadToDelete, setTeacherLoadToDelete] = useState<TeacherLoad | null>(null);

  // Helper function to convert time string to ISO 8601 datetime
  const convertTimeToDateTime = (timeString: string): string => {
    const today = new Date();
    const [hours, minutes] = timeString.split(':');

    // Create a new date object with today's date and the selected time
    // Use local timezone to avoid timezone conversion issues
    const dateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(),
                              parseInt(hours), parseInt(minutes), 0, 0);

    // Format as ISO string but preserve local time by not converting to UTC
    const year = dateTime.getFullYear();
    const month = String(dateTime.getMonth() + 1).padStart(2, '0');
    const day = String(dateTime.getDate()).padStart(2, '0');
    const hours24 = String(dateTime.getHours()).padStart(2, '0');
    const minutesStr = String(dateTime.getMinutes()).padStart(2, '0');
    const seconds = String(dateTime.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours24}:${minutesStr}:${seconds}`;
  };

  // Load initial data
  useEffect(() => {
    loadInitialData();
    loadTeacherLoads();
  }, []);

  const loadInitialData = async () => {
    try {
      const [teachersResponse, subjectsData, sectionsData] = await Promise.all([
        usersService.getAllSystemUsers({ role: "TEACHER", size: 1000 }),
        subjectsService.getAllSubjects(),
        sectionsService.getAllSections(),
      ]);

      console.log("🔍 Debug - Teachers API Response:", teachersResponse);
      console.log("🔍 Debug - Number of system users:", teachersResponse.content?.length || 0);
      console.log("🔍 Debug - First user structure:", teachersResponse.content?.[0]);

      // Transform teachers data - access the content property with validation
      let teacherOptions: { value: string; label: string }[] = [];
      if (teachersResponse.content && Array.isArray(teachersResponse.content)) {
        teacherOptions = teachersResponse.content
          .filter((user: any) => user.role === "TEACHER" && user.profile)
          .map((user: any) => {
            const displayName = user.profile?.firstName && user.profile?.lastName
              ? `${user.profile.firstName} ${user.profile.lastName}`
              : user.email || "No Name";
            return {
              value: user.profile.id,
              label: displayName,
            };
          });
      } else {
        console.error("❌ Teachers API response does not have valid content array:", teachersResponse);
      }

      console.log("🔍 Debug - Filtered teacher options:", teacherOptions);

      // Transform subjects data with validation
      let subjectOptions: { value: string; label: string }[] = [];
      if (Array.isArray(subjectsData)) {
        subjectOptions = subjectsData.map((subject: Subject) => ({
          value: subject.id,
          label: `${subject.subjectCode} - ${subject.name}`,
        }));
      } else {
        console.error("❌ Subjects API response is not a valid array:", subjectsData);
      }

      // Transform sections data with validation
      let sectionOptions: { value: string; label: string }[] = [];
      if (Array.isArray(sectionsData)) {
        sectionOptions = sectionsData.map((section: Section) => ({
          value: section.id,
          label: `${section.name} (${section.gradeLevel})`,
        }));
      } else {
        console.error("❌ Sections API response is not a valid array:", sectionsData);
      }

      setTeachers(teacherOptions);
      setSubjects(subjectOptions);
      setSections(sectionOptions);
    } catch (err) {
      console.error("Failed to load initial data:", err);
    }
  };

  const loadTeacherLoads = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const schedules = await schedulesService.getAllSchedules();

      // Transform schedules to teacher loads format
      const teacherLoads: TeacherLoad[] = schedules.map((schedule, index) => ({
        id: schedule.id, // Use the actual UUID from the API
        teacherName: `${schedule.teacher.firstName} ${schedule.teacher.lastName}`,
        subjectName: schedule.subject.name,
        sectionName: schedule.section.name,
        days: schedule.days,
        startTime: schedule.startTime, // Backend returns HH:mm format directly
        endTime: schedule.endTime, // Backend returns HH:mm format directly
        teacherId: schedule.teacher.id,
        subjectId: schedule.subject.id,
        sectionId: schedule.section.id,
      }));

      setTeacherLoads(teacherLoads);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load teacher loads";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTeacherLoad = async (data: Record<string, unknown>) => {
    try {
      setError(null);

      const scheduleData: CreateScheduleByIdRequest = {
        teacherId: data.teacherId as string,
        subjectId: data.subjectId as string,
        sectionId: data.sectionId as string,
        days: data.days as string,
        startTime: convertTimeToDateTime(data.startTime as string),
        endTime: convertTimeToDateTime(data.endTime as string),
      };

      await schedulesService.createScheduleByIds(scheduleData);
      await loadTeacherLoads(); // Refresh the list
    } catch (err) {
      let errorMessage = "Failed to add teacher load";

      if (err instanceof Error) {
        // Handle schedule conflict errors first
        if (err.message.includes('Schedule conflict:')) {
          // Use the specific error message from the backend and add suggestion
          errorMessage = `${err.message}. Please choose a different time or day.`;
        }
        // Handle network connectivity errors
        else if (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('connection')) {
          errorMessage = "Network error: Please check your internet connection and try again.";
        } else if (err.message.includes('timeout')) {
          errorMessage = "Request timed out: The server is taking too long to respond. Please try again.";
        } else if (err.message.includes('404')) {
          errorMessage = "Service not found: Please contact your administrator.";
        } else if (err.message.includes('500')) {
          errorMessage = "Server error: Please try again later or contact your administrator.";
        } else if (err.message.includes('401') || err.message.includes('403')) {
          errorMessage = "Authentication error: Please refresh the page and log in again.";
        } else {
          // Use the specific error message from the API
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const handleEditTeacherLoad = async (id: string | number, data: Record<string, unknown>) => {
    try {
      setError(null);

      // Find the original schedule to get the correct UUID
      const originalSchedule = teacherLoads.find(load => load.id === (typeof id === 'number' ? id.toString() : id));

      if (!originalSchedule) {
        throw new Error("Schedule not found. Please refresh the page and try again.");
      }

      const scheduleData: UpdateScheduleByIdRequest = {
        teacherId: data.teacherId as string,
        subjectId: data.subjectId as string,
        sectionId: data.sectionId as string,
        days: data.days as string,
        startTime: convertTimeToDateTime(data.startTime as string),
        endTime: convertTimeToDateTime(data.endTime as string),
      };

      try {
        await schedulesService.updateScheduleByIds(originalSchedule.id, scheduleData);
        await loadTeacherLoads(); // Refresh the list
      } catch (err) {
        if (err instanceof Error) {
          const errorMsg = err.message.toLowerCase();
          let conflictMessage = "";

          // Case 1: Time slot overlap
          if (errorMsg.includes('time slot overlap')) {
            conflictMessage = `Schedule conflict: The section already has a class scheduled from ${data.startTime} to ${data.endTime} on ${data.days}.`;
          }
          // Case 2: Multiple subjects
          else if (errorMsg.includes('multiple subjects')) {
            conflictMessage = `Schedule conflict: Cannot assign multiple subjects to the same section at the same time slot.`;
          }
          // Case 3: Teacher teaching different sections
          else if (errorMsg.includes('teaching different sections')) {
            conflictMessage = `Schedule conflict: The teacher is already assigned to teach another section at this time slot.`;
          }
          // Case 4: Maximum teaching hours
          else if (errorMsg.includes('maximum allowed hours')) {
            conflictMessage = `Schedule conflict: The teacher has reached the maximum allowed teaching hours (6) for this day.`;
          }
          // Case 5: Insufficient gap
          else if (errorMsg.includes('insufficient gap')) {
            conflictMessage = `Schedule conflict: There must be at least a 15-minute gap between classes for the teacher.`;
          }
          // Default conflict message
          else if (errorMsg.includes('conflict')) {
            conflictMessage = `Schedule conflict: ${err.message}`;
          } else {
            throw err; // Re-throw non-conflict errors
          }

          throw new Error(conflictMessage);
        }
        throw err;
      }
    } catch (err) {
      let errorMessage = "Failed to update teacher load";

      if (err instanceof Error) {
        // Handle schedule conflict errors first
        if (err.message.includes('Schedule conflict:') || 
            err.message.includes('Cannot update schedule:') ||
            err.message.includes('Insufficient time gap')) {
          errorMessage = err.message; // Use the complete error message from the backend
        }
        // Handle network connectivity errors
        else if (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('connection')) {
          errorMessage = "Network error: Please check your internet connection and try again.";
        } else if (err.message.includes('timeout')) {
          errorMessage = "Request timed out: The server is taking too long to respond. Please try again.";
        } else if (err.message.includes('404')) {
          errorMessage = "Schedule not found: The item may have been deleted by another user.";
        } else if (err.message.includes('500')) {
          errorMessage = "Server error: Please try again later or contact your administrator.";
        } else if (err.message.includes('401') || err.message.includes('403')) {
          errorMessage = "Authentication error: Please refresh the page and log in again.";
        } else {
          // Use the specific error message from the API
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const handleDeleteTeacherLoad = (id: string | number) => {
    const teacherLoad = teacherLoads.find(load => load.id === (typeof id === 'number' ? id.toString() : id));
    if (teacherLoad) {
      setTeacherLoadToDelete(teacherLoad);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!teacherLoadToDelete) return;

    try {
      setError(null);

      // First, delete from the server
      await schedulesService.deleteSchedule(teacherLoadToDelete.id);

      // Then refresh the list from the server to ensure consistency
      await loadTeacherLoads();

      console.log(`✅ Successfully deleted teacher load with ID: ${teacherLoadToDelete.id}`);
    } catch (err) {
      console.error(`❌ Failed to delete teacher load with ID: ${teacherLoadToDelete.id}`, err);

      let errorMessage = "Failed to delete teacher load";

      if (err instanceof Error) {
        // Handle network connectivity errors
        if (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('connection')) {
          errorMessage = "Network error: Please check your internet connection and try again.";
        } else if (err.message.includes('timeout')) {
          errorMessage = "Request timed out: The server is taking too long to respond. Please try again.";
        } else if (err.message.includes('404')) {
          errorMessage = "Schedule not found: The item may have already been deleted.";
        } else if (err.message.includes('500')) {
          errorMessage = "Server error: Please try again later or contact your administrator.";
        } else if (err.message.includes('401') || err.message.includes('403')) {
          errorMessage = "Authentication error: Please refresh the page and log in again.";
        } else {
          // Use the specific error message from the API
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setDeleteDialogOpen(false);
      setTeacherLoadToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setTeacherLoadToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teacher loads...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isScheduleConflict = error.includes('Schedule conflict:') || 
                              error.includes('Cannot update schedule:') ||
                              error.includes('Insufficient time gap');
    
    const errorDisplay = (
      <div className={`p-4 rounded-md mb-4 ${isScheduleConflict ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            {isScheduleConflict ? (
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="ml-3">
            <h3 className={`text-sm font-medium ${isScheduleConflict ? 'text-yellow-800' : 'text-red-800'}`}>
              {isScheduleConflict ? 'Schedule Conflict' : 'Error'}
            </h3>
            <div className={`mt-2 text-sm ${isScheduleConflict ? 'text-yellow-700' : 'text-red-700'}`}>
              {error}
            </div>
            {teacherLoads.length === 0 && (
              <button
                onClick={() => loadTeacherLoads()}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );

    if (teacherLoads.length === 0) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="w-full max-w-2xl">
            {errorDisplay}
          </div>
        </div>
      );
    }

    // Show the error banner and continue with the table display
    return (
      <div>
        {errorDisplay}
        <DataManagementTable
          title="Teacher Loads"
          description="Manage teacher assignments, schedules, and workloads"
          data={teacherLoads as unknown as BaseItem[]}
          columns={columns}
          formFields={getFormFields(teachers, subjects, sections)}
          filterOptions={getFilterOptions(teachers, subjects, sections)}
          addButtonText="Add Teacher Load"
          searchPlaceholder="Search teacher loads..."
          addModalTitle="Add New Teacher Load"
          editModalTitle="Edit Teacher Load"
          addModalDescription="Assign a teacher to a subject and section with specific time schedule."
          editModalDescription="Update teacher assignment and schedule details."
          onAdd={handleAddTeacherLoad}
          onEdit={handleEditTeacherLoad}
          onDelete={handleDeleteTeacherLoad}
          actions={{
            edit: true,
            statusToggle: false,
            delete: true,
          }}
        />
      </div>
    );
  }

  return (
    <>
      <DataManagementTable
        title="Teacher Loads"
        description="Manage teacher assignments, schedules, and workloads"
        data={teacherLoads as unknown as BaseItem[]}
        columns={columns}
        formFields={getFormFields(teachers, subjects, sections)}
        filterOptions={getFilterOptions(teachers, subjects, sections)}
        addButtonText="Add Teacher Load"
        searchPlaceholder="Search teacher loads..."
        addModalTitle="Add New Teacher Load"
        editModalTitle="Edit Teacher Load"
        addModalDescription="Assign a teacher to a subject and section with specific time schedule."
        editModalDescription="Update teacher assignment and schedule details."
        onAdd={handleAddTeacherLoad}
        onEdit={handleEditTeacherLoad}
        onDelete={handleDeleteTeacherLoad}
        actions={{
          edit: true,
          statusToggle: false,
          delete: true,
        }}
      />
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Teacher Load"
        description={`Are you sure you want to delete the teacher load for ${teacherLoadToDelete?.teacherName} - ${teacherLoadToDelete?.subjectName} in ${teacherLoadToDelete?.sectionName}? This action cannot be undone.`}
      />
    </>
  );
}
