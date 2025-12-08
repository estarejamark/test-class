"use client";

import React, { useState, useEffect } from "react";
import {
  DataManagementTable,
  TableColumn,
  FormField,
  FilterOption,
  BaseItem,
} from "../DataManagementTable";
import { usersService } from "@/services/users.service";
import { studentsService } from "@/services/students.service";
import { sectionsService } from "@/services/sections.service";
import { enrollmentService } from "@/services/enrollment.service";
import { Profile, Section, SystemUser } from "@/types/api";
import { Role } from "@/types/auth";
import { Gender } from "@/types/api";
import { TableLoading } from "@/components/utils";
import { profilesService } from "@/services/profiles.service";
import { DeleteConfirmationDialog } from "../DeleteConfirmationDialog";
import { AdviserDeleteConfirmationDialog } from "../AdviserDeleteConfirmationDialog";
import { useAuth } from "@/contexts/auth.context";

// Action types for user management
type UserAction = 'changeEmail' | 'resetPassword' | 'resetOtp' | 'search';

// User interface extending BaseItem - Simple setup as originally specified
interface User extends BaseItem {
  name: string;
  email: string;
  role: string;
  gradeLevel?: string;
  section?: string;
  profileStatus?: string; // Profile completion status
  contactNumber?: string | null; // Contact number from profile
  uuid?: string; // User UUID for API calls
  profileId?: string; // Profile UUID for reference
}

// Roles used in forms - Must match backend RoleEnum.kt order
const roles = ["ADMIN", "TEACHER", "STUDENT"];

// Table columns configuration
const userColumns: TableColumn[] = [
  { key: "name", label: "Name", searchable: true },
  { key: "email", label: "Email", searchable: true },
  { key: "contactNumber", label: "Contact Number", searchable: true },
  { key: "role", label: "Role" },
  { key: "section", label: "Grade & Section" },
  { key: "profileStatus", label: "Profile Status" },
  { key: "status", label: "Status" },
];

// Form fields configuration
const getUserFormFields = (sections: Section[], isEdit: boolean = false, item?: BaseItem, formData?: Record<string, unknown>): FormField[] => {
  const fields: FormField[] = [];

  // Only include role field when adding a new user, not when editing
  if (!isEdit) {
    fields.push({
      key: "role",
      label: "Role",
      type: "select",
      required: true,
      options: roles,
    });
  }

  // Get selected role for conditional fields
  const selectedRole = isEdit ? (item as User)?.role : (formData?.role as string);
  const isStudent = selectedRole === "STUDENT";

  if (isStudent) {
    // Student-specific fields - simplified for profile completion modal
    fields.push(
      {
        key: "name",
        label: "Full Name (e.g. First-Middle-Last optional suffix)",
        type: "text",
        required: true,
        placeholder: "Enter full name",
      },
      {
        key: "email",
        label: "Email",
        type: "email",
        required: true,
        placeholder: "Enter email",
      },
      {
        key: "section",
        label: "Section",
        type: "select",
        required: true,
        options: sections.map(section => `${section.gradeLevel}-${section.name}`), // Display as "Grade-Section"
      }
    );
  } else {
    // Non-student fields (admin/teacher)
    fields.push(
      {
        key: "name",
        label: "Name",
        type: "text",
        required: true,
        placeholder: "Enter name",
      },
      {
        key: "email",
        label: "Email",
        type: "email",
        required: true,
        placeholder: "Enter email",
      }
    );
  }

  return fields;
};

// Filter options configuration - Dynamic based on loaded sections
const getUserFilterOptions = (sections: Section[]): FilterOption[] => [
  { key: "role", label: "Roles", options: roles },
  {
    key: "section",
    label: "Section",
    options: sections.map(section => `${section.gradeLevel}-${section.name}`)
  },
];

// Helper function to format contact number for display (09XX XXX XXXX)
const formatContactNumber = (contactNumber: string | null | undefined): string => {
  if (!contactNumber || contactNumber.length !== 11 || !contactNumber.startsWith("09")) {
    return contactNumber || "";
  }
  return `${contactNumber.substring(0, 4)} ${contactNumber.substring(4, 7)} ${contactNumber.substring(7)}`;
};

