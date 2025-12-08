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
import { AlertTriangle } from "lucide-react";

interface AdviserDeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  adviserName: string;
  sectionNames: string[];
  isLoading?: boolean;
  error?: string | null;
}

export function AdviserDeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  adviserName,
  sectionNames,
  isLoading = false,
  error,
}: AdviserDeleteConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Delete Adviser
            <Badge variant="destructive">Warning</Badge>
          </DialogTitle>
          <DialogDescription className="space-y-3">
            <p>
              You are about to delete <span className="font-medium text-foreground">"{adviserName}"</span>,
              who is currently assigned as an adviser to the following section(s):
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded p-3">
              <ul className="list-disc list-inside space-y-1">
                {sectionNames.map((section, index) => (
                  <li key={index} className="text-sm font-medium text-orange-800">
                    {section}
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-sm text-muted-foreground">
              <strong>Important:</strong> Deleting this adviser will remove their assignment from these sections.
              The sections will remain but will show as "No Adviser Assigned" until a new adviser is appointed.
              All academic records associated with this adviser will be preserved.
            </div>
            <div className="text-sm font-medium text-red-600">
              This action cannot be undone. Are you sure you want to proceed?
            </div>
          </DialogDescription>
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? "Deleting..." : "Delete Adviser"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
