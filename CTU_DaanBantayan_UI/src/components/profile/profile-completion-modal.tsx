"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth.context";
import { CreateProfileRequest, Gender } from "@/types/api";
import { profilesService } from "@/services/profiles.service";
import { toast } from "sonner";

type ExtendedCreateProfileRequest = CreateProfileRequest & {
  parentGuardianName?: string;
  parentGuardianContact?: string;
  lrn?: string;
  password?: string;
  confirmPassword?: string;
};

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose?: () => void;
  showButton?: boolean;
  buttonText?: string;
  onButtonClick?: () => void;
}

export default function ProfileCompletionModal({
  isOpen,
  onClose,
  showButton = false,
  buttonText = "Complete Profile",
  onButtonClick,
}: ProfileCompletionModalProps) {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ExtendedCreateProfileRequest>({
    firstName: "",
    middleName: "",
    lastName: "",
    contactNumber: "",
    address: "",
    birthDate: "",
    gender: Gender.MALE,
    ...(user?.role === "STUDENT" && { parentGuardianName: "", parentGuardianContact: "", lrn: "", password: "", confirmPassword: "" }),
    ...(user?.role === "TEACHER" && { password: "", confirmPassword: "" }),
  });


  const [addressComponents, setAddressComponents] = useState({
    barangay: "",
    cityMunicipality: "",
    province: "",
  });
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  // Clear validation errors and address components when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setValidationErrors({});
      setAddressComponents({
        barangay: "",
        cityMunicipality: "",
        province: "",
      });
      setFormData((prev) => ({
        ...prev,
        address: "",
      }));
    }
  }, [isOpen]);

  const handleInputChange = (
    field: string,
    value: string
  ) => {
    let processedValue = value;

    // Format contact number as user types
    if (field === "contactNumber" || field === "parentGuardianContact") {
      // Remove all non-digits
      let digitsOnly = value.replace(/\D/g, "");

      // Only keep digits that would form a valid Philippine mobile number
      if (digitsOnly.length <= 11) {
        // Format as: 09XX XXX XXXX (always start with 09)
        if (digitsOnly.length >= 1 && !digitsOnly.startsWith("09")) {
          // If user types 9, make it 09
          if (digitsOnly.startsWith("9")) {
            digitsOnly = "0" + digitsOnly;
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

    setFormData((prev) => ({
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
  };

  const handleAddressComponentChange = (
    field: keyof typeof addressComponents,
    value: string
  ) => {
    setAddressComponents((prev) => {
      const updated = { ...prev, [field]: value };

      // Concatenate address components into single address string
      const concatenatedAddress = [
        updated.barangay,
        updated.cityMunicipality,
        updated.province,
      ]
        .filter((part) => part.trim() !== "")
        .join(", ");

      // Update the main form data address field
      setFormData((formPrev) => ({
        ...formPrev,
        address: concatenatedAddress,
      }));

      return updated;
    });

    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validation function for required fields (same as NavUser)
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};

    // First name validation
    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = "First name must be at least 2 characters";
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = "Last name must be at least 2 characters";
    }

    // Birth date validation
    if (!formData.birthDate.trim()) {
      errors.birthDate = "Birth date is required";
    } else {
      const birthDate = new Date(formData.birthDate);
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

    // Contact number validation (Philippine format: 09XX XXX XXXX)
    if (!formData.contactNumber.trim()) {
      errors.contactNumber = "Contact number is required";
    } else {
      const cleanNumber = formData.contactNumber.replace(/\s/g, "");
      if (!/^09\d{9}$/.test(cleanNumber)) {
        errors.contactNumber =
          "Please enter a valid Philippine mobile number (09XX XXX XXXX)";
      }
    }

    // Address validation - validate each component
    if (!addressComponents.barangay.trim()) {
      errors.barangay = "Barangay is required";
    } else if (addressComponents.barangay.trim().length < 2) {
      errors.barangay = "Barangay must be at least 2 characters";
    }

    if (!addressComponents.cityMunicipality.trim()) {
      errors.cityMunicipality = "City/Municipality is required";
    } else if (addressComponents.cityMunicipality.trim().length < 2) {
      errors.cityMunicipality =
        "City/Municipality must be at least 2 characters";
    }

    if (!addressComponents.province.trim()) {
      errors.province = "Province is required";
    } else if (addressComponents.province.trim().length < 2) {
      errors.province = "Province must be at least 2 characters";
    }

    // Ensure concatenated address is valid
    if (!formData.address.trim()) {
      errors.address = "Complete address is required";
    }

    // Parent/Guardian and Student-specific validation for students
    if (user?.role === "STUDENT") {
      if (!formData.parentGuardianName?.trim()) {
        errors.parentGuardianName = "Parent/Guardian name is required";
      } else if (formData.parentGuardianName.trim().length < 2) {
        errors.parentGuardianName = "Parent/Guardian name must be at least 2 characters";
      }

      if (!formData.parentGuardianContact?.trim()) {
        errors.parentGuardianContact = "Parent/Guardian contact number is required";
      } else {
        const cleanNumber = formData.parentGuardianContact.replace(/\s/g, "");
        if (!/^09\d{9}$/.test(cleanNumber)) {
          errors.parentGuardianContact =
            "Please enter a valid Philippine mobile number (09XX XXX XXXX)";
        }
      }

      // LRN validation for students
      if (!formData.lrn?.trim()) {
        errors.lrn = "LRN is required";
      } else if (!/^\d{12}$/.test(formData.lrn.trim())) {
        errors.lrn = "LRN must be exactly 12 digits";
      }

      // Password validation for students
      if (!formData.password?.trim()) {
        errors.password = "Password is required";
      } else if (formData.password.length < 8) {
        errors.password = "Password must be at least 8 characters";
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        errors.password = "Password must contain at least one uppercase letter, one lowercase letter, and one number";
      }

      if (!formData.confirmPassword?.trim()) {
        errors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }
    }

    // Password validation for teachers
    if (user?.role === "TEACHER") {
      if (!formData.password?.trim()) {
        errors.password = "Password is required";
      } else if (formData.password.length < 8) {
        errors.password = "Password must be at least 8 characters";
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        errors.password = "Password must contain at least one uppercase letter, one lowercase letter, and one number";
      }

      if (!formData.confirmPassword?.trim()) {
        errors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, addressComponents]);

  // Helper function to get redirect path based on user role
  const getRedirectPath = (role: string): string => {
    switch (role) {
      case "ADMIN":
        return "/admin-dashboard";
      case "TEACHER":
        return "/teacher-dashboard";
      case "STUDENT":
        return "/student-dashboard";
      default:
        return "/admin-dashboard"; // Default fallback
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before saving (same as NavUser)
    if (!validateForm()) {
      toast.error("Please fix the required fields before saving");
      return;
    }

    try {
      setLoading(true);

      // Create the profile
      await profilesService.createProfile(formData);

      // Try to refresh the profile in auth context
      try {
        await refreshProfile();
        toast.success("Profile created successfully!");

        // Close modal first
        if (onClose) {
          onClose();
        }

        // Redirect to appropriate dashboard based on user role
        if (user?.role) {
          const redirectPath = getRedirectPath(user.role);
          console.log("🚀 Profile completed - redirecting to:", redirectPath);
          router.push(redirectPath);
        }
      } catch (refreshError) {
        // If profile refresh fails (e.g., backend down), still show success
        // but with a note about potential sync issues
        console.warn(
          "Profile created but couldn't refresh auth context:",
          refreshError
        );
        toast.success(
          "Profile created successfully! Please refresh the page if needed."
        );

        // Still try to redirect even if refresh failed
        if (onClose) {
          onClose();
        }
        if (user?.role) {
          const redirectPath = getRedirectPath(user.role);
          router.push(redirectPath);
        }
      }
    } catch (error) {
      console.error("Failed to create profile:", error);
      toast.error("Failed to create profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen && !showButton) return null;

  return (
    <>
      {/* Redirect Button */}
      {showButton && !isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">Profile Setup Required</CardTitle>
              <CardDescription>
                Please complete your profile to continue using the system.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-6">
              <Button
                onClick={onButtonClick}
                className="w-full sm:w-auto px-6 py-2"
                size="lg">
                {buttonText}
              </Button>

            </CardContent>
          </Card>
        </div>
      )}

      {/* Profile Completion Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4"
             onClick={user?.role === "STUDENT" ? undefined : onClose}>
          <Card className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-4"
             onClick={(e) => e.stopPropagation()}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">
                Complete Your Profile
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Before you can access the system, please complete your profile
                information. This information is required for all users.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      placeholder="Enter your first name"
                      required
                      disabled={loading}
                      className={`text-sm sm:text-base ${
                        validationErrors.firstName ? "border-red-500" : ""
                      }`}
                    />
                    {validationErrors.firstName && (
                      <p className="text-sm text-red-500">
                        {validationErrors.firstName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input
                      id="middleName"
                      type="text"
                      value={formData.middleName}
                      onChange={(e) =>
                        handleInputChange("middleName", e.target.value)
                      }
                      placeholder="Enter your middle name"
                      disabled={loading}
                      className={`text-sm sm:text-base ${
                        validationErrors.middleName ? "border-red-500" : ""
                      }`}
                    />
                    {validationErrors.middleName && (
                      <p className="text-sm text-red-500">
                        {validationErrors.middleName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      placeholder="Enter your last name"
                      required
                      disabled={loading}
                      className={`text-sm sm:text-base ${
                        validationErrors.lastName ? "border-red-500" : ""
                      }`}
                    />
                    {validationErrors.lastName && (
                      <p className="text-sm text-red-500">
                        {validationErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Phone Number *</Label>
                  <Input
                    id="contactNumber"
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) =>
                      handleInputChange("contactNumber", e.target.value)
                    }
                    placeholder="09XX XXX XXXX"
                    required
                    disabled={loading}
                    className={`text-sm sm:text-base ${
                      validationErrors.contactNumber ? "border-red-500" : ""
                    }`}
                  />
                  {validationErrors.contactNumber && (
                    <p className="text-sm text-red-500">
                      {validationErrors.contactNumber}
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Address *</Label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="barangay" className="text-sm">
                        Barangay *
                      </Label>
                      <Input
                        id="barangay"
                        type="text"
                        value={addressComponents.barangay}
                        onChange={(e) =>
                          handleAddressComponentChange(
                            "barangay",
                            e.target.value
                          )
                        }
                        placeholder="Enter barangay"
                        required
                        disabled={loading}
                        className={`text-sm sm:text-base ${
                          validationErrors.barangay ? "border-red-500" : ""
                        }`}
                      />
                      {validationErrors.barangay && (
                        <p className="text-xs text-red-500">
                          {validationErrors.barangay}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cityMunicipality" className="text-sm">
                        City/Municipality *
                      </Label>
                      <Input
                        id="cityMunicipality"
                        type="text"
                        value={addressComponents.cityMunicipality}
                        onChange={(e) =>
                          handleAddressComponentChange(
                            "cityMunicipality",
                            e.target.value
                          )
                        }
                        placeholder="Enter city/municipality"
                        required
                        disabled={loading}
                        className={`text-sm sm:text-base ${
                          validationErrors.cityMunicipality
                            ? "border-red-500"
                            : ""
                        }`}
                      />
                      {validationErrors.cityMunicipality && (
                        <p className="text-xs text-red-500">
                          {validationErrors.cityMunicipality}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="province" className="text-sm">
                        Province *
                      </Label>
                      <Input
                        id="province"
                        type="text"
                        value={addressComponents.province}
                        onChange={(e) =>
                          handleAddressComponentChange(
                            "province",
                            e.target.value
                          )
                        }
                        placeholder="Enter province"
                        required
                        disabled={loading}
                        className={`text-sm sm:text-base ${
                          validationErrors.province ? "border-red-500" : ""
                        }`}
                      />
                      {validationErrors.province && (
                        <p className="text-xs text-red-500">
                          {validationErrors.province}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Display concatenated address */}
                  {formData.address && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-md border">
                      <Label className="text-xs text-muted-foreground mb-1 block">
                        Full Address:
                      </Label>
                      <p className="text-sm font-medium">{formData.address}</p>
                    </div>
                  )}

                  {validationErrors.address && (
                    <p className="text-sm text-red-500">
                      {validationErrors.address}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Date of Birth *</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) =>
                        handleInputChange("birthDate", e.target.value)
                      }
                      required
                      disabled={loading}
                      className={`text-sm sm:text-base ${
                        validationErrors.birthDate ? "border-red-500" : ""
                      }`}
                    />
                    {validationErrors.birthDate && (
                      <p className="text-sm text-red-500">
                        {validationErrors.birthDate}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) =>
                        handleInputChange("gender", value as Gender)
                      }
                      disabled={loading}>
                      <SelectTrigger className="text-sm sm:text-base">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Gender.MALE}>Male</SelectItem>
                        <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Parent/Guardian fields for students only */}
                {user?.role === "STUDENT" && (
                  <div className="space-y-4">
                    <div className="border-t pt-4">
                      <Label className="text-base font-medium text-green-700">
                        Parent/Guardian Information
                      </Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        Please provide your parent or guardian&apos;s contact information for emergency purposes.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="parentGuardianName">Parent/Guardian Name *</Label>
                          <Input
                            id="parentGuardianName"
                            type="text"
                            value={formData.parentGuardianName || ""}
                            onChange={(e) =>
                              handleInputChange("parentGuardianName", e.target.value)
                            }
                            placeholder="Enter parent/guardian name"
                            required={user?.role === "STUDENT"}
                            disabled={loading}
                            className={`text-sm sm:text-base ${
                              validationErrors.parentGuardianName ? "border-red-500" : ""
                            }`}
                          />
                          {validationErrors.parentGuardianName && (
                            <p className="text-sm text-red-500">
                              {validationErrors.parentGuardianName}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="parentGuardianContact">Parent/Guardian Contact *</Label>
                          <Input
                            id="parentGuardianContact"
                            type="tel"
                            value={formData.parentGuardianContact || ""}
                            onChange={(e) =>
                              handleInputChange("parentGuardianContact", e.target.value)
                            }
                            placeholder="09XX XXX XXXX"
                            required={user?.role === "STUDENT"}
                            disabled={loading}
                            className={`text-sm sm:text-base ${
                              validationErrors.parentGuardianContact ? "border-red-500" : ""
                            }`}
                          />
                          {validationErrors.parentGuardianContact && (
                            <p className="text-sm text-red-500">
                              {validationErrors.parentGuardianContact}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <Label className="text-base font-medium text-purple-700">
                        Student Information
                      </Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        Please provide your Learner Reference Number (LRN) and set your password.
                      </p>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="lrn">Learner Reference Number (LRN) *</Label>
                          <Input
                            id="lrn"
                            type="text"
                            value={formData.lrn || ""}
                            onChange={(e) =>
                              handleInputChange("lrn", e.target.value)
                            }
                            placeholder="Enter your 12-digit LRN"
                            required={user?.role === "STUDENT"}
                            disabled={loading}
                            className={`text-sm sm:text-base ${
                              validationErrors.lrn ? "border-red-500" : ""
                            }`}
                          />
                          {validationErrors.lrn && (
                            <p className="text-sm text-red-500">
                              {validationErrors.lrn}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="studentPassword">Password *</Label>
                            <Input
                              id="studentPassword"
                              type="password"
                              value={formData.password || ""}
                              onChange={(e) =>
                                handleInputChange("password", e.target.value)
                              }
                              placeholder="Enter your password"
                              required={user?.role === "STUDENT"}
                              disabled={loading}
                              className={`text-sm sm:text-base ${
                                validationErrors.password ? "border-red-500" : ""
                              }`}
                            />
                            {validationErrors.password && (
                              <p className="text-sm text-red-500">
                                {validationErrors.password}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="studentConfirmPassword">Confirm Password *</Label>
                            <Input
                              id="studentConfirmPassword"
                              type="password"
                              value={formData.confirmPassword || ""}
                              onChange={(e) =>
                                handleInputChange("confirmPassword", e.target.value)
                              }
                              placeholder="Confirm your password"
                              required={user?.role === "STUDENT"}
                              disabled={loading}
                              className={`text-sm sm:text-base ${
                                validationErrors.confirmPassword ? "border-red-500" : ""
                              }`}
                            />
                            {validationErrors.confirmPassword && (
                              <p className="text-sm text-red-500">
                                {validationErrors.confirmPassword}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Password fields for teachers only */}
                {user?.role === "TEACHER" && (
                  <div className="space-y-4">
                    <div className="border-t pt-4">
                      <Label className="text-base font-medium text-blue-700">
                        Set Your Password
                      </Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        As a teacher, you need to set your own password for security.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="password">Password *</Label>
                          <Input
                            id="password"
                            type="password"
                            value={formData.password || ""}
                            onChange={(e) =>
                              handleInputChange("password", e.target.value)
                            }
                            placeholder="Enter your password"
                            required={user?.role === "TEACHER"}
                            disabled={loading}
                            className={`text-sm sm:text-base ${
                              validationErrors.password ? "border-red-500" : ""
                            }`}
                          />
                          {validationErrors.password && (
                            <p className="text-sm text-red-500">
                              {validationErrors.password}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm Password *</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={formData.confirmPassword || ""}
                            onChange={(e) =>
                              handleInputChange("confirmPassword", e.target.value)
                            }
                            placeholder="Confirm your password"
                            required={user?.role === "TEACHER"}
                            disabled={loading}
                            className={`text-sm sm:text-base ${
                              validationErrors.confirmPassword ? "border-red-500" : ""
                            }`}
                          />
                          {validationErrors.confirmPassword && (
                            <p className="text-sm text-red-500">
                              {validationErrors.confirmPassword}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 pb-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 text-sm sm:text-base">
                    {loading ? "Creating Profile..." : "Complete Profile"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