// Badge color function
const getUserBadgeColor = (key: string, value: unknown) => {
  if (key === "role") {
    switch (value) {
      case "ADMIN":
        return "bg-red-100 text-red-800";
      case "TEACHER":
        return "bg-blue-100 text-blue-800";
      case "STUDENT":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }
  if (key === "status") {
    switch (value) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending_profile":
        return "bg-yellow-100 text-yellow-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }
  return "bg-gray-100 text-gray-800";
};

export function ManageUsersComponent() {
  const { authState } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { refreshProfile } = useAuth();
  const [currentAction, setCurrentAction] = useState<UserAction | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [adviserDeleteDialogOpen, setAdviserDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);



  // Load users and sections on component mount
  useEffect(() => {
    const initialize = async () => {
      await loadSections();
      loadUsers();
    };
    initialize();
  }, []);

  const loadSections = async (): Promise<Section[]> => {
    try {
      console.log("🔄 Loading sections for student enrollment...");
      const sectionsData = await sectionsService.getAllSections();
      setSections(sectionsData);
      console.log("✅ Sections loaded:", sectionsData.length);
      return sectionsData;
    } catch (err) {
      console.error("❌ Failed to load sections:", err);
      // Don't set error state for sections loading failure as it's not critical
      return [];
    }
  };

  // Listen for profile updates and auto-refresh users list
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      console.log("📊 Profile updated event received:", event.detail);
      // Auto-refresh users list when any profile is updated
      loadUsers(true); // Pass true to skip loading state for smoother UX
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

  const loadUsers = async (skipLoadingState = false, sectionsOverride?: Section[]) => {
    try {
      if (!skipLoadingState) {
        setLoading(true);
      }
      setError(null);

      console.log("🔄 Loading users from /api/users/system-users...");

      // Use the users endpoint which returns system users with profile data
      const response = await usersService.getAllSystemUsers({ size: 1000 });
      console.log(
        "📊 Raw API Response from /api/users:",
        JSON.stringify(response, null, 2)
      );

      // Check if response has the expected structure
      if (!response || !response.content || !Array.isArray(response.content)) {
        console.error("❌ Invalid response structure:", response);
        throw new Error("Invalid response structure from API");
      }

      console.log("📊 Number of users found:", response.content.length);

      // Use provided sections or fall back to state
      const sectionsToUse = sectionsOverride || sections;

const transformedUsers: User[] = response.content.map((user: SystemUser, index: number) => {
  // Check if the user has a profile
  const hasProfile = !!user.profile;
  const hasCompleteProfile =
    hasProfile &&
    user.profile?.firstName &&
    user.profile?.lastName;

  // Display name: prefer profile name, fallback to email
  const displayName = hasCompleteProfile
    ? `${user.profile!.firstName} ${user.profile!.lastName}`
    : user.email || "No Name";

  // --- Only for students: get grade and section ---
  let gradeLevel = "";
  let section = "";

  if (user.role === "STUDENT") {
    // Prefer top-level fields from API
    if (user.gradeLevel) {
      gradeLevel = user.gradeLevel;
      section = user.sectionName ? `${user.gradeLevel}-${user.sectionName}` : gradeLevel;
    } else if (user.enrollments?.[0]?.section) {
      const sec = user.enrollments[0].section;
      gradeLevel = sec.gradeLevel;
      section = `${sec.gradeLevel}-${sec.name}`;
    } else {
      gradeLevel = "N/A";
      section = "N/A";
    }
  }

  // Determine status
  const status =
    user.status === "ACTIVE"
      ? "active"
      : user.status === "PENDING_PROFILE"
      ? "pending_profile"
      : "inactive";

  // Determine profile completeness
  const profileStatus = hasCompleteProfile ? "Complete" : "Incomplete";

  return {
    id: index + 1, // sequential ID for table
    uuid: user.id,
    profileId: user.profile?.id,
    name: displayName,
    email: user.email || "",
    contactNumber: formatContactNumber(user.role === "STUDENT" ? (user.profile?.parentContact?.replace(/^\+63/, "") || "") : (user.profile?.contactNumber?.replace(/^\+63/, "") || "")),
    role: (user.role || "").toUpperCase(),
    gradeLevel: gradeLevel,
    section: section,
    profileStatus: profileStatus,
    status: status,
  };
});

setUsers(transformedUsers);

    } catch (err) {
      console.error("❌ Failed to load users - full error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load users";
      setError(errorMessage);
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (user: Omit<User, "id">) => {
    try {
      setError(null);
      setSuccess(null);

      console.log("👤 Creating new user:", user);

      // Validate authentication before attempting user creation
      if (!authState.isAuthenticated) {
        const authError = "You must be logged in to create users. Please log in and try again.";
        setError(authError);
        throw new Error(authError);
      }

      // Use dedicated student service for student creation
      if (user.role === "STUDENT") {
        console.log("🎓 Creating student with enrollment using dedicated service");

        // Split name into first and last name
        const nameParts = (user as User).name.split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        // Find section ID from section string
        const targetSection = sections.find(section =>
          `${section.gradeLevel}-${section.name}` === (user as User).section
        );

        if (!targetSection) {
          setError(`Section '${(user as User).section}' not found. Please select a valid section.`);
          throw new Error(`Section '${(user as User).section}' not found. Please select a valid section.`);
        }

        // Validate student data
        const validation = studentsService.validateStudentData({
          email: (user as User).email,
          gradeLevel: targetSection.gradeLevel.toString(),
          section: (user as User).section,
        });

        if (!validation.isValid) {
          setError(`Invalid student data: ${validation.errors.join(", ")}`);
          throw new Error(`Invalid student data: ${validation.errors.join(", ")}`);
        }

        // Create student with enrollment using dedicated service
        const newStudentId = await studentsService.createStudent({
          email: (user as User).email,
          password: "admin123",
          firstName: firstName,
          lastName: lastName,
          gender: "MALE",
          birthDate: new Date().toISOString().split("T")[0],
          contactNumber: "",
          address: "",
          sectionId: targetSection.id,
        });

        console.log("✅ Student created and enrolled successfully:", newStudentId);
        setSuccess(`Student ${user.email} has been successfully added and enrolled in ${user.section}.`);

        if (targetSection) {
          // Dispatch event to notify other components (like ManageClassList) of the new student
          window.dispatchEvent(new CustomEvent('studentCreated', {
            detail: {
              studentId: newStudentId,
              sectionId: targetSection.id,
              action: 'created',
              studentData: {
                email: user.email,
                name: user.name,
                gradeLevel: user.gradeLevel,
                section: user.section
              }
            }
          }));
        }
      } else {
        // Create non-student user using existing service
        const newUser = await usersService.createUser({
          email: user.email as string,
          password: "admin123", // Default password as specified
          role: user.role as Role,
        });

        console.log("✅ User account created successfully:", newUser);
        setSuccess(`User ${user.email} has been successfully added to the system.`);
      }

      console.log(
        "ℹ️ Note: Profile will be created when user logs in for the first time"
      );

      // Reload users to get the updated list
      console.log("🔄 Reloading users list after creation...");
      await loadUsers();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add user";
      setError(errorMessage);
      console.error("❌ Failed to add user:", err);
      throw new Error(errorMessage);
    }
  };
  
  const handleEditUser = async (id: string | number, userData: Partial<User>): Promise<void> => {
    try {
      setError(null);

      const user = users.find((u) => u.id === id);
      if (!user) {
        throw new Error("User not found");
      }

      console.log("👤 Found user for editing:", {
        tableId: user.id,
        userUuid: user.uuid,
        profileId: user.profileId,
        userName: user.name,
        userEmail: user.email,
        currentRole: user.role,
      });

      // Extract first and last name from the full name
      const nameParts = userData.name
        ? userData.name.split(" ")
        : user.name.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      console.log("📝 Preparing user update data:", {
        userUuid: user.uuid,
        profileId: user.profileId,
        firstName,
        lastName,
        userData,
      });

      if (!user.uuid) {
        throw new Error("User UUID is required for editing");
      }

      // Handle student updates (both section and name changes)
      if (user.role === "STUDENT") {
        console.log("📚 Student update detected:", {
          currentSection: user.section,
          newSection: userData.section,
          nameChanged: userData.name && userData.name !== user.name,
        });

        // Handle section update if provided
        if (userData.section) {
          // Find the target section
          const targetSection = sections.find(section =>
            `${section.gradeLevel}-${section.name}` === userData.section
          );

          if (!targetSection) {
            throw new Error(`Section '${userData.section}' not found. Please select a valid section.`);
          }

          console.log("🎯 Target section found:", {
            sectionId: targetSection.id,
            sectionName: targetSection.name,
            gradeLevel: targetSection.gradeLevel,
          });

          // Update enrollment via student service
          await studentsService.updateStudentEnrollment(user.uuid, {
            sectionId: targetSection.id,
          });
          console.log("✅ Student section updated successfully");
        }

        // Handle name update if provided (always update profile for name changes)
        if (userData.name && userData.name !== user.name) {
          console.log("📝 Student name update detected:", {
            currentName: user.name,
            newName: userData.name,
          });

          // Extract first and last name from the full name
          const nameParts = userData.name.split(" ");
          const firstName = nameParts[0] || "";
          const lastName = nameParts.slice(1).join(" ") || "";

          try {
            if (!user.profileId) {
              throw new Error("Profile ID is required for updating student profile");
            }
          await usersService.updateUser(
            user.profileId,
            {
              firstName: firstName,
              middleName: "",
              lastName: lastName,
              gender: Gender.MALE,
              birthDate: new Date().toISOString().split("T")[0],
              contactNumber: undefined,
              address: "",
            }
          );
            console.log("✅ Student profile updated successfully");
          } catch (profileErr) {
            console.error("❌ Failed to update student profile:", profileErr);
            throw new Error("Failed to update student profile. Please try again.");
          }
        }

        // **Optimistic UI update** - immediately reflect changes in table
        setUsers(prev =>
          prev.map(u =>
            u.id === id
              ? {
                  ...u,
                  ...(userData.section && {
                    gradeLevel: sections.find(s => `${s.gradeLevel}-${s.name}` === userData.section)?.gradeLevel.toString(),
                    section: userData.section,
                  }),
                  ...(userData.name && { name: userData.name }),
                }
              : u
          )
        );

        setSuccess("Student updated successfully.");
        console.log("✅ Local state updated without full reload");

        // Dispatch event to notify other components (like ManageClassList) of the student update
        const finalSection = userData.section ? sections.find(section =>
          `${section.gradeLevel}-${section.name}` === userData.section
        ) : sections.find(section =>
          `${section.gradeLevel}-${section.name}` === user.section
        );

        window.dispatchEvent(new CustomEvent('studentCreated', {
          detail: {
            studentId: user.uuid,
            sectionId: finalSection?.id,
            action: 'updated',
            studentData: {
              email: user.email,
              name: userData.name || user.name,
              gradeLevel: userData.section ? sections.find(s => `${s.gradeLevel}-${s.name}` === userData.section)?.gradeLevel.toString() : user.gradeLevel,
              section: userData.section || user.section
            }
          }
        }));

        // Refresh auth context if the current user was updated
        if (authState.user?.id === user.uuid) {
          console.log("🔄 Refreshing auth context for current user");
          await refreshProfile();
        }
      } else {
        // Handle non-student updates (name, email changes)
        let updateResult = null;
        try {
          if (!user.profileId) {
            throw new Error("Profile ID is required for updating user profile");
          }
          updateResult = await usersService.updateUser(
            user.profileId,
            {
              firstName: firstName,
              middleName: "",
              lastName: lastName,
              gender: Gender.MALE,
              birthDate: new Date().toISOString().split("T")[0],
              contactNumber: "",
              address: "",
            }
          );
          console.log("✅ User profile update result:", updateResult);
        } catch (profileErr) {
          console.error("❌ Failed to update user profile:", profileErr);
          throw new Error("Failed to update user profile. Please try again.");
        }

        // Handle email updates for non-students
        if (userData.email && userData.email !== user.email) {
          console.log("📧 Updating user email:", {
            userUuid: user.uuid,
            currentEmail: user.email,
            newEmail: userData.email,
          });

          try {
            await usersService.updateUserEntity(user.uuid, {
              email: userData.email,
            });
            console.log("✅ User email updated successfully");
          } catch (emailErr) {
            console.error("❌ Failed to update user email:", emailErr);
            throw new Error("Failed to update user email. Please try again.");
          }
        }

        setSuccess("User updated successfully.");

        // Reload users to ensure all data is synchronized for non-student updates
        console.log("🔄 Reloading users after non-student update...");
        await loadUsers();
      }

      console.log("✅ User update completed successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to edit user";
      setError(errorMessage);
      console.error("Failed to edit user:", err);
      throw new Error(errorMessage);
    }
  };

  const handleDeleteUser = async (id: string | number) => {
    const user = users.find(u => u.id === id);
    if (!user) return;

    // Check if this user is a TEACHER and an adviser in any section
    // Students cannot be advisers, so only check for teachers
    const adviserSections = user.role === "TEACHER" ? sections.filter(
      section => section.adviser?.id === user.profileId
    ) : [];

    if (adviserSections.length > 0) {
      // Open special adviser deletion dialog
      setUserToDelete(user);
      setAdviserDeleteDialogOpen(true);
      console.log("⚠️ User is an adviser for sections:", adviserSections.map(s => s.name));
    } else {
      // Normal deletion flow
      setUserToDelete(user);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      setError(null);

      console.log("🗑️ Deleting user:", {
        tableId: userToDelete.id,
        userUuid: userToDelete.uuid,
        profileId: userToDelete.profileId,
        userName: userToDelete.name,
        userEmail: userToDelete.email,
      });

      if (!userToDelete.uuid) {
        throw new Error("User UUID is required for deletion");
      }

      // Call API to delete user
      await usersService.deleteUser(userToDelete.uuid);

      console.log("✅ User deleted successfully:", userToDelete.id);

      // Success message
      setSuccess("User deleted successfully. All associated records have been preserved.");

      // Refresh the users list
      await loadUsers();

      // Close both dialogs
      setDeleteDialogOpen(false);
      setAdviserDeleteDialogOpen(false);
      setUserToDelete(null);

    } catch (err) {
      console.error("❌ Failed to delete user:", err);

      let errorMessage = "Failed to delete user";

      if (err instanceof Error) {
        if (err.message.includes('fetch') || err.message.includes('network')) {
          errorMessage = "Network error: Please check your internet connection.";
        } else if (err.message.includes('404')) {
          errorMessage = "User not found: The item may have already been deleted.";
        } else if (err.message.includes('500')) {
          errorMessage = "Server error: Please try again later.";
        } else if (err.message.includes('401') || err.message.includes('403')) {
          errorMessage = "Authentication error: Please refresh the page and log in again.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setAdviserDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleToggleUserStatus = async (id: string | number) => {
    try {
      setError(null);

      // Find user in the state
      const user = users.find((u) => u.id === id);
      if (!user) {
        throw new Error("User not found");
      }

      console.log("🔄 Toggling user status:", {
        tableId: user.id,
        userUuid: user.uuid,
        profileId: user.profileId,
        userName: user.name,
        userEmail: user.email,
      });

      if (!user.uuid) {
        throw new Error("User UUID is required for status toggle");
      }

      // Call API to toggle status
      await usersService.toggleUserStatus(user.uuid);

      console.log("✅ User status toggled successfully:", id);

      // Refresh the users list to reflect changes
      console.log("🔄 Reloading users after status toggle...");
      await loadUsers();
      console.log("✅ Users reloaded successfully after status toggle");

    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to toggle user status";
      setError(errorMessage);
      console.error("❌ Failed to toggle user status:", err);
      // Not throwing to prevent breaking the UI flow
    }
  };

  const handleChangeEmail = async (id: string | number) => {
    try {
      setError(null);
      const user = users.find((u) => u.id === id);
      if (!user) return;

      // For now, just show a placeholder - in a real implementation, you'd open a modal for email/OTP input
      console.log("📧 Change email requested for user:", user.email);
      alert(`Change email functionality for ${user.email} - This would open a modal for new email and OTP verification`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to change email";
      setError(errorMessage);
      console.error("Failed to change email:", err);
    }
  };

  const handleResetPassword = async (id: string | number) => {
    try {
      setError(null);
      const user = users.find((u) => u.id === id);
      if (!user) return;

      console.log("🔗 Sending password reset link to:", user.email);
      await usersService.sendPasswordResetLink(user.email);
      console.log("✅ Password reset link sent");
      alert(`Password reset link sent to ${user.email}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send password reset link";
      setError(errorMessage);
      console.error("Failed to send password reset link:", err);
    }
  };

  const handleResetOtp = async (id: string | number) => {
    try {
      setError(null);
      const user = users.find(u => u.id === id);
      if (!user?.uuid) throw new Error("User not found");

      console.log("🔄 Resetting OTP for user:", user.email);

      // Pass UUID so backend knows which user to reset
        await usersService.resetOtp();

      console.log("✅ OTP reset successfully");
      alert(`OTP/2FA reset for ${user.email}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to reset OTP";
      setError(errorMessage);
      console.error("Failed to reset OTP:", err);
    }
  };

  // Show loading state
  if (loading) {
    return <TableLoading text="Loading users..." />;
  }

  // Show error state
  if (error && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-red-600 text-lg font-semibold">
          Failed to load users
        </div>
        <div className="text-gray-600">{error}</div>
        <button
          onClick={() => loadUsers()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="text-green-800 font-medium">Success</div>
          <div className="text-green-600 text-sm">{success}</div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-800 font-medium">Error</div>
          <div className="text-red-600 text-sm">{error}</div>
        </div>
      )}

      <DataManagementTable
        title="Manage Users"
        description="Add, edit, and manage system users including students, teachers, and admins."
        data={users}
        columns={userColumns}
        formFields={(isEdit: boolean, item?: BaseItem, formData?: Record<string, unknown>) => getUserFormFields(sections, isEdit, item, formData)}
        filterOptions={getUserFilterOptions(sections)}
        onAdd={handleAddUser}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        onStatusToggle={handleToggleUserStatus}
        onChangeEmail={handleChangeEmail}
        onResetPassword={handleResetPassword}
        onResetOtp={handleResetOtp}
        onRefresh={() => loadUsers()}
        searchPlaceholder="Search users..."
        addButtonText="Add User"
        editModalTitle="Edit User"
        addModalTitle="Add New User"
        editModalDescription="Update the user details below."
        addModalDescription="Fill in the details to create a new user account."
        getBadgeColor={getUserBadgeColor}
        actions={(item: BaseItem) => {
          const user = item as User;
          return {
            edit: true, // Allow editing all users, including those with incomplete profiles
            statusToggle: true,
            delete: true,
            changeEmail: true,
            resetPassword: true,
            resetOtp: true,
          };
        }}
      />

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        itemName={userToDelete?.name}
        isLoading={isDeleting}
      />

      <AdviserDeleteConfirmationDialog
        isOpen={adviserDeleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        adviserName={userToDelete?.name || ""}
        sectionNames={sections.filter(section => section.adviser?.id === userToDelete?.profileId).map(section => `${section.gradeLevel}-${section.name}`)}
        isLoading={isDeleting}
      />

    </>
  );
}
