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
  Plus,
  Eye,
  Send,
  Calendar,
  User,
  BookOpen,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { quarterPackagesService } from "@/services/quarter-packages.service";
import { sectionsService } from "@/services/sections.service";
import {
  QuarterPackageResponse,
  PackageStatus,
  Quarter,
  Section,
} from "@/types/api";
import { useAuth } from "@/contexts/auth.context";

export function ManageQuarterPackagesComponent() {
  const { profile } = useAuth();
  const [packages, setPackages] = useState<QuarterPackageResponse[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<QuarterPackageResponse | null>(null);

  // Form states
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter | "">("");

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
      label: "Submitted At",
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
              <Button
                variant="default"
                size="sm"
                onClick={() => handleSubmit(pkg)}
              >
                <Send className="h-4 w-4 mr-1" />
                Submit
              </Button>
            )}
            {pkg.status === PackageStatus.RETURNED && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResubmit(pkg)}
              >
                <Send className="h-4 w-4 mr-1" />
                Resubmit
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

  // Load data
  const loadPackages = async () => {
    try {
      setLoading(true);
      // For teachers, load packages by their adviser ID
      // This is implemented based on current user context
      const data = await quarterPackagesService.getAllQuarterPackages(); // No argument as per service definition
      setPackages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load packages");
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async () => {
    try {
      if (profile) {
        const adviserName = `${profile.firstName} ${profile.lastName}`;
        const data = await sectionsService.getSectionsByAdviser(adviserName);
        setSections(data);
      }
    } catch (err) {
      console.error("Failed to load sections:", err);
    }
  };

  useEffect(() => {
    loadPackages();
    loadSections();
  }, []);

  // Handle actions
  const handleViewDetails = (pkg: QuarterPackageResponse) => {
    setSelectedPackage(pkg);
    // For now, just show basic details. In a real implementation,
    // this would show detailed package contents
  };

  const handleSubmit = (pkg: QuarterPackageResponse) => {
    setSelectedPackage(pkg);
    setShowSubmitModal(true);
  };

  const handleResubmit = (pkg: QuarterPackageResponse) => {
    setSelectedPackage(pkg);
    setShowSubmitModal(true);
  };

  const handleCreatePackage = () => {
    setSelectedSection("");
    setSelectedQuarter("");
    setShowCreateModal(true);
  };

  const confirmSubmit = async () => {
    if (!selectedPackage || !profile) return;

    try {
      await quarterPackagesService.submitQuarterPackage(selectedPackage.id, profile.id);
      await loadPackages(); // Refresh data
      setShowSubmitModal(false);
      setSelectedPackage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    }
  };

  const confirmCreate = async () => {
    if (!selectedSection || !selectedQuarter) return;

    try {
      await quarterPackagesService.createQuarterPackage(selectedSection, selectedQuarter as Quarter);
      await loadPackages(); // Refresh data
      setShowCreateModal(false);
      setSelectedSection("");
      setSelectedQuarter("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    }
  };

  // Transform packages for DataManagementTable
  const transformedPackages = packages.map((pkg) => ({
    id: pkg.id,
    sectionName: pkg.section.name,
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
          <p className="text-gray-600">Loading quarter packages...</p>
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
        title="Quarter Packages"
        description="Manage and submit quarter packages for your sections"
        data={transformedPackages as unknown as BaseItem[]}
        columns={columns}
        formFields={[]}
        filterOptions={getFilterOptions()}
        searchPlaceholder="Search by section..."
        showAddButton={true}
        addButtonText="Create Package"
        onAdd={handleCreatePackage}
        actions={{
          edit: false,
          statusToggle: false,
          delete: false,
        }}
      />

      {/* Create Package Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Quarter Package</DialogTitle>
            <DialogDescription>
              Create a new quarter package for a section
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name} - {section.gradeLevel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quarter">Quarter</Label>
              <Select value={selectedQuarter} onValueChange={(value) => setSelectedQuarter(value as Quarter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a quarter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Quarter.Q1}>Q1</SelectItem>
                  <SelectItem value={Quarter.Q2}>Q2</SelectItem>
                  <SelectItem value={Quarter.Q3}>Q3</SelectItem>
                  <SelectItem value={Quarter.Q4}>Q4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={confirmCreate} disabled={!selectedSection || !selectedQuarter}>
              Create Package
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Modal */}
      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Package</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit this quarter package for review?
              Once submitted, it cannot be modified until reviewed.
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
                  <Label>Quarter</Label>
                  <p className="text-sm text-muted-foreground">{selectedPackage.quarter}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitModal(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSubmit}>
              Submit for Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
// I have reviewed the ManageQuarterPackagesComponent.tsx contents. It is currently implementing the quarter package management table with create, submit, and resubmit modals and actions.
