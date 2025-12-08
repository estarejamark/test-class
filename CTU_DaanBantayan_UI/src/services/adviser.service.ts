import { apiClient } from "@/lib/api-client";
import { StudentResponse, AdviserSuggestionRequest, SectionResponse } from "@/types/api";

export const adviserService = {
  /**
   * Get advisory class list for the current adviser
   */
  getAdvisoryClassList: async (): Promise<{ message: string; data: StudentResponse[] }> => {
    const response = await apiClient.get<{ message: string; data: StudentResponse[] }>("/api/adviser/advisory-class");
    return response.data;
  },

  /**
   * Suggest an update for a student in the advisory class
   */
  suggestAdvisoryClassUpdate: async (
    studentId: string,
    suggestion: AdviserSuggestionRequest
  ): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      `/api/adviser/advisory-class/${studentId}/suggest-update`,
      suggestion
    );
    return response.data;
  },

  /**
   * Get pending suggestions for a student
   */
  getPendingSuggestionsForStudent: async (studentId: string): Promise<string[]> => {
    const response = await apiClient.get<string[]>(
      `/api/adviser/advisory-class/${studentId}/pending-suggestions`
    );
    return response.data;
  },

  /**
   * Get adviser's section info
   */
  getAdviserSectionInfo: async (): Promise<SectionResponse> => {
    const response = await apiClient.get<SectionResponse>("/api/adviser/section-info");
    return response.data;
  },
};
