"use client";

import React, { useState, useEffect } from "react";
import SaveOptions from "./SaveOptions";
import Status from "./Status";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth.context";
import { quarterPackagesService } from "@/services/quarter-packages.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScheduleResponse, QuarterPackageResponse, Quarter, PackageStatus } from "@/types/api";
import { Role } from "@/types/auth";
import {
  DataManagementTable,
  TableColumn,
  FilterOption,
  BaseItem,
} from "../DataManagementTable";

interface MyQuarterPackageComponentProps {
  selectedSchedule?: ScheduleResponse | null;
  onNavigate?: (item: string, schedule?: ScheduleResponse) => void;
}

export default function MyQuarterPackageComponent({
  selectedSchedule: propSelectedSchedule,
  onNavigate
}: MyQuarterPackageComponentProps = {}) {
  // Role-based: Show for 'TEACHER' or users with adviser profile (advisers see this with enhancements)
  const { user, profile } = useAuth();
  const [tab, setTab] = useState("list-view");
  const [quarterPackages, setQuarterPackages] = useState<QuarterPackageResponse[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<QuarterPackageResponse | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleResponse | null>(null);

  useEffect(() => {
    if (user?.role === Role.TEACHER || profile?.isAdviser) {
      loadQuarterPackages();
    }
  }, [user, profile]);

  // Auto-select package based on propSelectedSchedule when component mounts or schedule changes
  useEffect(() => {
    if (propSelectedSchedule && quarterPackages.length > 0) {
      const matchingPackage = quarterPackages.find(pkg =>
        pkg.section?.id === propSelectedSchedule.section.id &&
        pkg.subject?.id === propSelectedSchedule.subject.id
      );
      if (matchingPackage && !selectedPackage) {
        handleSelectPackage(matchingPackage);
      }
    }
  }, [propSelectedSchedule, quarterPackages, selectedPackage]);

  const loadQuarterPackages = async () => {
    try {
      if (!user) return;
      // [CHANGE] Refined role-based loading with mock data:
      // - Teachers: Load their own packages.
      // - Advisers: Load their own teaching packages primarily. If they have advisory packages, load those too (for visibility, but validation happens in Adviser Panel).
      // This ensures advisers can manage their teaching duties here, while using the panel for advisory validation.
      if (user.role === Role.TEACHER) {
        const packages = await quarterPackagesService.getAllQuarterPackages();
        setQuarterPackages(packages);
      } else if (profile?.isAdviser) {
        // Load adviser's own packages first
        const ownPackages = await quarterPackagesService.getAllQuarterPackages();
        // Optionally load advisory packages for visibility (but not for editing/submission here)
        let advisoryPackages: QuarterPackageResponse[] = [];
        if (user.id) {
          advisoryPackages = await quarterPackagesService.getAdviserQuarterPackages(user.id);
        }
        // Combine and deduplicate (advisers might have overlapping packages)
        const allPackages = [...ownPackages, ...advisoryPackages].filter(
          (pkg, index, self) => self.findIndex(p => p.id === pkg.id) === index
        );
        setQuarterPackages(allPackages);
      }
    } catch (error) {
      console.error("Failed to load quarter packages:", error);
    }
  };

  // Handle package selection to show preview + detailed tabs
  const handleSelectPackage = (pkg: QuarterPackageResponse) => {
    setSelectedPackage(pkg);
    // Set selectedSchedule based on package info (construct minimal ScheduleResponse)
    if (pkg.section && pkg.section.id && 'subjectName' in pkg && 'subjectId' in pkg && pkg.section.name) {
      setSelectedSchedule({
        id: pkg.id, // or another unique id, adjust as needed
        section: {
          id: pkg.section.id,
          name: pkg.section.name,
        },
        subject: {
          id: (pkg as any).subjectId,
          name: (pkg as any).subjectName,
        }
      } as ScheduleResponse);
    } else {
      setSelectedSchedule(null);
    }
    setTab("package-preview");
  };

  // [CHANGE] Role check: Allow advisers (they see teacher dashboard with role-based tweaks)
  if (user?.role !== Role.TEACHER && user?.role !== Role.ADVISER) {
    return <p className="text-center text-red-500 mt-10">Access denied. My Quarter Package is for teachers and advisers only.</p>;
  }

  // [CHANGE] Helper to check if selected package is for adviser's advisory section
  // Note: advisorySectionId is not available in UserResponse, using profile-based check instead
  const isAdvisorySection = profile?.isAdviser && selectedPackage?.section?.id ? true : false;

  // Table columns configuration
  const quarterPackageColumns: TableColumn[] = [
    { key: "sectionName", label: "Section", searchable: true },
    { key: "subjectName", label: "Subject", searchable: true },
    { key: "quarter", label: "Quarter" },
    { key: "status", label: "Status" },
    { key: "updatedAt", label: "Last Updated" },
  ];

  // Filter options configuration
  const quarterPackageFilterOptions: FilterOption[] = [
    {
      key: "quarter",
      label: "Quarter",
      options: [
        { label: "Q1", value: "Q1" },
        { label: "Q2", value: "Q2" },
        { label: "Q3", value: "Q3" },
        { label: "Q4", value: "Q4" },
      ],
    },
    {
      key: "status",
      label: "Status",
      options: [
        { label: "Pending", value: "PENDING" },
        { label: "Approved", value: "APPROVED" },
        { label: "Returned", value: "RETURNED" },
        { label: "Forwarded to Admin", value: "FORWARDED_TO_ADMIN" },
        { label: "Published", value: "PUBLISHED" },
        { label: "Submitted", value: "SUBMITTED" },
      ],
    },
  ];

  // Badge color function
  const getQuarterPackageBadgeColor = (key: string, value: unknown) => {
    if (key === "status") {
      switch (value) {
        case "PENDING":
          return "bg-yellow-100 text-yellow-800";
        case "APPROVED":
          return "bg-green-100 text-green-800";
        case "RETURNED":
          return "bg-red-100 text-red-800";
        case "FORWARDED_TO_ADMIN":
          return "bg-blue-100 text-blue-800";
        case "PUBLISHED":
          return "bg-purple-100 text-purple-800";
        case "SUBMITTED":
          return "bg-indigo-100 text-indigo-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    }
    if (key === "quarter") {
      switch (value) {
        case "Q1":
          return "bg-blue-100 text-blue-800";
        case "Q2":
          return "bg-green-100 text-green-800";
        case "Q3":
          return "bg-yellow-100 text-yellow-800";
        case "Q4":
          return "bg-red-100 text-red-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    }
    return "bg-gray-100 text-gray-800";
  };

  // Transform data for DataManagementTable
  const transformedPackages: BaseItem[] = quarterPackages.map((pkg) => ({
    id: pkg.id,
    sectionName: pkg.section?.name || "N/A",
    subjectName: pkg.subject?.name || "N/A",
    quarter: pkg.quarter,
    status: pkg.status,
    updatedAt: new Date(pkg.updatedAt).toLocaleDateString(),
    // Keep original package data for selection
    originalPackage: pkg,
  }));

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">My Quarter Package</h1>

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="list-view">All Packages</TabsTrigger>
          <TabsTrigger value="package-preview" disabled={!selectedPackage}>Package Preview</TabsTrigger>
          <TabsTrigger value="save-options" disabled={!selectedPackage}>Save Options</TabsTrigger>
          <TabsTrigger value="status" disabled={!selectedPackage}>Status</TabsTrigger>
        </TabsList>

        <TabsContent value="list-view">
          <DataManagementTable
            title="Quarter Packages"
            description="View and manage your quarter packages"
            data={transformedPackages}
            columns={quarterPackageColumns}
            filterOptions={quarterPackageFilterOptions}
            onRefresh={loadQuarterPackages}
            searchPlaceholder="Search packages..."
            getBadgeColor={getQuarterPackageBadgeColor}
            actions={{
              edit: false,
              statusToggle: false,
              delete: false,
              viewPackage: true,
            }}
            onViewPackage={(item: BaseItem) => {
              const originalPackage = (item as any).originalPackage as QuarterPackageResponse;
              handleSelectPackage(originalPackage);
            }}
          />
        </TabsContent>

        <TabsContent value="package-preview">
          {selectedPackage ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">Package Contents Summary</h2>
              {/* Display summary of grades % completion etc */}
              <p><strong>Grades:</strong> {((selectedPackage as any).gradesSubmitted) || 0}/{((selectedPackage as any).gradesTotal) || 0} grades submitted</p>
              <p><strong>Attendance:</strong> {(selectedPackage as any).attendanceStatus || "Not available"}</p>
              <p><strong>Feedback:</strong> {(selectedPackage as any).feedbackCompleted ? "Completed" : "Not written"}</p>
              <p><strong>Last saved as:</strong> {selectedPackage.status === "PENDING" ? "Draft" : "Submitted"}</p>
              {selectedPackage.remarks && <p><strong>Remarks:</strong> {selectedPackage.remarks}</p>}

              <div className="mt-6 space-x-3">
                {/* Action buttons linking to other components */}
                <Button onClick={() => setTab("save-options")}>Open Save Options</Button>
                <Button onClick={() => setTab("status")}>Open Status Tracker</Button>
                {onNavigate && selectedSchedule && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => onNavigate("encode-records", selectedSchedule)}
                    >
                      Open Encode Grades
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onNavigate("daily-attendance", selectedSchedule)}
                    >
                      Open Attendance
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <p>Please select a package from the list.</p>
          )}
        </TabsContent>

        <TabsContent value="save-options">
          {selectedPackage ? (
            // [CHANGE] Pass role and advisory info to SaveOptions for conditional submission routing
            <SaveOptions 
              selectedSchedule={selectedSchedule} 
              userRole={user?.role} 
              isAdvisorySection={isAdvisorySection} 
            />
          ) : (
            <p>Please select a package to access Save Options.</p>
          )}
        </TabsContent>

        <TabsContent value="status">
          {selectedPackage ? (
            // [CHANGE] Pass role and advisory info to Status for role-based status labels
            <Status 
              selectedSchedule={selectedSchedule} 
              userRole={user?.role} 
              isAdvisorySection={isAdvisorySection} 
            />
          ) : (
            <p>Please select a package to view Status.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}