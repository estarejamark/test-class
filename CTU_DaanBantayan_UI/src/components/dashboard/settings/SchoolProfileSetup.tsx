"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSettings } from "@/contexts/settings.context";
import { settingsService } from "@/services/settings.service";
import { SchoolProfile } from "@/types/settings";
import { Loader2, AlertCircle, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

export function SchoolProfileSetup() {
  const { schoolProfile, loading, error, refreshSettings } = useSettings();
  const [profile, setProfile] = useState<SchoolProfile>({
    name: "",
    address: "",
    contactInfo: "",
    email: "",
    officeHours: "",
    logoUrl: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);

  useEffect(() => {
    if (schoolProfile) {
      setProfile(schoolProfile);
    }
  }, [schoolProfile]);

  const validateForm = (formData: FormData): string | null => {
    const name = formData.get("name") as string;
    const address = formData.get("address") as string;
    const contactInfo = formData.get("contactInfo") as string;
    const logoUrl = formData.get("logoUrl") as string;

    if (!name.trim()) {
      return "School name is required.";
    }

    if (!address.trim()) {
      return "Address is required.";
    }

    if (logoUrl && !logoUrl.match(/^https?:\/\/.+/)) {
      return "Logo URL must be a valid HTTP/HTTPS URL.";
    }

    return null;
  };

  const handleSave = async (formData: FormData) => {
    const validationError = validateForm(formData);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    setIsSaving(true);
    setOperationError(null);
    try {
      const updatedProfile = {
        name: formData.get("name") as string,
        address: formData.get("address") as string,
        contactInfo: formData.get("contactInfo") as string,
        email: formData.get("email") as string,
        officeHours: formData.get("officeHours") as string,
        logoUrl: formData.get("logoUrl") as string,
      };
      await settingsService.updateSchoolProfile(updatedProfile);
      await refreshSettings();
    } catch (err) {
      console.error("Failed to update school profile:", err);
      setOperationError("Failed to save school profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };



  return (
    <div className="space-y-6">
      {/* Error Display */}
      {operationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{operationError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <form action={handleSave} className="space-y-4">
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">School Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={profile.name}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                defaultValue={profile.address}
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactInfo">Contact Information</Label>
              <Input
                id="contactInfo"
                name="contactInfo"
                defaultValue={profile.contactInfo}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={profile.email}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="officeHours">Office Hours</Label>
              <Input
                id="officeHours"
                name="officeHours"
                defaultValue={profile.officeHours}
                placeholder="e.g., Mon–Fri, 7:00 AM – 4:00 PM"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                name="logoUrl"
                defaultValue={profile.logoUrl}
                placeholder="https://example.com/logo.png"
              />
            </div>



            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>


    </div>
  );
}
