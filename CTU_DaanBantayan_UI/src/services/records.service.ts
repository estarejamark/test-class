/**
 * Records service for handling Monitor Records API calls
 */

import { apiClient, ApiError } from "@/lib/api-client";
import {
  QuarterPackageResponse,
  RecordApprovalResponse,
} from "@/types/api";

/**
 * Records service class
 */
class RecordsService {
  /**
   * Get all pending packages for review
   */
  async getPendingPackages(): Promise<QuarterPackageResponse[]> {
    try {
      const response = await apiClient.get<QuarterPackageResponse[]>(
        "/api/records/pending"
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to get pending packages");
    }
  }

  /**
   * Get all published packages
   */
  async getPublishedPackages(): Promise<QuarterPackageResponse[]> {
    try {
      const response = await apiClient.get<QuarterPackageResponse[]>(
        "/api/records/published"
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to get published packages");
    }
  }

  /**
   * Get package details by section and quarter
   */
  async getPackageDetails(
    sectionId: string,
    quarter: string
  ): Promise<QuarterPackageResponse> {
    try {
      const response = await apiClient.get<QuarterPackageResponse>(
        `/api/records/${sectionId}/${quarter}`
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to get package details");
    }
  }

  /**
   * Approve a package
   */
  async approvePackage(packageId: string): Promise<QuarterPackageResponse> {
    try {
      const response = await apiClient.patch<QuarterPackageResponse>(
        `/api/records/${packageId}/approve`
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to approve package");
    }
  }

  /**
   * Return a package with remarks
   */
  async returnPackage(
    packageId: string,
    remarks: string
  ): Promise<QuarterPackageResponse> {
    try {
      const response = await apiClient.patch<QuarterPackageResponse>(
        `/api/records/${packageId}/return?remarks=${encodeURIComponent(remarks)}`
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to return package");
    }
  }

  /**
   * Publish a package (admin only)
   */
  async publishPackage(packageId: string): Promise<QuarterPackageResponse> {
    try {
      const response = await apiClient.patch<QuarterPackageResponse>(
        `/api/records/${packageId}/publish`
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to publish package");
    }
  }

  /**
   * Get approval history for a package
   */
  async getPackageApprovals(packageId: string): Promise<RecordApprovalResponse[]> {
    try {
      const response = await apiClient.get<RecordApprovalResponse[]>(
        `/api/records/${packageId}/approvals`
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to get package approvals");
    }
  }

  /**
   * Extract error message from ApiError
   */
  private getErrorMessage(error: ApiError): string {
    // Try to parse error details if it's a JSON string
    if (typeof error.details === "string") {
      try {
        const errorData = JSON.parse(error.details);
        return errorData.message || error.message;
      } catch {
        return error.details || error.message;
      }
    }

    // Handle different error status codes
    switch (error.status) {
      case 400:
        return "Invalid request. Please check your input.";
      case 401:
        return "Unauthorized. Please log in again.";
      case 403:
        return "Access denied. You do not have permission to perform this action.";
      case 404:
        return "Package not found.";
      case 409:
        return "Package is in an invalid state for this operation.";
      case 500:
        return "Server error. Please try again later.";
      default:
        return error.message || "An unexpected error occurred.";
    }
  }
}

// Create and export singleton instance
export const recordsService = new RecordsService();

// Export the class for testing
export { RecordsService };
