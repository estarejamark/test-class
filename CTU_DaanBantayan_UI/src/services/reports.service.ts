/**
 * Reports service for handling Reports API calls
 */

import { apiClient, ApiError } from "@/lib/api-client";
import {
  GradeSummaryResponse,
  GradeTrendResponse,
  AttendanceReportResponse,
  DailyAttendanceResponse,
  FeedbackReportResponse,
  TeacherLoadReportResponse,
  UsageStatsResponse,
} from "@/types/api";

/**
 * Reports service class
 */
class ReportsService {
  /**
   * Get grade summary report
   */
  async getGradeSummary(
    year?: number,
    quarter?: string,
    sectionId?: string,
    teacherId?: string
  ): Promise<GradeSummaryResponse[]> {
    try {
      const params = new URLSearchParams();
      if (year) params.append("year", year.toString());
      if (quarter) params.append("quarter", quarter);
      if (sectionId) params.append("sectionId", sectionId);
      if (teacherId) params.append("teacherId", teacherId);

      const response = await apiClient.get<GradeSummaryResponse[]>(
        `/api/reports/grades?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to get grade summary report");
    }
  }

  /**
   * Get grade trends report
   */
  async getGradeTrends(
    year?: number,
    sectionId?: string,
    teacherId?: string
  ): Promise<GradeTrendResponse[]> {
    try {
      const params = new URLSearchParams();
      if (year) params.append("year", year.toString());
      if (sectionId) params.append("sectionId", sectionId);
      if (teacherId) params.append("teacherId", teacherId);

      const response = await apiClient.get<GradeTrendResponse[]>(
        `/api/reports/grades/trends?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to get grade trends report");
    }
  }

  /**
   * Get attendance report
   */
  async getAttendanceReport(
    year?: number,
    quarter?: string,
    sectionId?: string,
    teacherId?: string
  ): Promise<AttendanceReportResponse[]> {
    try {
      const params = new URLSearchParams();
      if (year) params.append("year", year.toString());
      if (quarter) params.append("quarter", quarter);
      if (sectionId) params.append("sectionId", sectionId);
      if (teacherId) params.append("teacherId", teacherId);

      const response = await apiClient.get<AttendanceReportResponse[]>(
        `/api/reports/attendance?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to get attendance report");
    }
  }

  /**
   * Get daily attendance report
   */
  async getDailyAttendanceReport(
    year?: number,
    quarter?: string,
    sectionId?: string
  ): Promise<DailyAttendanceResponse[]> {
    try {
      const params = new URLSearchParams();
      if (year) params.append("year", year.toString());
      if (quarter) params.append("quarter", quarter);
      if (sectionId) params.append("sectionId", sectionId);

      const response = await apiClient.get<DailyAttendanceResponse[]>(
        `/api/reports/attendance/daily?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to get daily attendance report");
    }
  }

  /**
   * Get feedback report
   */
  async getFeedbackReport(
    year?: number,
    quarter?: string,
    sectionId?: string,
    teacherId?: string
  ): Promise<FeedbackReportResponse[]> {
    try {
      const params = new URLSearchParams();
      if (year) params.append("year", year.toString());
      if (quarter) params.append("quarter", quarter);
      if (sectionId) params.append("sectionId", sectionId);
      if (teacherId) params.append("teacherId", teacherId);

      const response = await apiClient.get<FeedbackReportResponse[]>(
        `/api/reports/feedback?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to get feedback report");
    }
  }

  /**
   * Get teacher load report
   */
  async getTeacherLoadReport(
    year?: number,
    teacherId?: string
  ): Promise<TeacherLoadReportResponse[]> {
    try {
      const params = new URLSearchParams();
      if (year) params.append("year", year.toString());
      if (teacherId) params.append("teacherId", teacherId);

      const response = await apiClient.get<TeacherLoadReportResponse[]>(
        `/api/reports/teacher-load?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to get teacher load report");
    }
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(period: string = "last_30_days"): Promise<UsageStatsResponse> {
    try {
      const response = await apiClient.get<UsageStatsResponse>(
        `/api/reports/system-usage?period=${period}`
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to get usage statistics");
    }
  }

  /**
   * Get available quarters
   */
  async getAvailableQuarters(): Promise<string[]> {
    try {
      const response = await apiClient.get<string[]>("/api/reports/quarters");
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to get available quarters");
    }
  }

  /**
   * Get available years
   */
  async getAvailableYears(): Promise<number[]> {
    try {
      const response = await apiClient.get<number[]>("/api/reports/years");
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to get available years");
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
        return "Access denied. You do not have permission to view reports.";
      case 404:
        return "Report data not found.";
      case 500:
        return "Server error. Please try again later.";
      default:
        return error.message || "An unexpected error occurred.";
    }
  }
}

// Create and export singleton instance
export const reportsService = new ReportsService();

// Export the class for testing
export { ReportsService };
