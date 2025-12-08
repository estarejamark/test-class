/**
 * Students service for handling student-specific operations
 */

import { apiClient, ApiError } from "@/lib/api-client";
import {
  SystemUser,
  SystemUsersResponse,
  ApiPaginatedResponse,
  ApiSuccessResponse,
  Section,
  Quarter,
} from "@/types/api";
import { Role } from "@/types/auth";

/**
 * Students service class for student management operations
 */
class StudentsService {
  /**
   * Create a new student with enrollment
   */
  async createStudent(studentData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    gender: string;
    birthDate: string;
    contactNumber?: string | null;
    address: string;
    parentName?: string;
    parentContact?: string;
    sectionId: string;
    schoolYear?: string;
    quarter?: Quarter;
  }): Promise<string> {
    try {
      console.log("👤 Creating student with enrollment:", studentData);

      const payload = {
        email: studentData.email,
        password: studentData.password,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        middleName: studentData.middleName,
        gender: studentData.gender,
        birthDate: studentData.birthDate,
        contactNumber: studentData.contactNumber,
        address: studentData.address,
        parentName: studentData.parentName ?? null,
        parentContact: studentData.parentContact ?? null,
        sectionId: studentData.sectionId,
        schoolYear: studentData.schoolYear,
        quarter: studentData.quarter
      };

      const response = await apiClient.post<string>("/api/students", payload);

      console.log("✅ Student created successfully");
      return response.data;

    } catch (error) {
      console.error("❌ Create student failed:", error);
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to create student");
    }
  }

  /**
   * Get all students with enrollment information
   */
  async getAllStudents(
    params: {
      grade?: string;
      section?: string;
      page?: number;
      size?: number;
    } = {}
  ): Promise<SystemUsersResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("role", "STUDENT");

      if (params.grade) queryParams.append("grade", params.grade);
      if (params.section) queryParams.append("section", params.section);
      if (params.page !== undefined) queryParams.append("page", params.page.toString());
      if (params.size !== undefined) queryParams.append("size", params.size.toString());

      const url = `/api/users?${queryParams.toString()}`;

      console.log("📡 Fetching students:", url);
      const response = await apiClient.get<SystemUsersResponse>(url);

      return response.data;
    } catch (error) {
      console.error("❌ Get students failed:", error);
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to get students");
    }
  }

  /**
   * Update student enrollment
   */
  async updateStudentEnrollment(
    studentId: string,
    enrollmentData: {
      sectionId: string;
      schoolYear?: string;
      quarter?: Quarter;
    }
  ): Promise<string> {
    try {
      console.log("📚 Updating student enrollment:", { studentId, enrollmentData });

      // Update student using the correct student update endpoint
      const response = await apiClient.put<string>(
        `/api/students/${studentId}`,
        {
          newSectionId: enrollmentData.sectionId,
          schoolYear: enrollmentData.schoolYear || "2025-2026", // Default if not provided
          quarter: enrollmentData.quarter || Quarter.Q1, // Default if not provided
        }
      );

      console.log("✅ Student enrollment updated successfully");
      return response.data;
    } catch (error) {
      console.error("❌ Update student enrollment failed:", error);
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to update student enrollment");
    }
  }

  /**
   * Remove student from enrollment (when changing role from STUDENT)
   */
  async removeStudentEnrollment(studentId: string): Promise<string> {
    try {
      console.log("📚 Removing student enrollment:", studentId);

      const response = await apiClient.delete<ApiSuccessResponse>(
        `/api/enrollments/student/${studentId}`
      );

      console.log("✅ Student enrollment removed successfully");
      return response.data.message;
    } catch (error) {
      console.error("❌ Remove student enrollment failed:", error);
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to remove student enrollment");
    }
  }

  /**
   * Validate student data
   */
  validateStudentData(data: {
    email?: string;
    gradeLevel?: string;
    section?: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.email && !this.isValidEmail(data.email)) {
      errors.push("Invalid email format");
    }

    if (data.gradeLevel && !["7", "8", "9", "10", "11", "12"].includes(data.gradeLevel)) {
      errors.push("Invalid grade level");
    }

    if (data.section && !data.section.match(/^\d+-[A-Za-z]+$/)) {
      errors.push("Invalid section format (should be like '7-A' or '7-Alpha')");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if section has capacity for new enrollment
   */
  async checkSectionCapacity(sectionId: string): Promise<{
    hasCapacity: boolean;
    currentCount: number;
    maxCapacity: number;
  }> {
    try {
      const response = await apiClient.get<{
        hasCapacity: boolean;
        currentCount: number;
        maxCapacity: number;
      }>(`/api/sections/${sectionId}/capacity`);

      return response.data;
    } catch (error) {
      console.error("❌ Check section capacity failed:", error);
      // Return default values if endpoint doesn't exist
      return { hasCapacity: true, currentCount: 0, maxCapacity: 50 };
    }
  }

  /**
   * Bulk create students
   */
  async bulkCreateStudents(studentsData: Array<{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    gender: string;
    birthDate: string;
    contactNumber?: string | null;
    address: string;
    parentName?: string;
    parentContact?: string;
    sectionId: string;
    schoolYear?: string;
    quarter?: Quarter;
  }>): Promise<{
    successful: string[];
    failed: Array<{ data: any; error: string }>;
  }> {
    const results = {
      successful: [] as string[],
      failed: [] as Array<{ data: any; error: string }>,
    };

    for (const studentData of studentsData) {
      try {
        const studentId = await this.createStudent(studentData);
        results.successful.push(studentId);
      } catch (error) {
        results.failed.push({
          data: studentData,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }

  /**
   * Helper methods
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private getErrorMessage(error: ApiError): string {
    if (error.details) {
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
export const studentsService = new StudentsService();

// Export the class for testing
export { StudentsService };
