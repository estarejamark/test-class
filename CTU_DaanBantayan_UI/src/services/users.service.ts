/**
 * Users service for handling all user management operations
 */

import { apiClient, ApiError } from "@/lib/api-client";
import {
  Profile,
  ProfileSearchParams,
  ApiPaginatedResponse,
  ApiSuccessResponse,
  SystemUser,
  SystemUsersResponse,
  UserSearchParams,
} from "@/types/api";
import { RegisterRequest, Role } from "@/types/auth";

/**
 * Users service class for admin user management
 */
class UsersService {
  /**
   * Create a new user account
   */
  async createUser(userData: RegisterRequest): Promise<string> {
    try {
      console.log("👤 Creating user account with data:", userData);
      console.log("📡 Making POST request to: /api/users");

      const response = await apiClient.post<string>("/api/users", userData);

      console.log("✅ User creation response:", response);
      console.log("✅ User creation response data:", response.data);

      return response.data;
    } catch (error) {
      console.error("❌ Create user failed:", error);

      if (error instanceof ApiError) {
        console.error("❌ API Error details:", {
          status: error.status,
          message: error.message,
          details: error.details,
        });

        // Handle specific error cases
        if (error.status === 409) {
          // User already exists - provide more specific error message
          throw new Error(`User with email "${userData.email}" already exists. Please use a different email address.`);
        } else if (error.status === 401) {
          // Authentication error - user not logged in
          throw new Error("Authentication required. Please log in to create users.");
        } else if (error.status === 403) {
          // Authorization error - insufficient permissions
          throw new Error("Insufficient permissions. You need admin privileges to create users.");
        } else if (error.status === 400) {
          // Bad request - validation error
          throw new Error(`Invalid user data: ${error.message}`);
        } else if (error.status >= 500) {
          // Server error
          throw new Error("Server error occurred while creating user. Please try again later.");
        }

        // For other errors, use the original message
        throw new Error(error.message || "Failed to create user");
      }

      // Network or other errors
      throw new Error("Network error occurred. Please check your connection and try again.");
    }
  }

