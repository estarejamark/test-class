/**
 * Feedback service for handling feedback writing API calls
 */

import { apiClient, ApiError } from "@/lib/api-client";
import { FeedbackResponse } from "@/types/api";

/**
 * Feedback service class
 */
class FeedbackService {
  /**
   * Record feedback for a student
   */
  async recordFeedback(
    studentId: string,
    sectionId: string,
    quarter: string,
    feedback: string
  ): Promise<FeedbackResponse> {
    try {
      const response = await apiClient.post<FeedbackResponse>("/api/feedback", {
        studentId,
        sectionId,
        quarter,
        feedback,
      });
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to record feedback");
    }
  }

  /**
   * Get feedback for a student in a section
   */
  async getFeedbackForStudent(
    studentId: string,
    sectionId: string,
    quarter: string
  ): Promise<FeedbackResponse | null> {
    try {
      const response = await apiClient.get<FeedbackResponse>(
        `/api/feedback/student/${studentId}/section/${sectionId}?quarter=${quarter}`
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        // Return null if no feedback exists (404)
        if (error.status === 404) {
          return null;
        }
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to get student feedback");
    }
  }

  /**
   * Get feedback for all students in a section
   */
  async getFeedbackForSection(
    sectionId: string,
    quarter?: string
  ): Promise<FeedbackResponse[]> {
    try {
      let activeQuarter = quarter;
      if (!activeQuarter) {
        try {
          const { settingsService } = await import('@/services/settings.service');
          const activeQuarterData = await settingsService.getActiveQuarter();
          activeQuarter = activeQuarterData?.activeQuarter;
        } catch (error) {
          console.warn('Failed to fetch active quarter for feedback, using no quarter filter:', error);
        }
      }

      const response = await apiClient.get<FeedbackResponse[]>(
        `/api/feedback/section/${sectionId}${activeQuarter ? `?quarter=${activeQuarter}` : ''}`
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to get section feedback");
    }
  }

  /**
   * Update feedback for a student
   */
  async updateFeedback(
    feedbackId: string,
    feedback: string
  ): Promise<FeedbackResponse> {
    try {
      const response = await apiClient.put<FeedbackResponse>(`/api/feedback/${feedbackId}`, {
        feedback,
      });
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to update feedback");
    }
  }

  /**
   * Delete feedback record
   */
  async deleteFeedback(feedbackId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/feedback/${feedbackId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to delete feedback");
    }
  }

  /**
   * Add student response to feedback
   */
  async addStudentResponse(
    feedbackId: string,
    response: string
  ): Promise<FeedbackResponse> {
    try {
      const responseData = await apiClient.post<FeedbackResponse>(
        `/api/feedback/${feedbackId}/response`,
        { response }
      );
      return responseData.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to add student response");
    }
  }

  /**
   * Get feedback with responses for teacher
   */
  async getFeedbackWithResponsesForTeacher(): Promise<FeedbackResponse[]> {
    try {
      const response = await apiClient.get<FeedbackResponse[]>(
        "/api/feedback/teacher/responses"
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to get feedback responses for teacher");
    }
  }

  /**
   * Get feedback with responses for adviser
   */
  async getFeedbackWithResponsesForAdviser(): Promise<FeedbackResponse[]> {
    try {
      const response = await apiClient.get<FeedbackResponse[]>(
        "/api/feedback/adviser/responses"
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to get feedback responses for adviser");
    }
  }

  /**
   * Mark student response as reviewed
   */
  async markResponseReviewed(feedbackId: string): Promise<FeedbackResponse> {
    try {
      const response = await apiClient.patch<FeedbackResponse>(
        `/api/feedback/${feedbackId}/response/reviewed`
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(this.getErrorMessage(error));
      }
      throw new Error("Failed to mark response as reviewed");
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
        return "Invalid feedback data. Please check your input.";
      case 401:
        return "Unauthorized. Please log in again.";
      case 403:
        return "Access denied. You do not have permission to manage feedback.";
      case 404:
        return "Feedback record or student not found.";
      case 409:
        return "Feedback record already exists or conflict detected.";
      case 500:
        return "Server error. Please try again later.";
      default:
        return error.message || "An unexpected error occurred.";
    }
  }
}

// Create and export singleton instance
export const feedbackService = new FeedbackService();

// Export the class for testing
export { FeedbackService };
