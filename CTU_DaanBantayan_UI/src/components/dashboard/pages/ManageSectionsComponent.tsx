"use client";

import {
  DataManagementTable,
  TableColumn,
  FormField,
  FilterOption,
  BaseItem,
} from "../DataManagementTable";
import { useEffect, useState } from "react";
import { sectionsService } from "@/services/sections.service";
import { usersService } from "@/services/users.service";
import { TableLoading } from "@/components/utils";
import { DeleteConfirmationDialog } from "../DeleteConfirmationDialog";
import { AdviserSummary, Role } from "@/types/api";

// Adviser object interface for API response
interface AdviserObject {
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  fullName?: string;
  [key: string]: unknown; // Allow additional properties
}

// Section interface extending BaseItem
interface Section extends BaseItem {
  sectionName: string;
  gradeLevel: string;
  adviserId: string;
  adviserName: string;
  apiId?: string; // Store the original API ID as string
}

const gradeLevels = ["7", "8", "9", "10", "11", "12"];

// Table columns configuration
const sectionColumns: TableColumn[] = [
  { key: "sectionName", label: "Section Name", searchable: true },
  { key: "gradeLevel", label: "Grade Level" },
  { key: "adviserName", label: "Adviser Name", searchable: true },
];

// Form fields configuration

// Filter options configuration
const sectionFilterOptions: FilterOption[] = [
  {
    key: "gradeLevel",
    label: "Grade Levels",
    options: gradeLevels.map((grade) => ({
      label: `Grade ${grade}`,
      value: grade,
    })),
  },
];

// Badge color function
const getSectionBadgeColor = (key: string, value: unknown) => {
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
  if (key === "status") {
    switch (value) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }
  return "bg-gray-100 text-gray-800";
};

