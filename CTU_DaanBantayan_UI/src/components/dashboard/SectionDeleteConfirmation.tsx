import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SectionDependencyResponse } from "@/types/api";

interface SectionDeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (forceDelete: boolean) => void;
  sectionName: string;
  dependencies: SectionDependencyResponse | null;
  isLoading?: boolean;
}

export function SectionDeleteConfirmation({
  isOpen,
  onClose,
  onConfirm,
  sectionName,
  dependencies,
  isLoading = false,
}: SectionDeleteConfirmationProps) {
  const handleSafeDelete = () => {
    onConfirm(false);
  };

  const handleForceDelete = () => {
    onConfirm(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Delete Section: {sectionName}
            <Badge variant="destructive">Delete</Badge>
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this section? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {dependencies && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-sm text-gray-900 mb-2">
                Section Information
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Grade Level:</span> {dependencies.gradeLevel}
                </div>
                <div>
                  <span className="font-medium">Adviser:</span>{" "}
                  {dependencies.adviser.firstName && dependencies.adviser.lastName
                    ? `${dependencies.adviser.firstName} ${dependencies.adviser.lastName}`
                    : dependencies.adviser.name || dependencies.adviser.fullName || "Unknown"}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-900">
                Dependencies Found
              </h4>

              {dependencies.dependencies.hasClassEnrollments && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Students
                    </Badge>
                    <span className="text-sm font-medium">
                      {dependencies.dependencies.classEnrollmentsCount} enrolled student(s)
                    </span>
                  </div>
                  {dependencies.dependencies.enrolledStudents && (
                    <div className="text-xs text-gray-600">
                      <div className="font-medium mb-1">Enrolled Students:</div>
                      <div className="space-y-1">
                        {dependencies.dependencies.enrolledStudents.map((student) => (
                          <div key={student.id} className="flex justify-between">
                            <span>{student.fullName || `${student.firstName} ${student.lastName}`}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {dependencies.dependencies.hasScheduleEntries && (
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      Schedules
                    </Badge>
                    <span className="text-sm font-medium">
                      {dependencies.dependencies.scheduleEntriesCount} schedule entry(ies)
                    </span>
                  </div>
                  {dependencies.dependencies.scheduleEntries && (
                    <div className="text-xs text-gray-600">
                      <div className="font-medium mb-1">Schedule Entries:</div>
                      <div className="space-y-1">
                        {dependencies.dependencies.scheduleEntries.map((schedule) => (
                          <div key={schedule.id} className="flex justify-between">
                            <span>{schedule.subjectName}</span>
                            <span>{schedule.teacherName}</span>
                            <span>{schedule.startTime}-{schedule.endTime}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!dependencies.dependencies.hasClassEnrollments &&
               !dependencies.dependencies.hasScheduleEntries && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Clean
                    </Badge>
                    <span className="text-sm font-medium">
                      No dependencies found - safe to delete
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg">
              <h4 className="font-semibold text-sm text-yellow-800 mb-2">
                Deletion Options
              </h4>
              <div className="space-y-1 text-xs text-yellow-700">
                {dependencies.dependencies.deleteOptions.map((option, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span>•</span>
                    <span>{option}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>

          {dependencies?.dependencies.canDelete && (
            <Button
              onClick={handleSafeDelete}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? "Deleting..." : "Delete Section"}
            </Button>
          )}

          {(!dependencies?.dependencies.canDelete || dependencies?.dependencies.hasClassEnrollments || dependencies?.dependencies.hasScheduleEntries) && (
            <Button
              onClick={handleForceDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "Force Deleting..." : "Force Delete (Remove Dependencies)"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
