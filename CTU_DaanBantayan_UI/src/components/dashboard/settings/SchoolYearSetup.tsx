"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSettings } from "@/contexts/settings.context";
import { settingsService } from "@/services/settings.service";
import { SchoolYear } from "@/types/settings";
import { QuarterManagement } from "./QuarterManagement";
import { Loader2, AlertCircle, CheckCircle, Calendar } from "lucide-react";

export function SchoolYearSetup() {
  const { schoolYear: activeYear, schoolYears, loading, error, refreshSettings } = useSettings();
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedYear, setSelectedYear] = useState<SchoolYear | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateForm = (formData: FormData): string | null => {
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;

    if (!startDate || !endDate) {
      return "Start date and end date are required.";
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // For school years, we allow the end date to be in the next calendar year
    // But ensure the end year is exactly one year after the start year
    if (end.getFullYear() !== start.getFullYear() + 1) {
      return "School year must span exactly one calendar year (e.g., 2024-2025).";
    }

    // Ensure start date is before end date (allowing cross-year span)
    if (start >= end) {
      return "End date must be after start date.";
    }

    return null;
  };

  const handleCreateYear = async (formData: FormData) => {
    const validationError = validateForm(formData);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    setOperationError(null);
    setSuccessMessage(null);
    setIsCreating(true);
    try {
      const startDate = formData.get("startDate") as string;
      const endDate = formData.get("endDate") as string;
      const startYear = new Date(startDate).getFullYear();
      const endYear = new Date(endDate).getFullYear();
      const yearRange = `${startYear}-${endYear}`;

      const newYear = {
        yearRange,
        startDate,
        endDate,
        termType: "QUARTER" as const,
        isActive: false,
        isArchived: false,
      };
      await settingsService.createSchoolYear(newYear);
      await refreshSettings();
      setSuccessMessage("School year created successfully!");
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to create school year:", err);
      setOperationError(err instanceof Error ? err.message : "Failed to create school year. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleArchive = async (year: SchoolYear) => {
    setIsArchiving(true);
    setOperationError(null);
    try {
      await settingsService.archiveSchoolYear(year.id);
      await refreshSettings();
      setShowArchiveConfirm(false);
    } catch (err) {
      console.error("Failed to archive school year:", err);
      setOperationError("Failed to archive school year. Please try again.");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async (year: SchoolYear) => {
    setIsDeleting(true);
    setOperationError(null);
    try {
      await settingsService.deleteSchoolYear(year.id);
      await refreshSettings();
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error("Failed to delete school year:", err);
      setOperationError("Failed to delete school year. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };



  return (
    <div className="space-y-6">
      {/* Success Display */}
      {successMessage && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {operationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{operationError}</AlertDescription>
        </Alert>
      )}

      {/* Create New School Year */}
      <Dialog>
        <DialogTrigger asChild>
          <Button disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create New School Year"
            )}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New School Year</DialogTitle>
          </DialogHeader>
          <form action={handleCreateYear} className="space-y-4">
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                required
              />
            </div>
            <div>
              <Label htmlFor="termType">Term Type</Label>
              <Input
                id="termType"
                name="termType"
                value="Quarter"
                readOnly
                className="bg-muted"
              />
            </div>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* School Years Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School Year</TableHead>
                <TableHead>Term Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schoolYears.map((year) => (
                <TableRow key={year.id}>
                  <TableCell>
                    {new Date(year.startDate).getFullYear()} - {new Date(year.endDate).getFullYear()}
                  </TableCell>
                  <TableCell>Quarter</TableCell>
                  <TableCell>
                    {year.isArchived ? "Archived" : year.isActive ? "Active" : "Inactive"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {!year.isArchived && !year.isActive && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline">
                              Set Active
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Activate School Year</DialogTitle>
                            </DialogHeader>
                            <p>
                              Are you sure you want to activate the school year{" "}
                              {new Date(year.startDate).getFullYear()} - {new Date(year.endDate).getFullYear()}?
                              This will deactivate the current active school year and any active quarters.
                            </p>
                            <div className="flex justify-end gap-3">
                              <DialogTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogTrigger>
                              <Button
                                onClick={async () => {
                                  try {
                                    await settingsService.activateSchoolYear(year.id);
                                    await refreshSettings();
                                  } catch (err) {
                                    console.error("Failed to activate school year:", err);
                                    setOperationError(
                                      err instanceof Error
                                        ? err.message
                                        : "Failed to activate school year. Please try again."
                                    );
                                  }
                                }}
                              >
                                Confirm Activation
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      {!year.isArchived && year.isActive && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Calendar className="h-4 w-4 mr-1" />
                              Manage Quarters
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Manage Quarters for {new Date(year.startDate).getFullYear()} - {new Date(year.endDate).getFullYear()}</DialogTitle>
                            </DialogHeader>
                            <QuarterManagement schoolYearId={year.id} />
                          </DialogContent>
                        </Dialog>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedYear(year);
                          setShowArchiveConfirm(true);
                        }}
                        disabled={isArchiving}
                      >
                        {year.isArchived ? "Unarchive" : "Archive"}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setSelectedYear(year);
                          setShowDeleteConfirm(true);
                        }}
                        disabled={isDeleting}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Archive Confirmation Dialog */}
      <Dialog open={showArchiveConfirm} onOpenChange={setShowArchiveConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedYear?.isArchived ? "Unarchive" : "Archive"} School Year
            </DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to {selectedYear?.isArchived ? "unarchive" : "archive"} the school year{" "}
            {selectedYear && `${new Date(selectedYear.startDate).getFullYear()} - ${new Date(selectedYear.endDate).getFullYear()}`}?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowArchiveConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => selectedYear && handleArchive(selectedYear)}
              disabled={isArchiving}
            >
              {isArchiving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {selectedYear?.isArchived ? "Unarchiving..." : "Archiving..."}
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete School Year</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to permanently delete the school year{" "}
            {selectedYear && `${new Date(selectedYear.startDate).getFullYear()} - ${new Date(selectedYear.endDate).getFullYear()}`}?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedYear && handleDelete(selectedYear)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
}
