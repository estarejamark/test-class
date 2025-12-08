"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/contexts/settings.context";
import { settingsService } from "@/services/settings.service";
import { SecuritySettings } from "@/types/settings";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react";

export function SecuritySetup() {
  const { securitySettings, refreshSettings } = useSettings();
  const [currentSettings, setCurrentSettings] = useState<SecuritySettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedSettings, setSelectedSettings] = useState<SecuritySettings | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Set initial settings when fetched
  useEffect(() => {
    if (securitySettings) {
      setCurrentSettings(securitySettings);
    }
  }, [securitySettings]);

  if (!securitySettings) {
    // Non-admin users → show access denied
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>You do not have access to security settings.</AlertDescription>
      </Alert>
    );
  }

  const handlePasswordPolicyUpdate = async (formData: FormData) => {
    if (!currentSettings) return;
    setIsSaving(true);
    setUpdateError(null);
    setSuccessMessage(null);
    try {
      const updated = {
        ...currentSettings,
        passwordMinLength: Number(formData.get("minLength")),
        requireNumbers: formData.get("requireNumbers") === "on",
        requireSpecialChars: formData.get("requireSpecialChars") === "on",
        passwordExpirationDays: Number(formData.get("expirationDays")),
      };
      await settingsService.updateSecuritySettings(updated);
      await refreshSettings();
      setCurrentSettings(updated);
      setSuccessMessage("Password policy updated successfully");
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Failed to update password policy");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTwoFactorUpdate = async (enabled: boolean) => {
    if (!currentSettings) return;
    setIsSaving(true);
    setUpdateError(null);
    setSuccessMessage(null);
    try {
      const updated = { ...currentSettings, twoFactorEnabled: enabled };
      await settingsService.updateSecuritySettings(updated);
      await refreshSettings();
      setCurrentSettings(updated);
      setSuccessMessage("Two-factor authentication updated successfully");
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Failed to update 2FA settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSettings = async (formData: FormData) => {
    setIsCreating(true);
    setUpdateError(null);
    setSuccessMessage(null);
    try {
      const newSettings: SecuritySettings = {
        passwordMinLength: Number(formData.get("minLength")),
        requireNumbers: formData.get("requireNumbers") === "on",
        requireSpecialChars: formData.get("requireSpecialChars") === "on",
        passwordExpirationDays: Number(formData.get("expirationDays")),
        twoFactorEnabled: formData.get("twoFactorEnabled") === "on",
        twoFactorRequiredForAdmins: formData.get("twoFactorRequiredForAdmins") === "on",
      };
      await settingsService.updateSecuritySettings(newSettings);
      await refreshSettings();
      setCurrentSettings(newSettings);
      setShowCreateDialog(false);
      setSuccessMessage("Security settings created successfully");
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Failed to create security settings");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSettings = async () => {
    if (!currentSettings) return;
    setIsDeleting(true);
    setUpdateError(null);
    setSuccessMessage(null);
    try {
      const defaults: SecuritySettings = {
        passwordMinLength: 8,
        requireNumbers: true,
        requireSpecialChars: true,
        passwordExpirationDays: 90,
        twoFactorEnabled: false,
        twoFactorRequiredForAdmins: true,
      };
      await settingsService.updateSecuritySettings(defaults);
      await refreshSettings();
      setCurrentSettings(defaults);
      setShowDeleteConfirm(false);
      setSuccessMessage("Security settings reset to defaults successfully");
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Failed to reset security settings");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error & Success */}
      {updateError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{updateError}</AlertDescription>
        </Alert>
      )}
      {successMessage && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Settings Table */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Security Settings Management</CardTitle>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create New Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Security Settings</DialogTitle>
              </DialogHeader>
              <form action={handleCreateSettings} className="space-y-4">
                <div>
                  <Label htmlFor="createMinLength">Minimum Password Length</Label>
                  <Input id="createMinLength" name="minLength" type="number" defaultValue={8} min={8} required />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="createRequireNumbers" name="requireNumbers" defaultChecked />
                  <Label htmlFor="createRequireNumbers">Require Numbers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="createRequireSpecialChars" name="requireSpecialChars" defaultChecked />
                  <Label htmlFor="createRequireSpecialChars">Require Special Characters</Label>
                </div>
                <div>
                  <Label htmlFor="createExpirationDays">Password Expiration (days)</Label>
                  <Input id="createExpirationDays" name="expirationDays" type="number" defaultValue={90} min={0} required />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="createTwoFactorEnabled" name="twoFactorEnabled" />
                  <Label htmlFor="createTwoFactorEnabled">Enable Two-Factor Authentication</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="createTwoFactorRequiredForAdmins" name="twoFactorRequiredForAdmins" defaultChecked />
                  <Label htmlFor="createTwoFactorRequiredForAdmins">Required for Administrators</Label>
                </div>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {currentSettings && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Password Policy</TableHead>
                  <TableHead>Two-Factor</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    Min: {currentSettings.passwordMinLength}, Numbers: {currentSettings.requireNumbers ? "Yes" : "No"}, Special: {currentSettings.requireSpecialChars ? "Yes" : "No"}
                  </TableCell>
                  <TableCell>{currentSettings.twoFactorEnabled ? "Enabled" : "Disabled"}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedSettings(currentSettings);
                        setShowDeleteConfirm(true);
                      }}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="password-policy" className="w-full">
        <TabsList>
          <TabsTrigger value="password-policy">Password Policy</TabsTrigger>
          <TabsTrigger value="two-factor">Two-Factor Authentication</TabsTrigger>
        </TabsList>

        <TabsContent value="password-policy">
          {currentSettings && (
            <Card>
              <CardContent className="pt-6">
                <form action={handlePasswordPolicyUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="minLength">Minimum Password Length</Label>
                    <Input id="minLength" name="minLength" type="number" defaultValue={currentSettings.passwordMinLength} min={8} required />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requireNumbers">Require Numbers</Label>
                      <Switch id="requireNumbers" name="requireNumbers" defaultChecked={currentSettings.requireNumbers} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requireSpecialChars">Require Special Characters</Label>
                      <Switch id="requireSpecialChars" name="requireSpecialChars" defaultChecked={currentSettings.requireSpecialChars} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expirationDays">Password Expiration (days)</Label>
                    <Input id="expirationDays" name="expirationDays" type="number" defaultValue={currentSettings.passwordExpirationDays} min={0} required />
                  </div>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Password Policy"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="two-factor">
          {currentSettings && (
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">Enable additional security with 2FA via OTP</p>
                  </div>
                  <Switch checked={currentSettings.twoFactorEnabled} onCheckedChange={handleTwoFactorUpdate} disabled={isSaving} />
                </div>
                {currentSettings.twoFactorEnabled && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requiredForAdmins">Required for Administrators</Label>
                      <Switch id="requiredForAdmins" defaultChecked={currentSettings.twoFactorRequiredForAdmins} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Security Settings</DialogTitle>
          </DialogHeader>
          <p>This will reset to default settings. This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSettings} disabled={isDeleting}>
              {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
