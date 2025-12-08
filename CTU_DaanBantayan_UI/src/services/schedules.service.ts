import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api-client";
import { 
  CreateScheduleRequest, 
  CreateScheduleByIdRequest, 
  Schedule, 
  UpdateScheduleByIdRequest, 
  ScheduleResponse 
} from "@/types/api";

class SchedulesService {
  private getErrorMessage(error: ApiError): string {
    if (error.status === 409) { // Conflict status
      return error.message || "Schedule conflict detected";
    }

    if (error.details && typeof error.details === "object") {
      const detailsObj = error.details as Record<string, unknown>;
      if (typeof detailsObj["message"] === "string") return detailsObj["message"];
      if (typeof detailsObj["error"] === "string") return detailsObj["error"];
    }

    return error.message || "An unexpected error occurred";
  }

  // Create schedule using full request
  async createSchedule(scheduleData: CreateScheduleRequest): Promise<string> {
    try {
      const response = await apiClient.post<{ message: string }>("/api/schedules", scheduleData);
      return response.data.message;
    } catch (error) {
      if (error instanceof ApiError) throw new Error(this.getErrorMessage(error));
      throw new Error("Failed to create schedule");
    }
  }

  // Create schedule by IDs
  async createScheduleByIds(scheduleData: CreateScheduleByIdRequest): Promise<string> {
    try {
      const response = await apiClient.post<{ message: string }>("/api/schedules/create-by-ids", scheduleData);
      return response.data.message;
    } catch (error) {
      if (error instanceof ApiError) throw new Error(this.getErrorMessage(error));
      throw new Error("Failed to create schedule");
    }
  }

  // Get all schedules
  async getAllSchedules(): Promise<Schedule[]> {
    try {
      const response = await apiClient.get<Schedule[]>("/api/schedules");
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw new Error(this.getErrorMessage(error));
      throw new Error("Failed to fetch schedules");
    }
  }

  // Get all schedules for teachers
  async getTeacherSchedules(): Promise<ScheduleResponse[]> {
    try {
      const response = await apiClient.get<ScheduleResponse[]>("/api/schedules/teacher");
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw new Error(this.getErrorMessage(error));
      throw new Error("Failed to fetch teacher schedules");
    }
  }

  // Update schedule by ID (full request)
  async updateSchedule(id: string, scheduleData: Partial<CreateScheduleRequest>): Promise<string> {
    try {
      const response = await apiClient.put<{ message: string }>(`/api/schedules/${id}`, scheduleData);
      return response.data.message;
    } catch (error) {
      if (error instanceof ApiError) throw new Error(this.getErrorMessage(error));
      throw new Error("Failed to update schedule");
    }
  }

  // Update schedule by IDs
  async updateScheduleByIds(id: string, scheduleData: UpdateScheduleByIdRequest): Promise<ScheduleResponse> {
    try {
      const response = await apiClient.put<ScheduleResponse>(`/api/schedules/${id}/update-by-ids`, scheduleData);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw new Error(this.getErrorMessage(error));
      throw new Error("Failed to update schedule");
    }
  }

  // Delete schedule by ID
  async deleteSchedule(id: string): Promise<string> {
    try {
      const response = await apiClient.delete<{ message: string }>(`/api/schedules/${id}`);
      return response.data.message;
    } catch (error) {
      if (error instanceof ApiError) throw new Error(this.getErrorMessage(error));
      throw new Error("Failed to delete schedule");
    }
  }

  // Get schedules for a specific teacher
  async getSchedulesByTeacher(teacherId: string): Promise<ScheduleResponse[]> {
    try {
      const response = await apiClient.get<ScheduleResponse[]>(`/api/schedules/teacher/${teacherId}`);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw new Error(this.getErrorMessage(error));
      throw new Error("Failed to fetch schedules for teacher");
    }
  }

  // Fetch schedules by quarter (optional, keep if needed)
  async getAllSchedulesByQuarter(quarter: string): Promise<Schedule[]> {
    try {
      const response = await apiClient.get<Schedule[]>(`/api/schedules/quarter/${quarter}`);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw new Error(this.getErrorMessage(error));
      throw new Error("Failed to fetch all schedules by quarter");
    }
  }

  // Fetch teacher schedules by quarter (optional, keep if needed)
  async getTeacherSchedulesByQuarter(teacherId: string, quarter?: "Q1" | "Q2" | "Q3" | "Q4"): Promise<ScheduleResponse[]> {
    try {
      const params = new URLSearchParams();
      if (quarter) params.append("quarter", quarter);
      const response = await apiClient.get<ScheduleResponse[]>(`/api/schedules/teacher/${teacherId}/quarter?${params}`);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw new Error(this.getErrorMessage(error));
      throw new Error("Failed to fetch teacher schedules by quarter");
    }
  }
}

export const schedulesService = new SchedulesService();
