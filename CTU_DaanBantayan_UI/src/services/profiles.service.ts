/**
 * Profiles service for handling all profile-related API calls
 */

import { apiClient, ApiError } from "@/lib/api-client";
import {
  Profile,
  CreateProfileRequest,
  UpdateProfileRequest,
  ProfileSearchParams,
  ApiPaginatedResponse,
  ApiSuccessResponse,
} from "@/types/api";

/**
 * Profiles service class
 */
class ProfilesService {
  /**
   * Create a new profile for the current user
   * For teachers, includes optional password setting during profile creation
   */
  async createProfile(profileData: CreateProfileRequest): Promise<string> {
    try {
      const response = await apiClient.post<ApiSuccessResponse>(
        "/api/profiles",
        profileData
      );
      return response.data.message;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to create profile");
    }
  }

  /**
   * Update an existing profile
   */
  async updateProfile(
    id: string,
    profileData: UpdateProfileRequest
  ): Promise<string> {
    try {
      // Remove id from request body since it's in the URL path
      const { id: _, ...updateData } = profileData;

      const response = await apiClient.put<ApiSuccessResponse>(
        `/api/profiles/${id}`,
        updateData
      );
      return response.data.message;
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('❌ Profile update failed:', {
          status: error.status,
          message: error.message,
          details: error.details,
          path: `/api/profiles/${id}`
        });
        throw new Error(this.getErrorMessage(error));
      }
      console.error('❌ Unexpected error during profile update:', error);
      throw new Error("Failed to update profile. Please try again.");
    }
  }

  /**
   * Get current user's profile
   */
  async getMyProfile(): Promise<Profile> {
    try {
      const response = await apiClient.get<Profile>("/api/profiles/me");
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to get profile");
    }
  }

  /**
   * Get current user's profile from /api/profiles endpoint (with JWT token)
   */
  async getCurrentUserProfile(): Promise<Profile> {
    try {
      const response = await apiClient.get<Profile>("/api/profiles");
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to get current user profile");
    }
  }

  /**
   * Search profiles with pagination and filters
   */
  async searchProfiles(
    params: ProfileSearchParams = {}
  ): Promise<ApiPaginatedResponse<Profile>> {
    try {
      const queryParams = new URLSearchParams();

      if (params.role) queryParams.append("role", params.role);
      if (params.name) queryParams.append("name", params.name);
      if (params.page !== undefined)
        queryParams.append("page", params.page.toString());
      if (params.size !== undefined)
        queryParams.append("size", params.size.toString());

      const url = `/api/profiles${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;

      const response = await apiClient.get<ApiPaginatedResponse<Profile>>(url);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to search profiles");
    }
  }

  /**
   * Get all teachers (unpaginated - for dropdowns)
   */
  async getAllTeachers(): Promise<Profile[]> {
    try {
      const response = await this.searchProfiles({
        role: "TEACHER",
        size: 1000,
      });
      return response.content;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all students (unpaginated - for reports)
   */
  async getAllStudents(): Promise<Profile[]> {
    try {
      const response = await this.searchProfiles({
        role: "STUDENT",
        size: 1000,
      });
      return response.content;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all admins
   */
  async getAllAdmins(): Promise<Profile[]> {
    try {
      const response = await this.searchProfiles({ role: "ADMIN", size: 1000 });
      return response.content;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get profile by ID
   */
  async getProfileById(id: string): Promise<Profile> {
    try {
      const response = await apiClient.get<Profile>(`/api/profiles/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to get profile");
    }
  }

  /**
   * Delete profile by ID
   */
  async deleteProfile(id: string): Promise<string> {
    try {
      const response = await apiClient.delete<ApiSuccessResponse>(
        `/api/profiles/${id}`
      );
      return response.data.message;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to delete profile");
    }
  }

  /**
   * Search teachers by name (for adviser assignment)
   */
  async searchTeachersByName(name: string): Promise<Profile[]> {
    try {
      const response = await this.searchProfiles({
        role: "TEACHER",
        name: name,
        size: 100,
      });
      return response.content;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get profile statistics
   */
  async getProfileStats(): Promise<{
    totalTeachers: number;
    totalStudents: number;
    totalAdmins: number;
  }> {
    try {
      const [teachers, students, admins] = await Promise.all([
        this.searchProfiles({ role: "TEACHER", size: 1 }),
        this.searchProfiles({ role: "STUDENT", size: 1 }),
        this.searchProfiles({ role: "ADMIN", size: 1 }),
      ]);

      return {
        totalTeachers: teachers.totalElements,
        totalStudents: students.totalElements,
        totalAdmins: admins.totalElements,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Extract error message from ApiError
   */
  private getErrorMessage(error: ApiError): string {
    // First, try to get the specific message from the API response
    if ((error as any).response?.data?.message) {
      return (error as any).response.data.message;
    }

    // Fallback to status-based messages
    switch (error.status) {
      case 400:
        return "Invalid profile data. Please check your input.";
      case 404:
        return "Profile not found.";
      case 409:
        return "Profile already exists for this user.";
      case 500:
        return "Server error. Please try again later.";
      default:
        return error.message || "An unexpected error occurred.";
    }
  }
}

// Create and export singleton instance
export const profilesService = new ProfilesService();

// Export the class for testing
export { ProfilesService };