export function ManageSectionsComponent() {
  const [sections, setSections] = useState<Section[]>([]);
  const [advisers, setAdvisers] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load sections and advisers function - used for initial load and refresh
  const loadSections = async () => {
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn("⚠️ Loading timeout reached, stopping loading state");
      setIsLoading(false);
      setError("Loading timed out. Please check your connection and try again.");
    }, 30000); // 30 second timeout

    try {
      setIsLoading(true);
      setError(null);
      console.log("🔄 Loading sections data...");

      // Fetch sections and teachers in parallel with individual timeouts
      const [sectionsResponse, teachersResponse] = await Promise.all([
        Promise.race([
          sectionsService.getAllSections(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Sections API timeout")), 15000)
          ),
        ]),
        Promise.race([
          usersService.getAllSystemUsers({ role: Role.TEACHER, size: 1000 }),
          new Promise<unknown>((_, reject) =>
            setTimeout(() => reject(new Error("Users API timeout")), 15000)
          ),
        ]),
      ]);

      // Transform API sections to component sections
      const sectionsArray = Array.isArray(sectionsResponse) ? sectionsResponse : [];
      const transformedSections: Section[] = sectionsArray.map(
        (apiSection) => {
          console.log("🔍 Processing API section:", apiSection);
          console.log("🔍 Adviser field type:", typeof apiSection.adviser);
          console.log("🔍 Adviser field value:", apiSection.adviser);

          // Handle adviser name from API response
          let adviserName = apiSection.adviserName || "No adviser assigned";
          let adviserId = apiSection.adviserId || apiSection.id; // Use adviserId if available, otherwise section ID

          const transformedSection = {
            id: parseInt(apiSection.id) || Math.random(),
            apiId: apiSection.id, // Store original string ID for API calls
            sectionName: apiSection.name,
            gradeLevel: apiSection.gradeLevel,
            adviserId: adviserId,
            adviserName:
              typeof adviserName === "string" ? adviserName : "No Adviser Assigned",
          };

          console.log("📋 Final transformed section:", transformedSection);
          return transformedSection;
        }
      );

      // Transform teachers to adviser options
      const teachersArray = Array.isArray((teachersResponse as any).content) ? (teachersResponse as any).content : [];
      const adviserOptions = teachersArray.map((teacher: any) => {
        // Use profile name if available, otherwise fallback to email
        const displayName = teacher.profile
          ? `${teacher.profile.firstName} ${teacher.profile.lastName}`.trim()
          : teacher.email;
        return {
          id: teacher.id,
          name: displayName,
        };
      });

      // Clear the timeout since we succeeded
      clearTimeout(timeoutId);

      setSections(transformedSections);
      setAdvisers(adviserOptions);
      console.log("✅ Sections data loaded successfully:", transformedSections);
    } catch (error) {
      console.error("❌ Failed to fetch sections data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load sections data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch sections and advisers on component mount
  useEffect(() => {
    loadSections();
  }, []);

  const handleAddSection = async (
    section: Omit<Section, "id" | "adviserName">
  ) => {
    try {
      setError(null);
      console.log("🔄 Creating section with data:", section);
      console.log("📋 Available advisers:", advisers);

      // Find the adviser name based on adviserId
      const adviser = advisers.find((a) => a.id === section.adviserId);
      console.log("👤 Selected adviser:", adviser);
      console.log("🔍 Looking for adviserId:", section.adviserId);

      const adviserName = adviser?.name || "No Adviser Assigned";
      console.log("📝 Using adviser name:", adviserName);

      const newSectionData = {
        name: section.sectionName as string,
        gradeLevel: section.gradeLevel as string,
        adviser: section.adviserId as string,
      };

      console.log("📤 Sending to API:", newSectionData);
      const result = await sectionsService.createSection(newSectionData);
      console.log("✅ Section created result:", result);

      // Refresh the sections list
      await loadSections();
    } catch (error) {
      console.error("❌ Failed to add section:", error);
      setError(
        error instanceof Error ? error.message : "Failed to add section"
      );
      throw new Error(
        error instanceof Error ? error.message : "Failed to add section"
      );
    }
  };

  const handleEditSection = async (
    id: string | number,
    sectionData: Partial<Section>
  ) => {
    try {
      setError(null);
      console.log("🔄 Editing section with id:", id);
      console.log("📝 Section data to update:", sectionData);

      // Find the current section
      const currentSection = sections.find((s) => s.id === id);
      if (!currentSection) {
        console.error("❌ Section not found with id:", id);
        return;
      }

      console.log("📋 Current section:", currentSection);
      console.log(
        "🔑 Using API ID:",
        currentSection.apiId || currentSection.id.toString()
      );

      // Update adviser name if adviserId is being updated
      let adviserName = currentSection.adviserName;
      if (sectionData.adviserId) {
        const adviser = advisers.find((a) => a.id === sectionData.adviserId);
        adviserName = adviser?.name || "No Adviser Assigned";
        console.log("👤 Updated adviser:", adviser);
      }

      const updateData = {
        name: sectionData.sectionName || currentSection.sectionName,
        gradeLevel: sectionData.gradeLevel || currentSection.gradeLevel,
        adviser: sectionData.adviserId || currentSection.adviserId,
      };

      console.log("📤 Sending update data to API:", updateData);
      const result = await sectionsService.updateSection(
        currentSection.apiId || currentSection.id.toString(), // Use the API string ID
        updateData
      );
      console.log("✅ Section updated result:", result);

      // Refresh the sections list
      await loadSections();
    } catch (error) {
      console.error("❌ Failed to edit section:", error);
      setError(
        error instanceof Error ? error.message : "Failed to edit section"
      );
      throw new Error(
        error instanceof Error ? error.message : "Failed to edit section"
      );
    }
  };

  // DataManagementTable now accepts async handlers directly; use handleEditSection

  const handleDeleteSection = async (id: string | number) => {
    const section = sections.find((s) => s.id === id);
    if (!section) return;

    setSectionToDelete(section);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!sectionToDelete) return;

    try {
      setIsDeleting(true);
      setError(null);

      await sectionsService.deleteSection(
        sectionToDelete.apiId || sectionToDelete.id.toString(),
        false // Simple delete without force
      );
      console.log("Section deleted:", sectionToDelete.id);

      // Close dialog and refresh the sections list
      setDeleteDialogOpen(false);
      setSectionToDelete(null);
      await loadSections();
    } catch (error) {
      console.error("Failed to delete section:", error);
      let errorMessage = "Failed to delete section";

      if (error instanceof Error) {
        // Handle network connectivity errors
        if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('connection')) {
          errorMessage = "Network error: Please check your internet connection and try again.";
        } else if (error.message.includes('timeout')) {
          errorMessage = "Request timed out: The server is taking too long to respond. Please try again.";
        } else if (error.message.includes('404')) {
          errorMessage = "Section not found: The item may have already been deleted.";
        } else if (error.message.includes('500')) {
          errorMessage = "Server error: Please try again later or contact your administrator.";
        } else if (error.message.includes('401') || error.message.includes('403')) {
          errorMessage = "Authentication error: Please refresh the page and log in again.";
        } else {
          // Use the specific error message from the API
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
      // Close dialog on error to prevent it from staying open
      setDeleteDialogOpen(false);
      setSectionToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setSectionToDelete(null);
  };

  const handleViewClassList = (section: BaseItem) => {
    // Navigate to the class list page for this section
    // You can implement navigation logic here, e.g., using Next.js router
    console.log("Viewing class list for section:", section);
    // For now, just log the section - you can implement navigation or modal opening
  };

  // Update form fields with real adviser data
  const updatedFormFields: FormField[] = [
    {
      key: "sectionName",
      label: "Section Name",
      type: "text",
      required: true,
      placeholder: "e.g., Rose, Sunflower, Maple",
    },
    {
      key: "gradeLevel",
      label: "Grade Level",
      type: "select",
      required: true,
      options: gradeLevels.map((grade) => ({
        label: `Grade ${grade}`,
        value: grade,
      })),
    },
    {
      key: "adviserId",
      label: "Adviser",
      type: "select",
      required: true,
      options: advisers.map((adviser) => ({
        label: adviser.name,
        value: adviser.id,
      })),
    },
  ];

  // Show loading state
  if (isLoading) {
    return <TableLoading text="Loading sections data..." />;
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading sections data</p>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <DataManagementTable
        title="Manage Sections"
        description="Add, edit, and manage class sections and their advisers."
        data={sections}
        columns={sectionColumns}
        formFields={updatedFormFields}
        filterOptions={sectionFilterOptions}
        onAdd={handleAddSection}
        onEdit={handleEditSection}
        onDelete={handleDeleteSection}
        onRefresh={loadSections}
        searchPlaceholder="Search sections..."
        addButtonText="Add Section"
        editModalTitle="Edit Section"
        addModalTitle="Add New Section"
        editModalDescription="Update the section details below."
        addModalDescription="Fill in the details to create a new section."
        getBadgeColor={getSectionBadgeColor}
        actions={{
          edit: true,
          statusToggle: false,
          delete: true,
          viewClassList: true,
        }}
        onViewClassList={handleViewClassList}
      />

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Section"
        description={`Are you sure you want to delete "${sectionToDelete?.sectionName}"? This action cannot be undone.`}
        isLoading={isDeleting}
        error={error}
      />
    </>
  );
}
