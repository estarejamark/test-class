"use client";

import { useState, useEffect, FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { settingsService } from "@/services/settings.service";
import { SchoolYearQuarter, SchoolYear } from "@/types/settings";
import { Loader2, AlertCircle, CheckCircle, Edit, Plus, Trash2, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/auth.context";

interface QuarterManagementProps {
  schoolYearId: number;
}

export function QuarterManagement({ schoolYearId }: QuarterManagementProps) {
  const { isAdmin } = useAuth();
  const [quarters, setQuarters] = useState<SchoolYearQuarter[]>([]);
  const [schoolYear, setSchoolYear] = useState<SchoolYear | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<SchoolYearQuarter | null>(null);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    quarter: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchSchoolYearAndQuarters();
  }, [schoolYearId]);

  const fetchSchoolYearAndQuarters = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch school year data
      const schoolYears = await settingsService.getSchoolYears();
      const currentSchoolYear = schoolYears.find(sy => sy.id === schoolYearId);

      if (!currentSchoolYear) {
        throw new Error('School year not found');
      }

      setSchoolYear(currentSchoolYear);

      // Fetch quarters for this school year
      const quartersData = await settingsService.getQuartersBySchoolYear(schoolYearId);
      setQuarters(quartersData);
    } catch (err) {
      console.error("Failed to fetch school year and quarters:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuarters = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await settingsService.getQuartersBySchoolYear(schoolYearId);
      setQuarters(data);
    } catch (err) {
      console.error("Failed to fetch quarters:", err);
      setError(err instanceof Error ? err.message : "Failed to load quarters");
    } finally {
      setLoading(false);
    }
  };

  const handleActivateQuarter = async (quarter: SchoolYearQuarter) => {
    try {
      await settingsService.activateQuarter(quarter.id);
      await fetchQuarters();
      setSuccessMessage("Quarter activated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to activate quarter:", err);
      setError(err instanceof Error ? err.message : "Failed to activate quarter");
    }
  };

  const handleCloseQuarter = async (quarter: SchoolYearQuarter) => {
    try {
      await settingsService.closeQuarter(quarter.id);
      await fetchQuarters();
      setSuccessMessage("Quarter closed successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to close quarter:", err);
      setError(err instanceof Error ? err.message : "Failed to close quarter");
    }
  };

  const handleCreateQuarter = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const quarter = formData.get('quarter') as 'Q1' | 'Q2' | 'Q3' | 'Q4';
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;

    // Validation
    if (!quarter || !startDate || !endDate) {
      setError("All fields are required");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      setError("End date must be after start date");
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      await settingsService.createQuarter(schoolYearId, { quarter, startDate, endDate });
      await fetchQuarters();
      setShowCreateDialog(false);
      setFormData({ quarter: '', startDate: '', endDate: '' });
      setSuccessMessage("Quarter created successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to create quarter:", err);
      setError(err instanceof Error ? err.message : "Failed to create quarter");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditQuarter = (quarter: SchoolYearQuarter) => {
    setSelectedQuarter(quarter);
    setFormData({
      quarter: quarter.quarter as string,
      startDate: new Date(quarter.startDate).toISOString().split('T')[0], // Extract date part
      endDate: new Date(quarter.endDate).toISOString().split('T')[0]
    });
    setShowEditDialog(true);
  };

  const handleUpdateQuarter = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedQuarter) return;

    const formData = new FormData(event.currentTarget);
    const quarter = formData.get('quarter') as 'Q1' | 'Q2' | 'Q3' | 'Q4';
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;

    // Validation
    if (!quarter || !startDate || !endDate) {
      setError("All fields are required");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      setError("End date must be after start date");
      return;
    }

    setIsEditing(true);
    setError(null);
    try {
      await settingsService.updateQuarter(selectedQuarter.id, { quarter, startDate, endDate });
      await fetchQuarters();
      setShowEditDialog(false);
      setSelectedQuarter(null);
      setFormData({ quarter: '', startDate: '', endDate: '' });
      setSuccessMessage("Quarter updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to update quarter:", err);
      setError(err instanceof Error ? err.message : "Failed to update quarter");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteQuarter = async () => {
    if (!selectedQuarter) return;

    setIsDeleting(true);
    setError(null);
    try {
      await settingsService.deleteQuarter(selectedQuarter.id);
      await fetchQuarters();
      setShowDeleteDialog(false);
      setSelectedQuarter(null);
      setSuccessMessage("Quarter deleted successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to delete quarter:", err);
      setError(err instanceof Error ? err.message : "Failed to delete quarter");
    } finally {
      setIsDeleting(false);
    }
  };

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-red-100 text-red-800';
      case 'UPCOMING':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading quarters...</span>
      </div>
    );
  }

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
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Quarters</h3>
        {isAdmin && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Quarter
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Quarter</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Add a new quarter to the school year
              </p>
            </DialogHeader>
            <form onSubmit={handleCreateQuarter} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-quarter">Quarter</Label>
                <Select name="quarter" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select quarter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Q1">Q1</SelectItem>
                    <SelectItem value="Q2">Q2</SelectItem>
                    <SelectItem value="Q3">Q3</SelectItem>
                    <SelectItem value="Q4">Q4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-startDate">Start Date</Label>
                <Input
                  id="create-startDate"
                  name="startDate"
                  type="date"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-endDate">End Date</Label>
                <Input
                  id="create-endDate"
                  name="endDate"
                  type="date"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Quarter"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
          )}
      </div>

      {/* Quarters Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quarter</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quarters.map((quarter) => (
                <TableRow key={quarter.id}>
                  <TableCell className="font-medium">{quarter.quarter}</TableCell>
                  <TableCell>{new Date(quarter.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(quarter.endDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(quarter.status)}>
                      {quarter.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {isAdmin && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditQuarter(quarter)}
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </>
                      )}
                      {quarter.status === 'UPCOMING' && isAdmin && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleActivateQuarter(quarter)}
                          >
                            Activate
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedQuarter(quarter);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </>
                      )}
                      {quarter.status === 'ACTIVE' && isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCloseQuarter(quarter)}
                        >
                          Close
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Quarter Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Quarter</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Update quarter details
            </p>
          </DialogHeader>
          <form onSubmit={handleUpdateQuarter} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-quarter">Quarter</Label>
              <Select name="quarter" defaultValue={formData.quarter} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select quarter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Q1">Q1</SelectItem>
                  <SelectItem value="Q2">Q2</SelectItem>
                  <SelectItem value="Q3">Q3</SelectItem>
                  <SelectItem value="Q4">Q4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-startDate">Start Date</Label>
              <Input
                id="edit-startDate"
                name="startDate"
                type="date"
                defaultValue={formData.startDate}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-endDate">End Date</Label>
              <Input
                id="edit-endDate"
                name="endDate"
                type="date"
                defaultValue={formData.endDate}
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isEditing}>
                {isEditing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Quarter"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quarter</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete {selectedQuarter?.quarter}? This action cannot be undone.
            </p>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteQuarter}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Quarter"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
