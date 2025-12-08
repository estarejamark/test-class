/**
 * Subjects service for handling all subject-related API calls
 */

import { apiClient, ApiError } from "@/lib/api-client";
import {
  Subject,
  CreateSubjectRequest,
  UpdateSubjectRequest,
  SubjectSearchParams,
  ApiPaginatedResponse,
  ApiSuccessResponse,
} from "@/types/api";

/**
 * Subjects service class
 */
class SubjectsService {
  /**
   * Create a new subject
   */
  async createSubject(subjectData: CreateSubjectRequest): Promise<string> {
    try {
      const response = await apiClient.post<ApiSuccessResponse>(
        "/api/subjects",
        subjectData
      );
      return response.data.message;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to create subject");
    }
  }

  /**
   * Update an existing subject
   */
  async updateSubject(subjectData: UpdateSubjectRequest): Promise<string> {
    try {
      console.log("📝 Updating subject with data:", subjectData);
      console.log("📝 Making PUT request to: /api/subjects");

      const response = await apiClient.put<ApiSuccessResponse>(
        "/api/subjects",
        subjectData
      );

      console.log("✅ Update response:", response);
      console.log("✅ Update response data:", response.data);

      return response.data.message;
    } catch (error) {
      console.error("❌ Update subject failed:", error);
      if (error instanceof ApiError) {
        console.error("❌ API Error details:", {
          status: error.status,
          message: error.message,
          details: error.details,
        });
      }
      throw error;
    }
  }

  /**
   * Search subjects with pagination and filters
   */
  async searchSubjects(
    params: SubjectSearchParams = {}
  ): Promise<ApiPaginatedResponse<Subject>> {
    try {
      const queryParams = new URLSearchParams();

      if (params.subjectCode)
        queryParams.append("subjectCode", params.subjectCode);
      if (params.name) queryParams.append("name", params.name);
      if (params.page !== undefined)
        queryParams.append("page", params.page.toString());
      if (params.size !== undefined)
        queryParams.append("size", params.size.toString());

      const url = `/api/subjects${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;

      console.log("🔄 Making GET request to:", url);
      console.log("🔄 Query params:", Object.fromEntries(queryParams));

      const response = await apiClient.get<ApiPaginatedResponse<Subject>>(url);
      console.log("📊 Raw API response:", response);
      console.log("📊 Response data:", response.data);
      console.log("📊 Response status:", response.status);

      return response.data;
    } catch (error) {
      console.error("❌ searchSubjects failed:", error);
      if (error instanceof ApiError) {
        console.error("❌ API Error details:", {
          status: error.status,
          message: error.message,
          details: error.details,
        });
      }
      throw error;
    }
  }

  /**
   * Get all subjects (unpaginated - for dropdowns)
   */
  async getAllSubjects(): Promise<Subject[]> {
    try {
      console.log("🔄 Fetching all subjects...");
      const response = await this.searchSubjects({ size: 1000 });
      console.log("📊 getAllSubjects response:", response);
      console.log("📊 Content array:", response.content);
      return response.content;
    } catch (error) {
      console.error("❌ getAllSubjects failed:", error);
      throw error;
    }
  }

  /**
   * Get subject by ID
   */
  async getSubjectById(id: string): Promise<Subject> {
    try {
      const response = await apiClient.get<Subject>(`/api/subjects/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to get subject");
    }
  }

  /**
   * Delete subject by ID
   */
  async deleteSubject(id: string): Promise<string> {
    try {
      console.log("🗑️ Making DELETE request to:", `/api/subjects`);
      console.log("🗑️ Deleting subject with ID:", id);

      // Send ID as query parameter as required by backend
      const response = await apiClient.delete<ApiSuccessResponse>(
        `/api/subjects?id=${id}`
      );

      console.log("✅ Delete response:", response);
      console.log("✅ Delete response data:", response.data);

      return response.data.message;
    } catch (error) {
      console.error("❌ Delete subject failed:", error);
      if (error instanceof ApiError) {
        console.error("❌ API Error details:", {
          status: error.status,
          message: error.message,
          details: error.details,
        });
      }
      throw error;
    }
  }

  /**
   * Extract error message from ApiError
   */
  private getErrorMessage(error: ApiError): string {
    switch (error.status) {
      case 400:
        return "Invalid subject data. Please check your input.";
      case 404:
        return "Subject not found.";
      case 409:
        return "Subject code already exists.";
      case 500:
        return "Server error. Please try again later.";
      default:
        return error.message || "An unexpected error occurred.";
    }
  }
}

// Create and export singleton instance
export const subjectsService = new SubjectsService();

// Export the class for testing
export { SubjectsService };
