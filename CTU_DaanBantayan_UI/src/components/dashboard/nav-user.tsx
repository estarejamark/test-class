"use client";

import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from "@tabler/icons-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth.context";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { profilesService } from "@/services/profiles.service";
import { Gender } from "@/types/api";
import { Role } from "@/types/auth";
import { toast } from "sonner";
import { AxiosError } from "axios";

export function NavUser({
  user,
  asHeader = false,
}: {
  user: {
    name?: string;
    email?: string;
    avatar?: string;
  };
  asHeader?: boolean;
}) {
  const { isMobile } = useSidebar();
  const { logout, profile: authProfile, refreshProfile, user: authUser } = useAuth();
  const router = useRouter();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    firstName: authProfile?.firstName || "",
    middleName: authProfile?.middleName || "",
    lastName: authProfile?.lastName || "",
    gender: (authProfile?.gender as Gender) || Gender.MALE,
    birthDate: authProfile?.birthDate || "",
    address: authProfile?.address || "",
    contact: authProfile?.contactNumber
      ? authProfile.contactNumber
          .replace(/^\+63/, "")
          .replace(/\s/g, "")
      : "",
    parentName: authProfile?.parentName || "",
    parentContact: authProfile?.parentContact
      ? authProfile.parentContact
          .replace(/^\+63/, "")
          .replace(/\s/g, "")
      : "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

// Helper function to format contact number for display (09XX XXX XXXX)
const formatContactNumber = (contactNumber: string | undefined): string => {
  if (!contactNumber || contactNumber.length !== 11 || !contactNumber.startsWith("09")) {
    return contactNumber || "";
  }
  return `${contactNumber.substring(0, 4)} ${contactNumber.substring(4, 7)} ${contactNumber.substring(7)}`;
};

// Validation function for required fields
const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};

    // First name validation
    if (!profileFormData.firstName.trim()) {
      errors.firstName = "First name is required";
    } else if (profileFormData.firstName.trim().length < 2) {
      errors.firstName = "First name must be at least 2 characters";
    }

    // Last name validation
    if (!profileFormData.lastName.trim()) {
      errors.lastName = "Last name is required";
    } else if (profileFormData.lastName.trim().length < 2) {
      errors.lastName = "Last name must be at least 2 characters";
    }

    // Birth date validation
    if (!profileFormData.birthDate.trim()) {
      errors.birthDate = "Birth date is required";
    } else {
      const birthDate = new Date(profileFormData.birthDate);
      const today = new Date();
      const minAge = new Date(
        today.getFullYear() - 100,
        today.getMonth(),
        today.getDate()
      );
      const maxAge = new Date(
        today.getFullYear() - 5,
        today.getMonth(),
        today.getDate()
      );

      if (birthDate > today) {
        errors.birthDate = "Birth date cannot be in the future";
      } else if (birthDate < minAge) {
        errors.birthDate = "Please enter a valid birth date";
      } else if (birthDate > maxAge) {
        errors.birthDate = "You must be at least 5 years old";
      }
    }

    // Contact validation - only for non-students
    if (authUser?.role !== Role.STUDENT) {
      if (!profileFormData.contact.trim()) {
        errors.contact = "Contact number is required";
      } else {
        // Align with backend: accept both "09XX XXX XXXX" and "09XXXXXXXXX"
        const isValidFormat = /^09\d{2} \d{3} \d{4}$/.test(profileFormData.contact) ||
                              /^09\d{9}$/.test(profileFormData.contact.replace(/\s/g, ""));
        if (!isValidFormat) {
          errors.contact = "Please enter a valid Philippine mobile number (09XX XXX XXXX or 09XXXXXXXXX)";
        }
      }
    }

    // Parent name validation - only for students
    if (authUser?.role === Role.STUDENT) {
      if (!profileFormData.parentName.trim()) {
        errors.parentName = "Parent/Guardian name is required";
      } else if (profileFormData.parentName.trim().length < 2) {
        errors.parentName = "Parent/Guardian name must be at least 2 characters";
      }
    }

    // Parent contact validation - only for students
    if (authUser?.role === Role.STUDENT) {
      if (!profileFormData.parentContact.trim()) {
        errors.parentContact = "Parent/Guardian contact is required";
      } else {
        // Align with backend: accept both "09XX XXX XXXX" and "09XXXXXXXXX"
        const isValidFormat = /^09\d{2} \d{3} \d{4}$/.test(profileFormData.parentContact) ||
                              /^09\d{9}$/.test(profileFormData.parentContact.replace(/\s/g, ""));
        if (!isValidFormat) {
          errors.parentContact = "Please enter a valid Philippine mobile number (09XX XXX XXXX or 09XXXXXXXXX)";
        }
      }
    }

    // Address validation
    if (!profileFormData.address.trim()) {
      errors.address = "Address is required";
    } else if (profileFormData.address.trim().length < 10) {
      errors.address = "Address must be at least 10 characters";
    } else if (profileFormData.address.trim().length > 255) {
      errors.address = "Address must be less than 255 characters";
    }

    // Max length validations
    if (profileFormData.firstName.trim().length > 50) {
      errors.firstName = "First name must be less than 50 characters";
    }
    if (profileFormData.lastName.trim().length > 50) {
      errors.lastName = "Last name must be less than 50 characters";
    }
    if (profileFormData.middleName.trim().length > 50) {
      errors.middleName = "Middle name must be less than 50 characters";
    }
    if (authUser?.role === Role.STUDENT) {
      if (profileFormData.parentName.trim().length > 100) {
        errors.parentName = "Parent/Guardian name must be less than 100 characters";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [profileFormData, authUser?.role]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      // Redirect to landing page after successful logout
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if logout fails on server, redirect to landing page
      router.push("/");
    }
  }, [logout, router]);

  const handleProfileClick = useCallback(async () => {
    setIsLoadingProfile(true);

    try {
      // Fetch fresh profile data from /api/profiles/me with JWT token
      const freshProfile = await profilesService.getMyProfile();

      // Set form data with fresh profile data
      setProfileFormData({
        firstName: freshProfile?.firstName || "",
        middleName: freshProfile?.middleName || "",
        lastName: freshProfile?.lastName || "",
        gender: (freshProfile?.gender as Gender) || Gender.MALE,
        birthDate: freshProfile?.birthDate || "",
        address: freshProfile?.address || "",
        contact: freshProfile?.contactNumber
          ? freshProfile.contactNumber
              .replace(/^\+63/, "")
              .replace(/\s/g, "")
          : "",
        parentName: freshProfile?.parentName || "",
        parentContact: freshProfile?.parentContact
          ? freshProfile.parentContact
              .replace(/^\+63/, "")
              .replace(/\s/g, "")
          : "",
      });
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
      // Fallback to cached profile data if API call fails
      setProfileFormData({
        firstName: authProfile?.firstName || "",
        middleName: authProfile?.middleName || "",
        lastName: authProfile?.lastName || "",
        gender: (authProfile?.gender as Gender) || Gender.MALE,
        birthDate: authProfile?.birthDate || "",
        address: authProfile?.address || "",
        contact: authProfile?.contactNumber
          ? authProfile.contactNumber
              .replace(/^\+63/, "")
              .replace(/\s/g, "")
          : "",
        parentName: authProfile?.parentName || "",
        parentContact: authProfile?.parentContact
          ? authProfile.parentContact
              .replace(/^\+63/, "")
              .replace(/\s/g, "")
          : "",
      });
    }

    setIsLoadingProfile(false);
    // Clear any previous validation errors when modal opens
    setValidationErrors({});
    setIsProfileModalOpen(true);
  }, [authProfile]);
  const handleProfileSave = useCallback(async () => {
    // Validate form before saving
    if (!validateForm()) {
      toast.error("Please fix the validation errors before saving");
      return;
    }

    if (!authProfile?.id) {
      toast.error("No profile ID found");
      return;
    }

    try {
      setIsSaving(true);

      // Standardize contact numbers to backend-expected format (09XXXXXXXXX)
      const standardizeTo09 = (input?: string) => {
        if (!input) return undefined;
        const digits = input.replace(/\D/g, "");

        // +63XXXXXXXXX or 63XXXXXXXXX -> 09XXXXXXXXX
        if (digits.startsWith("63") && digits.length >= 11) {
          return `0${digits.substring(digits.length - 10)}`;
        }
        if (digits.startsWith("639") && digits.length >= 12) {
          return `0${digits.substring(digits.length - 10)}`;
        }

        // starts with 9 (9123456789) -> 09123456789
        if (digits.length === 10 && digits.startsWith("9")) {
          return `0${digits}`;
        }

        // already in 09XXXXXXXXX format
        if (digits.length === 11 && digits.startsWith("09")) {
          return digits;
        }

        // If unable to standardize, return original trimmed value (validation will catch it)
        return input.trim() || undefined;
      };

      const updateData = {
        firstName: profileFormData.firstName,
        middleName: profileFormData.middleName.trim() || undefined,
        lastName: profileFormData.lastName,
        gender: profileFormData.gender,
        birthDate: profileFormData.birthDate,
        address: profileFormData.address,
        contactNumber: standardizeTo09(profileFormData.contact),
        parentName: profileFormData.parentName.trim() || undefined,
        parentContact: standardizeTo09(profileFormData.parentContact),
      };

      console.log("Sending update data to API:", updateData);
      await profilesService.updateProfile(authProfile.id, updateData);
      console.log("Profile updated successfully");

      // Dispatch custom event for real-time updates
      window.dispatchEvent(
        new CustomEvent("profileUpdated", {
          detail: {
            profileId: authProfile.id,
            updatedData: updateData,
            timestamp: new Date().toISOString(),
          },
        })
      );

      // Refresh the profile in auth context to update UI
      await refreshProfile();

      // Clear validation errors and close modal
      setValidationErrors({});
      setIsProfileModalOpen(false);

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to save profile:", error);
      let errorMessage = "Failed to save profile. Please try again.";

      // Handle AxiosError specifically
      if (error instanceof AxiosError) {
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data && typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Handle specific database constraint errors
      if (errorMessage.includes("Duplicate entry") && errorMessage.includes("contact_number")) {
        errorMessage = "This contact number is already in use by another user. Please use a different contact number.";
      }
      if (errorMessage.includes("Duplicate entry") && errorMessage.includes("parent_contact")) {
        errorMessage = "This parent/guardian contact number is already in use. Please use a different contact number.";
      }

      console.error("Error details:", errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [profileFormData, authProfile, refreshProfile, validateForm]);

  const handleInputChange = useCallback(
    (field: string, value: string) => {
      let processedValue = value;

      // Format contact number as user types
      if (field === "contact" || field === "parentContact") {
        // Remove all non-digits
        let digitsOnly = value.replace(/\D/g, "");

        // Only keep digits that would form a valid Philippine mobile number
        if (digitsOnly.length <= 11) {
          // Format as: 09XX XXX XXXX (always start with 09)
          // Ensure it starts with "09" if it's a valid length for a Philippine mobile number
          if (digitsOnly.length > 0 && !digitsOnly.startsWith("09")) {
            if (digitsOnly.startsWith("9")) {
              digitsOnly = "0" + digitsOnly; // Prepend '0' if starts with '9'
            } else {
              // If it doesn't start with '09' or '9', don't try to format it as a Philippine number
              processedValue = value;
              setProfileFormData((prev) => ({
                ...prev,
                [field]: processedValue,
              }));
              // Clear validation error for this field when user starts typing
              if (validationErrors[field]) {
                setValidationErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors[field];
                  return newErrors;
                });
              }
              return; // Exit early if not a valid start for PH number
            }
          }
          if (digitsOnly.length >= 4) {
            processedValue = digitsOnly.slice(0, 4) + " " + digitsOnly.slice(4);
          }
          if (digitsOnly.length >= 7) {
            processedValue =
              digitsOnly.slice(0, 4) +
              " " +
              digitsOnly.slice(4, 7) +
              " " +
              digitsOnly.slice(7);
          }
          if (digitsOnly.length < 4) {
            processedValue = digitsOnly;
          }
        } else {
          // Don't allow more than 11 digits
          return;
        }
      }

      setProfileFormData((prev) => ({
        ...prev,
        [field]: processedValue,
      }));

      // Clear validation error for this field when user starts typing
      if (validationErrors[field]) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [validationErrors]
  );

  // Generate user initials from profile
  const getUserInitials = useCallback(() => {
    if (authProfile?.firstName && authProfile?.lastName) {
      return `${authProfile.firstName.charAt(0).toUpperCase()}${authProfile.lastName
        .charAt(0)
        .toUpperCase()}`;
    }
    // Fallback to email initials if no profile
    if (user?.email) {
      const emailParts = user.email.split("@")[0].split(".");
      if (emailParts.length >= 2) {
        return `${emailParts[0].charAt(0).toUpperCase()}${emailParts[1]
          .charAt(0)
          .toUpperCase()}`;
      }
      return user.email.charAt(0).toUpperCase();
    }
    return "U"; // Ultimate fallback
  }, [authProfile, user]);

  // Generate full user name from profile
  const getUserFullName = useCallback(() => {
    if (authProfile?.firstName && authProfile?.lastName) {
      return `${authProfile.firstName} ${authProfile.lastName}`.trim();
    }
    // Fallback to user prop name if no profile
    return user?.name || '';
  }, [authProfile, user]);

  if (asHeader) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="User menu"
              className="inline-flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted/5 focus:outline-none focus:ring-0 focus-visible:ring-0">
              {/* Mobile: show only the dots icon */}
              <IconDotsVertical className="sm:hidden size-5" />

              {/* Desktop/web: show only avatar */}
              <span className="hidden sm:inline-flex items-center">
                <Avatar className="h-8 w-8 rounded-lg grayscale ring-0 border-0">
                  <AvatarFallback className="rounded-lg">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "bottom"}
            align="end"
            sideOffset={4}>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{getUserFullName()}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {user.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={handleProfileClick}
                disabled={isLoadingProfile}>
                <IconUserCircle />
                {isLoadingProfile ? "Loading..." : "Account"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile Modal for Header */}
        <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Update your profile information below.
              </DialogDescription>
            </DialogHeader>
            {isLoadingProfile ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">
                  Loading profile data...
                </div>
              </div>
            ) : (
            <>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName-header">First Name *</Label>
                      <Input
                        id="firstName-header"
                        value={profileFormData.firstName}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                        placeholder="Enter first name"
                        className={
                          validationErrors.firstName ? "border-red-500" : ""
                        }
                      />
                      {validationErrors.firstName && (
                        <p className="text-sm text-red-500">
                          {validationErrors.firstName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName-header">Last Name *</Label>
                      <Input
                        id="lastName-header"
                        value={profileFormData.lastName}
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                        placeholder="Enter last name"
                        className={
                          validationErrors.lastName ? "border-red-500" : ""
                        }
                      />
                      {validationErrors.lastName && (
                        <p className="text-sm text-red-500">
                          {validationErrors.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middleName-header">
                      Middle Name (Optional)
                    </Label>
                    <Input
                      id="middleName-header"
                      value={profileFormData.middleName}
                      onChange={(e) =>
                        handleInputChange("middleName", e.target.value)
                      }
                      placeholder="Enter middle name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="birthDate-header">Birth Date *</Label>
                      <Input
                        id="birthDate-header"
                        type="date"
                        value={profileFormData.birthDate}
                        onChange={(e) =>
                          handleInputChange("birthDate", e.target.value)
                        }
                        className={
                          validationErrors.birthDate ? "border-red-500" : ""
                        }
                      />
                      {validationErrors.birthDate && (
                        <p className="text-sm text-red-500">
                          {validationErrors.birthDate}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender-header">Gender</Label>
                      <select
                        id="gender-header"
                        value={profileFormData.gender}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          handleInputChange("gender", e.target.value)
                        }
                        aria-label="Gender"
                        title="Gender"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                        <option value={Gender.MALE}>Male</option>
                        <option value={Gender.FEMALE}>Female</option>
                      </select>
                    </div>
                  </div>
                  {authUser?.role !== Role.STUDENT && (
                    <div className="space-y-2">
                      <Label htmlFor="contact-header">Contact Number *</Label>
                      <Input
                        id="contact-header"
                        value={profileFormData.contact}
                        onChange={(e) =>
                          handleInputChange("contact", e.target.value)
                        }
                        placeholder="09XX XXX XXXX"
                        maxLength={13}
                        className={
                          validationErrors.contact ? "border-red-500" : ""
                        }
                      />
                      {validationErrors.contact && (
                        <p className="text-sm text-red-500">
                          {validationErrors.contact}
                        </p>
                      )}
                    </div>
                  )}
                  {authUser?.role === Role.STUDENT && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="parentName-header">
                          Parent/Guardian Full Name *
                        </Label>
                        <Input
                          id="parentName-header"
                          value={profileFormData.parentName}
                          onChange={(e) =>
                            handleInputChange("parentName", e.target.value)
                          }
                          placeholder="Enter parent/guardian full name"
                          className={
                            validationErrors.parentName ? "border-red-500" : ""
                          }
                        />
                        {validationErrors.parentName && (
                          <p className="text-sm text-red-500">
                            {validationErrors.parentName}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="parentContact-header">
                          Parent/Guardian Contact *
                        </Label>
                        <Input
                          id="parentContact-header"
                          value={profileFormData.parentContact}
                          onChange={(e) =>
                            handleInputChange("parentContact", e.target.value)
                          }
                          placeholder="09XX XXX XXXX"
                          maxLength={13}
                          className={`${
                            validationErrors.parentContact ? "border-red-500" : ""
                          }`}
                        />
                        {validationErrors.parentContact && (
                          <p className="text-sm text-red-500">
                            {validationErrors.parentContact}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="address-header">Address *</Label>
                    <Input
                      id="address-header"
                      value={profileFormData.address}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                      placeholder="Enter address"
                      className={
                        validationErrors.address ? "border-red-500" : ""
                      }
                    />
                    {validationErrors.address && (
                      <p className="text-sm text-red-500">
                        {validationErrors.address}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t border-border/50">
                  <Button
                    variant="outline"
                    onClick={() => setIsProfileModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleProfileSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground focus:outline-none focus:ring-0 focus-visible:ring-0 border-0">
                <Avatar className="h-8 w-8 rounded-lg grayscale">
                  <AvatarFallback className="rounded-lg">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{getUserFullName()}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
                <IconDotsVertical className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{getUserFullName()}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={handleProfileClick}
                  disabled={isLoadingProfile}>
                  <IconUserCircle />
                  {isLoadingProfile ? "Loading..." : "Account"}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <IconCreditCard />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <IconNotification />
                  Notifications
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <IconLogout />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Profile Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information below.
            </DialogDescription>
          </DialogHeader>
          {isLoadingProfile ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">
                Loading profile data...
              </div>
            </div>
          ) : (
            <>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={profileFormData.firstName}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                        placeholder="Enter first name"
                        className={
                          validationErrors.firstName ? "border-red-500" : ""
                        }
                      />
                      {validationErrors.firstName && (
                        <p className="text-sm text-red-500">
                          {validationErrors.firstName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={profileFormData.lastName}
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                        placeholder="Enter last name"
                        className={
                          validationErrors.lastName ? "border-red-500" : ""
                        }
                      />
                      {validationErrors.lastName && (
                        <p className="text-sm text-red-500">
                          {validationErrors.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middleName">Middle Name (Optional)</Label>
                    <Input
                      id="middleName"
                      value={profileFormData.middleName}
                      onChange={(e) =>
                        handleInputChange("middleName", e.target.value)
                      }
                      placeholder="Enter middle name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Birth Date *</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={profileFormData.birthDate}
                        onChange={(e) =>
                          handleInputChange("birthDate", e.target.value)
                        }
                        className={
                          validationErrors.birthDate ? "border-red-500" : ""
                        }
                      />
                      {validationErrors.birthDate && (
                        <p className="text-sm text-red-500">
                          {validationErrors.birthDate}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                        <select
                          id="gender"
                          value={profileFormData.gender}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          handleInputChange("gender", e.target.value)
                        }
                          aria-label="Gender"
                          title="Gender"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                          <option value={Gender.MALE}>Male</option>
                          <option value={Gender.FEMALE}>Female</option>
                        </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact">
                      Contact Number {authUser?.role !== Role.STUDENT ? "*" : ""}
                    </Label>
                    <Input
                      id="contact"
                      value={profileFormData.contact}
                      onChange={(e) =>
                        handleInputChange("contact", e.target.value)
                      }
                      placeholder="09XX XXX XXXX"
                      maxLength={13}
                      className={
                        validationErrors.contact ? "border-red-500" : ""
                      }
                    />
                    {validationErrors.contact && (
                      <p className="text-sm text-red-500">
                        {validationErrors.contact}
                      </p>
                    )}
                  </div>
                  {authUser?.role === Role.STUDENT && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="parentName">Parent/Guardian Full Name *</Label>
                        <Input
                          id="parentName"
                          value={profileFormData.parentName}
                          onChange={(e) =>
                            handleInputChange("parentName", e.target.value)
                          }
                          placeholder="Enter parent/guardian full name"
                          className={
                            validationErrors.parentName ? "border-red-500" : ""
                          }
                        />
                        {validationErrors.parentName && (
                          <p className="text-sm text-red-500">
                            {validationErrors.parentName}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="parentContact">Parent/Guardian Contact *</Label>
                        <Input
                          id="parentContact"
                          value={profileFormData.parentContact}
                          onChange={(e) =>
                            handleInputChange("parentContact", e.target.value)
                          }
                          placeholder="09XX XXX XXXX"
                          maxLength={13}
                          className={`${
                            validationErrors.parentContact ? "border-red-500" : ""
                          }`}
                        />
                        {validationErrors.parentContact && (
                          <p className="text-sm text-red-500">
                            {validationErrors.parentContact}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={profileFormData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    placeholder="Enter address"
                    className={validationErrors.address ? "border-red-500" : ""}
                  />
                  {validationErrors.address && (
                    <p className="text-sm text-red-500">
                      {validationErrors.address}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t border-border/50">
                <Button
                  variant="outline"
                  onClick={() => setIsProfileModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleProfileSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