  /**
   * Get all users with profiles (paginated)
   */
  async getAllUsers(
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

      console.log("📡 Making GET request to:", url);
      console.log("📡 Query params:", Object.fromEntries(queryParams));

      const response = await apiClient.get<ApiPaginatedResponse<Profile>>(url);

      console.log("📊 Profiles API response:", response);
      console.log("📊 Profiles response data:", response.data);
      console.log(
        "📊 Number of profiles in response:",
        response.data.content?.length || 0
      );

      return response.data;
    } catch (error) {
      console.error("❌ getAllUsers failed:", error);
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
   * Get all system users (authentication users) with optional profile data
   * Requires backend implementation of GET /api/users/system-users endpoint
   */
  async getAllSystemUsers(
    params: UserSearchParams = {}
  ): Promise<SystemUsersResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (params.email) queryParams.append("email", params.email);
      if (params.role) queryParams.append("role", params.role);
      if (params.name) queryParams.append("name", params.name);
      if (params.page !== undefined)
        queryParams.append("page", params.page.toString());
      if (params.size !== undefined)
        queryParams.append("size", params.size.toString());

      const url = `/api/users/system-users${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;

      console.log("📡 Making GET request to:", url);
      console.log("📡 Query params:", Object.fromEntries(queryParams));

      const response = await apiClient.get<SystemUsersResponse>(url);

      console.log("📊 System users API response:", response);
      console.log("📊 System users response data:", response.data);
      console.log(
        "📊 Number of users in response:",
        response.data.content?.length || 0
      );

      return response.data;
    } catch (error) {
      console.error("❌ getAllSystemUsers failed:", error);
      if (error instanceof ApiError) {
        console.error("❌ API Error details:", {
          status: error.status,
          message: error.message,
          details: error.details,
        });
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to get system users");
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<Profile> {
    if (!this.isValidUUID(id)) {
      throw new Error("Invalid user ID format. Expected a valid UUID.");
    }

    try {
      const response = await apiClient.get<Profile>(`/api/profiles/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to get user");
    }
  }

  /**
   * Update user profile
   */
  async updateUser(
    profileId: string,
    userData: {
      firstName: string;
      middleName?: string;
      lastName: string;
      gender: "MALE" | "FEMALE";
      birthDate: string;
      contactNumber?: string | null;
      address: string;
    }
  ): Promise<string> {
    if (!this.isValidUUID(profileId)) {
      throw new Error("Invalid profile ID format. Expected a valid UUID.");
    }

    try {
      console.log("📝 Updating profile with ID:", profileId);
      console.log("📝 Making PUT request to: /api/profiles");
      console.log("📝 Profile data:", userData);

      const response = await apiClient.put<string>(
        `/api/profiles/${profileId}`,
        userData
      );

      console.log("✅ Update profile response:", response);
      console.log("✅ Update profile response data:", response.data);

      return response.data;
    } catch (error) {
      console.error("❌ Update profile failed:", error);
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
   * Delete user
   */
  async deleteUser(id: string): Promise<string> {
    if (!this.isValidUUID(id)) {
      throw new Error("Invalid user ID format. Expected a valid UUID.");
    }

    try {
      const response = await apiClient.delete<ApiSuccessResponse>(
        `/api/users/${id}`
      );
      return response.data.message;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to delete user");
    }
  }

  /**
   * Update user status (activate/deactivate)
   * Backend expects PUT /api/users?id=UUID with no body per README
   */
  async updateUserStatus(id: string): Promise<string> {
    if (!this.isValidUUID(id)) {
      throw new Error("Invalid user ID format. Expected a valid UUID.");
    }

    try {
      const response = await apiClient.put<ApiSuccessResponse>(
        `/api/users?id=${encodeURIComponent(id)}`,
        undefined
      );
      return response.data.message;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to update user status");
    }
  }

  /**
   * Toggle user status (activate/deactivate)
   */
  async toggleUserStatus(id: string): Promise<string> {
    if (!this.isValidUUID(id)) {
      throw new Error("Invalid user ID format. Expected a valid UUID.");
    }

    try {
      return await this.updateUserStatus(id);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to toggle user status");
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    totalUsers: number;
    totalTeachers: number;
    totalStudents: number;
    totalAdmins: number;
    activeUsers: number;
    inactiveUsers: number;
  }> {
    try {
      const [allUsers, teachers, students, admins] = await Promise.all([
        this.getAllUsers({ size: 1 }),
        this.getAllUsers({ role: "TEACHER", size: 1 }),
        this.getAllUsers({ role: "STUDENT", size: 1 }),
        this.getAllUsers({ role: "ADMIN", size: 1 }),
      ]);

      return {
        totalUsers: allUsers.totalElements,
        totalTeachers: teachers.totalElements,
        totalStudents: students.totalElements,
        totalAdmins: admins.totalElements,
        activeUsers: allUsers.totalElements, // This needs backend support for status filtering
        inactiveUsers: 0, // This needs backend support for status filtering
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search users by name
   */
  async searchUsers(
    searchTerm: string,
    role?: string,
    page = 0,
    size = 10
  ): Promise<ApiPaginatedResponse<Profile>> {
    try {
      return await this.getAllUsers({
        name: searchTerm,
        role,
        page,
        size,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Change user email with OTP verification
   */
  async changeEmail(newEmail: string, otp: string): Promise<string> {
    try {
      console.log("📧 Changing email to:", newEmail);
      const url = `/api/users/change-email?newEmail=${encodeURIComponent(newEmail)}&otp=${encodeURIComponent(otp)}`;
      const response = await apiClient.put<string>(url);
      console.log("✅ Email changed successfully");
      return response.data;
    } catch (error) {
      console.error("❌ Change email failed:", error);
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to change email");
    }
  }

  /**
   * Send password reset link via email
   */
  async sendPasswordResetLink(email: string): Promise<string> {
    try {
      console.log("🔗 Sending password reset link to:", email);
      const url = `/api/users/reset-password-link?email=${encodeURIComponent(email)}`;
      const response = await apiClient.post<string>(url);
      console.log("✅ Password reset link sent");
      return response.data;
    } catch (error) {
      console.error("❌ Send password reset link failed:", error);
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to send password reset link");
    }
  }

  /**
   * Reset OTP/2FA for user
   */
  async resetOtp(): Promise<string> {
    try {
      console.log("🔄 Resetting OTP/2FA");
      const response = await apiClient.post<string>("/api/users/reset-otp");
      console.log("✅ OTP/2FA reset successfully");
      return response.data;
    } catch (error) {
      console.error("❌ Reset OTP failed:", error);
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to reset OTP");
    }
  }

  /**
   * Enhanced search users with grade/section filters
   */
  async searchUsersAdvanced(
    filters: {
      email?: string;
      role?: string;
      grade?: string;
      section?: string;
      page?: number;
      size?: number;
    } = {}
  ): Promise<SystemUsersResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (filters.email) queryParams.append("email", filters.email);
      if (filters.role) queryParams.append("role", filters.role);
      if (filters.grade) queryParams.append("grade", filters.grade);
      if (filters.section) queryParams.append("section", filters.section);
      if (filters.page !== undefined) queryParams.append("page", filters.page.toString());
      if (filters.size !== undefined) queryParams.append("size", filters.size.toString());

      const url = `/api/users/search${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      console.log("🔍 Advanced search URL:", url);
      const response = await apiClient.get<SystemUsersResponse>(url);

      console.log("📊 Advanced search results:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Advanced search failed:", error);
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to search users");
    }
  }

  /**
   * Update user details (email, grade level, section)
   */
  async updateUserEntity(
    userId: string,
    updates: {
      email?: string;
      gradeLevel?: string;
      section?: string;
    }
  ): Promise<SystemUser> {
    if (!this.isValidUUID(userId)) {
      throw new Error("Invalid user ID format. Expected a valid UUID.");
    }

    try {
      console.log("👤 Updating user:", userId);
      console.log("📝 Update data:", updates);

      const requestBody: Record<string, string> = {};
      if (updates.email) requestBody.email = updates.email;
      if (updates.gradeLevel) requestBody.gradeLevel = updates.gradeLevel;
      if (updates.section) requestBody.section = updates.section;

      const response = await apiClient.put<SystemUser>(`/api/users/${userId}`, requestBody);

      console.log("✅ User update response:", response);
      console.log("✅ User update response data:", response.data);

      return response.data;
    } catch (error) {
      console.error("❌ Update user failed:", error);
      if (error instanceof ApiError) {
        console.error("❌ API Error details:", {
          status: error.status,
          message: error.message,
          details: error.details,
        });
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to update user");
    }
  }

  /**
   * Get all adviser teachers (teachers who have sections assigned)
   */
  async getAdviserTeachers(
    params: { page?: number; size?: number } = {}
  ): Promise<SystemUsersResponse> {
    try {
      const queryParams = new URLSearchParams();

      queryParams.append("role", Role.TEACHER);
      queryParams.append("isAdviser", "true");

      if (params.page !== undefined)
        queryParams.append("page", params.page.toString());
      if (params.size !== undefined)
        queryParams.append("size", params.size.toString());

      const url = `/api/users/system-users${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      console.log("📡 Making GET request to:", url);
      console.log("📡 Query params:", Object.fromEntries(queryParams));

      const response = await apiClient.get<SystemUsersResponse>(url);

      console.log("👨‍🏫 Adviser teachers API response:", response);
      console.log("👨‍🏫 Adviser teachers response data:", response.data);
      console.log(
        "👨‍🏫 Number of adviser teachers in response:",
        response.data.content?.length || 0
      );

      return response.data;
    } catch (error) {
      console.error("❌ getAdviserTeachers failed:", error);
      if (error instanceof ApiError) {
        console.error("❌ API Error details:", {
          status: error.status,
          message: error.message,
          details: error.details,
        });
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to get adviser teachers");
    }
  }

  /**
   * Validate UUID format
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Extract error message from ApiError
   */
  private getErrorMessage(error: ApiError): string {
    // The ApiError class already has the processed message and details
    if (error.details) {
      // If the error details has a message, use it
      if (typeof error.details === "string") {
        return error.details;
      }
      if (
        error.details &&
        typeof error.details === "object" &&
        "message" in error.details
      ) {
        return error.details.message as string;
      }
    }
    return error.message || "An unexpected error occurred";
  }
}

// Create and export singleton instance
export const usersService = new UsersService();

// Export the class for testing
export { UsersService };
