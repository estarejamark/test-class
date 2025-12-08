/**
 * Sections service for handling all section-related API calls
 */

import { apiClient, ApiError } from "@/lib/api-client";
import {
  Section,
  CreateSectionRequest,
  UpdateSectionRequest,
  SectionSearchParams,
  ApiPaginatedResponse,
  ApiSuccessResponse,
  SectionDependencyResponse,
} from "@/types/api";

/**
 * Sections service class
 */
class SectionsService {
  /**
   * Create a new section
   */
  async createSection(sectionData: CreateSectionRequest): Promise<string> {
    try {
      const response = await apiClient.post<ApiSuccessResponse>(
        "/api/sections",
        sectionData
      );
      return response.data.message;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to create section");
    }
  }

  /**
   * Update an existing section
   */
  async updateSection(
    id: string,
    sectionData: UpdateSectionRequest
  ): Promise<string> {
    try {
      const response = await apiClient.put<ApiSuccessResponse>(
        `/api/sections/${id}`,
        sectionData
      );
      return response.data.message;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to update section");
    }
  }

  /**
   * Search sections with pagination and filters
   */
  async searchSections(
    params: SectionSearchParams = {}
  ): Promise<ApiPaginatedResponse<Section>> {
    try {
      const queryParams = new URLSearchParams();

      if (params.name) queryParams.append("name", params.name);
      if (params.gradeLevel)
        queryParams.append("gradeLevel", params.gradeLevel);
      if (params.adviserName)
        queryParams.append("adviserName", params.adviserName);
      if (params.page !== undefined)
        queryParams.append("page", params.page.toString());
      if (params.size !== undefined)
        queryParams.append("size", params.size.toString());

      const url = `/api/sections${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;

      const response = await apiClient.get<ApiPaginatedResponse<Section>>(url);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to search sections");
    }
  }

  /**
   * Get all sections (unpaginated - for dropdowns)
   */
  async getAllSections(): Promise<Section[]> {
    try {
      const response = await this.searchSections({ size: 1000 });
      return response.content;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get section by ID
   */
  async getSectionById(id: string): Promise<Section> {
    try {
      const response = await apiClient.get<Section>(`/api/sections/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to get section");
    }
  }

  /**
   * Delete section by ID
   */
  async deleteSection(id: string, forceDelete: boolean = false): Promise<string> {
    try {
      const response = await apiClient.delete<ApiSuccessResponse>(
        `/api/sections/${id}?forceDelete=${forceDelete}`
      );
      return response.data.message;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getDetailedErrorMessage(error));
      }
      throw new Error("Failed to delete section");
    }
  }

  /**
   * Get section dependencies before deletion
   */
  async getSectionDependencies(id: string): Promise<SectionDependencyResponse> {
    try {
      const response = await apiClient.get<SectionDependencyResponse>(
        `/api/sections/${id}/dependencies`
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to get section dependencies");
    }
  }

  /**
   * Get sections by grade level
   */
  async getSectionsByGrade(gradeLevel: string): Promise<Section[]> {
    try {
      const response = await this.searchSections({ gradeLevel, size: 1000 });
      return response.content;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get sections by adviser
   */
  async getSectionsByAdviser(adviserName: string): Promise<Section[]> {
    try {
      const response = await this.searchSections({ adviserName, size: 1000 });
      return response.content;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Extract error message from ApiError
   */
  private getErrorMessage(error: ApiError): string {
    // Use the actual error message from the backend if available
    if (error.message && error.message.trim() !== "") {
      return error.message;
    }

    // Fallback to status-based messages for backward compatibility
    switch (error.status) {
      case 400:
        return "Invalid section data. Please check your input.";
      case 404:
        return "Section not found.";
      case 409:
        return "Section name already exists for this grade level.";
      case 500:
        return "Server error. Please try again later.";
      default:
        return "An unexpected error occurred.";
    }
  }

  /**
   * Extract detailed error message from ApiError with specific handling for different error types
   */
  private getDetailedErrorMessage(error: ApiError): string {
    // Use the actual error message from the backend if available
    if (error.message && error.message.trim() !== "") {
      return error.message;
    }

    // Handle network connectivity errors
    if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('connection')) {
      return "Network error: Please check your internet connection and try again.";
    } else if (error.message.includes('timeout')) {
      return "Request timed out: The server is taking too long to respond. Please try again.";
    } else if (error.message.includes('404')) {
      return "Section not found: The item may have already been deleted.";
    } else if (error.message.includes('500')) {
      return "Server error: Please try again later or contact your administrator.";
    } else if (error.message.includes('401') || error.message.includes('403')) {
      return "Authentication error: Please refresh the page and log in again.";
    } else {
      // Fallback to status-based messages for backward compatibility
      switch (error.status) {
        case 400:
          return "Invalid section data. Please check your input.";
        case 404:
          return "Section not found.";
        case 409:
          return "Section name already exists for this grade level.";
        case 500:
          return "Server error. Please try again later.";
        default:
          return "An unexpected error occurred.";
      }
    }
  }
}

// Create and export singleton instance
export const sectionsService = new SectionsService();

// Export the class for testing
export { SectionsService };
