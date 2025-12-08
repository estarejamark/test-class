/**
 * Grades service for handling grade encoding API calls
 */

import { apiClient, ApiError } from "@/lib/api-client";
import { GradeResponse } from "@/types/grades";

/**
 * Grades service class
 */
class GradesService {
  /**
   * Record a grade for a student
   */
  async recordGrade(
    studentId: string,
    subjectId: string,
    sectionId: string,
    quarter: string,
    gradeType: string,
    score: number,
    totalScore?: number
  ): Promise<GradeResponse> {
    try {
      const response = await apiClient.post<GradeResponse>("/api/grades", {
        studentId,
        subjectId,
        sectionId,
        quarter,
        gradeType,
        score,
        totalScore,
      });
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to record grade");
    }
  }

  /**
   * Get grades for a student in a section
   */
  async getGradesForStudent(
    studentId: string,
    sectionId: string,
    quarter: string
  ): Promise<GradeResponse[]> {
    try {
      const response = await apiClient.get<GradeResponse[]>(
        `/api/grades/student/${studentId}/section/${sectionId}?quarter=${quarter}`
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to get student grades");
    }
  }

  /**
   * Get grades for a section and subject
   */
  async getGradesForSection(
    sectionId: string,
    subjectId: string,
    quarter?: string
  ): Promise<GradeResponse[]> {
    let activeQuarter = quarter;
    if (!activeQuarter) {
      try {
        const { settingsService } = await import('@/services/settings.service');
        const activeQuarterData = await settingsService.getActiveQuarter();
        activeQuarter = activeQuarterData?.activeQuarter;
      } catch (error) {
        console.warn('Failed to fetch active quarter for grades, using no quarter filter:', error);
      }
    }

    try {
      const response = await apiClient.get<GradeResponse[]>(
        `/api/grades/section/${sectionId}/subject/${subjectId}${activeQuarter ? `?quarter=${activeQuarter}` : ''}`
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to get section grades");
    }
  }

  /**
   * Calculate final grade for a student
   */
  async calculateFinalGrade(
    studentId: string,
    subjectId: string,
    sectionId: string,
    quarter: string
  ): Promise<GradeResponse> {
    try {
      const response = await apiClient.post<GradeResponse>("/api/grades/calculate-final", {
        studentId,
        subjectId,
        sectionId,
        quarter,
      });
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to calculate final grade");
    }
  }

  /**
   * Update a grade record
   */
  async updateGrade(
    gradeId: string,
    score: number,
    totalScore?: number
  ): Promise<GradeResponse> {
    try {
      const response = await apiClient.put<GradeResponse>(`/api/grades/${gradeId}`, {
        score,
        totalScore,
      });
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to update grade");
    }
  }

  /**
   * Delete a grade record
   */
  async deleteGrade(gradeId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/grades/${gradeId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to delete grade");
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
        return "Invalid grade data. Please check your input.";
      case 401:
        return "Unauthorized. Please log in again.";
      case 403:
        return "Access denied. You do not have permission to manage grades.";
      case 404:
        return "Grade record or student not found.";
      case 409:
        return "Grade record already exists or conflict detected.";
      case 500:
        return "Server error. Please try again later.";
      default:
        return error.message || "An unexpected error occurred.";
    }
  }
}

// Create and export singleton instance
export const gradesService = new GradesService();

// Export the class for testing
export { GradesService };
