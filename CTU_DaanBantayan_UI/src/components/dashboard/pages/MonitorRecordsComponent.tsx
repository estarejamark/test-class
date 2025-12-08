import React, { useState, useEffect } from "react";
import {
  DataManagementTable,
  TableColumn,
  FormField,
  FilterOption,
  BaseItem,
} from "../DataManagementTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  CheckCircle,
  XCircle,
  Upload,
  Search,
  Filter,
  Calendar,
  User,
  BookOpen,
} from "lucide-react";
import { recordsService } from "@/services/records.service";
import {
  QuarterPackageResponse,
  PackageStatus,
  Quarter,
  RecordApprovalResponse,
} from "@/types/api";

export function MonitorRecordsComponent() {
  const [packages, setPackages] = useState<QuarterPackageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [selectedPackage, setSelectedPackage] = useState<QuarterPackageResponse | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [actionType, setActionType] = useState<"approve" | "return" | null>(null);

  // Define table columns
  const columns: TableColumn[] = [
    {
      key: "sectionName",
      label: "Section",
      searchable: true,
      render: (value: unknown) => (
        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
          {value as string}
        </span>
      ),
    },
    {
      key: "adviserName",
      label: "Adviser",
      searchable: true,
    },
    {
      key: "quarter",
      label: "Quarter",
      searchable: true,
      render: (value: unknown) => (
        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
          {value as string}
        </span>
      ),
    },
    {
      key: "submittedAt",
      label: "Date Submitted",
      render: (value: unknown) => {
        const date = value as string;
        return (
          <div className="flex items-center gap-1 text-sm">
            <Calendar className="h-3 w-3" />
            {date ? new Date(date).toLocaleDateString() : "Not submitted"}
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (value: unknown) => {
        const status = value as PackageStatus;
        const getStatusBadgeVariant = (status: PackageStatus) => {
          switch (status) {
            case PackageStatus.PENDING:
              return "secondary"; // yellow
            case PackageStatus.APPROVED:
              return "default"; // green
            case PackageStatus.RETURNED:
              return "destructive"; // red
            case PackageStatus.PUBLISHED:
              return "outline"; // blue
            default:
              return "secondary";
          }
        };

        return (
          <Badge variant={getStatusBadgeVariant(status)}>
            {status}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: unknown, item: unknown) => {
        const pkg = item as any;
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewDetails(pkg)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {pkg.status === PackageStatus.PENDING && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleApprove(pkg)}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReturn(pkg)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </>
            )}
            {pkg.status === PackageStatus.APPROVED && (
              <Button
                variant="default"
                size="sm"
                onClick={() => handlePublish(pkg)}
              >
                <Upload className="h-4 w-4 mr-1" />
                Publish
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  // Define filter options
  const getFilterOptions = (): FilterOption[] => [
    {
      key: "status",
      label: "Status",
      options: [
        { value: PackageStatus.PENDING, label: "Pending" },
        { value: PackageStatus.APPROVED, label: "Approved" },
        { value: PackageStatus.RETURNED, label: "Returned" },
        { value: PackageStatus.PUBLISHED, label: "Published" },
      ],
    },
    {
      key: "quarter",
      label: "Quarter",
      options: [
        { value: Quarter.Q1, label: "Q1" },
        { value: Quarter.Q2, label: "Q2" },
        { value: Quarter.Q3, label: "Q3" },
        { value: Quarter.Q4, label: "Q4" },
      ],
    },
  ];

  // Load packages
  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await recordsService.getPendingPackages();
      setPackages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load packages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  // Handle actions
  const handleViewDetails = (pkg: QuarterPackageResponse) => {
    setSelectedPackage(pkg);
    setShowDetailsModal(true);
  };

  const handleApprove = (pkg: QuarterPackageResponse) => {
    setSelectedPackage(pkg);
    setActionType("approve");
    setRemarks("");
    setShowRemarksModal(true);
  };

  const handleReturn = (pkg: QuarterPackageResponse) => {
    setSelectedPackage(pkg);
    setActionType("return");
    setRemarks("");
    setShowRemarksModal(true);
  };

  const handlePublish = (pkg: QuarterPackageResponse) => {
    setSelectedPackage(pkg);
    setShowPublishModal(true);
  };

  const confirmAction = async () => {
    if (!selectedPackage || !actionType) return;

    try {
      if (actionType === "approve") {
        await recordsService.approvePackage(selectedPackage.id);
      } else if (actionType === "return") {
        await recordsService.returnPackage(selectedPackage.id, remarks);
      }
      await loadPackages(); // Refresh data
      setShowRemarksModal(false);
      setSelectedPackage(null);
      setActionType(null);
      setRemarks("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    }
  };

  const confirmPublish = async () => {
    if (!selectedPackage) return;

    try {
      await recordsService.publishPackage(selectedPackage.id);
      await loadPackages(); // Refresh data
      setShowPublishModal(false);
      setSelectedPackage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    }
  };

  // Transform packages for DataManagementTable
  const transformedPackages = packages.map((pkg) => ({
    id: pkg.id,
    sectionName: pkg.section.name,
    adviserName: pkg.adviser?.fullName || "No Adviser",
    quarter: pkg.quarter,
    submittedAt: pkg.submittedAt,
    status: pkg.status,
    actions: pkg, // Pass the full package for actions
  }));

  // Status badge colors
  const getStatusBadgeVariant = (status: PackageStatus) => {
    switch (status) {
      case PackageStatus.PENDING:
        return "secondary"; // yellow
      case PackageStatus.APPROVED:
        return "default"; // green
      case PackageStatus.RETURNED:
        return "destructive"; // red
      case PackageStatus.PUBLISHED:
        return "outline"; // blue
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading packages...</p>
        </div>
      </div>
    );
  }

  if (error && packages.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading packages</p>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => loadPackages()}
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
        title="Monitor Records"
        description="Review and approve quarter packages"
        data={transformedPackages as unknown as BaseItem[]}
        columns={columns}
        formFields={[]}
        filterOptions={getFilterOptions()}
        searchPlaceholder="Search by section or adviser..."
        showAddButton={false}
        actions={{
          edit: false,
          statusToggle: false,
          delete: false,
        }}
      />

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Package Details</DialogTitle>
            <DialogDescription>
              Review the contents of this quarter package
            </DialogDescription>
          </DialogHeader>
          {selectedPackage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Section</Label>
                  <p className="text-sm text-muted-foreground">{selectedPackage.section.name}</p>
                </div>
                <div>
                  <Label>Adviser</Label>
                  <p className="text-sm text-muted-foreground">{selectedPackage.adviser?.fullName || "No Adviser"}</p>
                </div>
                <div>
                  <Label>Quarter</Label>
                  <p className="text-sm text-muted-foreground">{selectedPackage.quarter}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={getStatusBadgeVariant(selectedPackage.status)}>
                    {selectedPackage.status}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Package Contents</Label>
                <div className="mt-2 p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    This package contains grades, attendance records, and teacher feedback for the quarter.
                    Full details would be displayed here including student performance data.
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Remarks Modal */}
      <Dialog open={showRemarksModal} onOpenChange={setShowRemarksModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Confirm Approval" : "Return with Remarks"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Are you sure you want to approve this package?"
                : "Please provide remarks for returning this package."}
            </DialogDescription>
          </DialogHeader>
          {actionType === "return" && (
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Input
                id="remarks"
                placeholder="Enter remarks for the teacher..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemarksModal(false)}>
              Cancel
            </Button>
            <Button onClick={confirmAction} disabled={actionType === "return" && !remarks.trim()}>
              {actionType === "approve" ? "Approve" : "Return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish Modal */}
      <Dialog open={showPublishModal} onOpenChange={setShowPublishModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Package</DialogTitle>
            <DialogDescription>
              Publishing this package will make the records official and prevent further edits.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishModal(false)}>
              Cancel
            </Button>
            <Button onClick={confirmPublish}>
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
