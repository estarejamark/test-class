"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RotateCcw, Send, AlertTriangle, Eye, FileText, Users, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/auth.context";
import { quarterPackagesService } from "@/services/quarter-packages.service";
import { QuarterPackageResponse, PackageStatus, Quarter } from "@/types/api";
import { Role } from "@/types/auth";
import { toast } from "sonner";

export default function ValidateRecords() {
  console.log("🔍 ValidateRecords component rendered");

  const { user, profile, authState } = useAuth();
  const [quarterPackages, setQuarterPackages] = useState<QuarterPackageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<QuarterPackageResponse | null>(null);
  const [returnRemarks, setReturnRemarks] = useState("");
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [isForwardDialogOpen, setIsForwardDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  console.log("🔍 ValidateRecords - authState:", {
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    user: user,
    profile: profile
  });

  // Wait for auth state to load before checking access
  if (authState.isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="text-center">Loading authentication...</div>
      </div>
    );
  }

  // Check if user is an adviser (teacher with adviser privileges or dedicated adviser role)
  const hasAccess = user?.role === Role.ADVISER || (user?.role === Role.TEACHER && profile?.isAdviser);

  console.log("ValidateRecords Access Check:", {
    userRole: user?.role,
    isAdviser: profile?.isAdviser,
    hasAccess,
    isAuthLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    timestamp: new Date().toISOString(),
    userId: user?.id,
    profileId: profile?.id,
    // Debug the logic step by step
    step1: user?.role !== Role.TEACHER,
    step2: !profile?.isAdviser,
    step3: user?.role !== Role.ADVISER,
    condition1: (user?.role !== Role.TEACHER || !profile?.isAdviser),
    condition2: user?.role !== Role.ADVISER,
    combinedCondition: (user?.role !== Role.TEACHER || !profile?.isAdviser) && user?.role !== Role.ADVISER
  });

  if (!hasAccess) {
    console.log("Access denied - rendering access denied message");
    return <p className="text-center text-red-500 mt-10">Access denied. This page is for advisers only.</p>;
  }

  console.log("Access granted - rendering component");

  useEffect(() => {
    loadAdviserQuarterPackages();
  }, [user]);

  const loadAdviserQuarterPackages = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
         const packages = await quarterPackagesService.getAdviserQuarterPackages(user.id);
            setQuarterPackages(packages);
            
    } catch (error) {
      console.error("Failed to load adviser quarter packages:", error);
      toast.error("Failed to load quarter packages");
    } finally {
      setLoading(false);
    }
  };

  const handleReturnPackage = async () => {
    if (!selectedPackage || !returnRemarks.trim()) {
      toast.error("Please provide remarks for returning the package");
      return;
    }

    try {
      setActionLoading(true);
      await quarterPackagesService.returnQuarterPackage(selectedPackage.id, returnRemarks);
      toast.success("Quarter package returned to teacher with remarks");

      // Refresh the list
      await loadAdviserQuarterPackages();

      // Close dialog and reset state
      setIsReturnDialogOpen(false);
      setSelectedPackage(null);
      setReturnRemarks("");
    } catch (error) {
      console.error("Failed to return quarter package:", error);
      toast.error("Failed to return quarter package");
    } finally {
      setActionLoading(false);
    }
  };

  const handleForwardToAdmin = async () => {
    if (!selectedPackage) return;

    try {
      setActionLoading(true);
      await quarterPackagesService.forwardQuarterPackageToAdmin(selectedPackage.id);
      toast.success("Quarter package forwarded to admin for final validation");

      // Refresh the list
      await loadAdviserQuarterPackages();

      // Close dialog and reset state
      setIsForwardDialogOpen(false);
      setSelectedPackage(null);
    } catch (error) {
      console.error("Failed to forward quarter package:", error);
      toast.error("Failed to forward quarter package");
    } finally {
      setActionLoading(false);
    }
  };

  const openReturnDialog = (pkg: QuarterPackageResponse) => {
    setSelectedPackage(pkg);
    setReturnRemarks("");
    setIsReturnDialogOpen(true);
  };

  const openForwardDialog = (pkg: QuarterPackageResponse) => {
    setSelectedPackage(pkg);
    setIsForwardDialogOpen(true);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "default";
      case "RETURNED":
        return "destructive";
      case "FORWARDED_TO_ADMIN":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "Submitted";
      case "RETURNED":
        return "Returned";
      case "FORWARDED_TO_ADMIN":
        return "Forwarded to Admin";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="text-center">Loading quarter packages...</div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Validate Records for Advisory Section</h1>
          <p className="text-muted-foreground mt-2">
            Review quarter packages submitted by teachers for your advisory section.
          </p>
        </div>

        {quarterPackages.length === 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No quarter packages found for your advisory section.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-6 md:grid-cols-1">
            {quarterPackages.map((pkg) => (
              <Card key={pkg.id} className="w-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      <CardTitle className="text-lg">Quarter Package</CardTitle>
                    </div>
                    <Badge variant={getStatusBadgeVariant(pkg.status)}>
                      {getStatusText(pkg.status)}
                    </Badge>
                  </div>
                  <CardDescription>
                    Section: {pkg.section?.name || "N/A"} | Quarter: {pkg.quarter}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Subject:</strong> {pkg.subject?.name || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Submitted:</strong> {new Date(pkg.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Teacher:</strong> {pkg.teacher?.fullName || "N/A"}
                      </span>
                    </div>
                  </div>

                  {pkg.remarks && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm text-yellow-800">
                        <strong>Previous Remarks:</strong> {pkg.remarks}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {pkg.status === PackageStatus.SUBMITTED && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => openReturnDialog(pkg)}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Return to Teacher
                        </Button>

                        <Button variant="default" size="sm" onClick={() => openForwardDialog(pkg)}>
                          <Send className="h-4 w-4 mr-2" />
                          Forward to Admin
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Return Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return Quarter Package</DialogTitle>
            <DialogDescription>
              Provide remarks explaining why this package needs revision.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Please provide detailed feedback for the teacher..."
                value={returnRemarks}
                onChange={(e) => setReturnRemarks(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReturnDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReturnPackage} disabled={actionLoading || !returnRemarks.trim()}>
              {actionLoading ? "Returning..." : "Return Package"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Forward Dialog */}
      <Dialog open={isForwardDialogOpen} onOpenChange={setIsForwardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forward to Admin</DialogTitle>
            <DialogDescription>
              This will send the quarter package to admin for final validation. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsForwardDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleForwardToAdmin} disabled={actionLoading}>
              {actionLoading ? "Forwarding..." : "Forward to Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
