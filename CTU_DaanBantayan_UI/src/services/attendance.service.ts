import { apiClient as api } from "@/lib/api-client";
import {
  AttendanceRecord,
  CreateAttendanceRequest,
  BulkAttendanceRequest,
  AttendanceResponse,
  StudentAttendanceSummary,
  DailyAttendanceSummary,
  AttendanceStatus,
} from "@/types/attendance";

export const attendanceService = {
  // Create single attendance record
  createAttendance: async (data: CreateAttendanceRequest): Promise<AttendanceResponse> => {
    const response = await api.post<AttendanceResponse>("/api/attendance", data);
    return response.data;
  },

  // Bulk create attendance records for a class
  createBulkAttendance: async (data: BulkAttendanceRequest): Promise<AttendanceResponse[]> => {
    const response = await api.post<AttendanceResponse[]>("/api/attendance/bulk", data);
    return response.data;
  },

  // Get attendance records for a student in a section
  getStudentAttendance: async (
    studentId: string,
    sectionId: string,
    quarter?: string
  ): Promise<AttendanceRecord[]> => {
    let activeQuarter = quarter;
    if (!activeQuarter) {
      try {
        const { settingsService } = await import('@/services/settings.service');
        const activeQuarterData = await settingsService.getActiveQuarter();
        activeQuarter = activeQuarterData?.activeQuarter;
      } catch (error) {
        console.warn('Failed to fetch active quarter for attendance, using no quarter filter:', error);
      }
    }

    const params = new URLSearchParams({ studentId, sectionId });
    if (activeQuarter) params.append("quarter", activeQuarter);

    const response = await api.get<AttendanceRecord[]>(`/api/attendance/student?${params}`);
    return response.data;
  },

  // Get attendance records for a section on a specific date
  getSectionAttendanceByDate: async (
    sectionId: string,
    date: string,
    quarter?: string
  ): Promise<AttendanceRecord[]> => {
    const params = new URLSearchParams({ date });
    if (quarter) params.append("quarter", quarter);

    const response = await api.get<AttendanceRecord[]>(`/api/attendance/section/${sectionId}/date?${params}`);
    return response.data;
  },

  // Get attendance summary for a section on a specific date
  getSectionAttendanceSummary: async (
    sectionId: string,
    date: string,
    quarter?: string
  ): Promise<{ present: number; absent: number; late: number; total: number }> => {
    let activeQuarter = quarter;
    if (!activeQuarter) {
      try {
        const { settingsService } = await import('@/services/settings.service');
        const activeQuarterData = await settingsService.getActiveQuarter();
        activeQuarter = activeQuarterData?.activeQuarter;
      } catch (error) {
        console.warn('Failed to fetch active quarter for attendance, using no quarter filter:', error);
      }
    }

    const params = new URLSearchParams({ sectionId, date });
    if (activeQuarter) params.append("quarter", activeQuarter);

    const response = await api.get<{ present: number; absent: number; late: number; total: number }>(`/api/attendance/summary/section/date?${params}`);
    return response.data;
  },

  // Get attendance summary for a student
  getStudentAttendanceSummary: async (
    studentId: string,
    sectionId: string,
    quarter?: string
  ): Promise<StudentAttendanceSummary> => {
    const params = new URLSearchParams({ studentId, sectionId });
    if (quarter) params.append("quarter", quarter);

    const response = await api.get<StudentAttendanceSummary>(`/api/attendance/summary/student?${params}`);
    return response.data;
  },

  // Get daily attendance summary for a section
  getSectionDailySummary: async (
    sectionId: string,
    date: string,
    quarter?: string
  ): Promise<DailyAttendanceSummary> => {
    let activeQuarter = quarter;
    if (!activeQuarter) {
      try {
        const { settingsService } = await import('@/services/settings.service');
        const activeQuarterData = await settingsService.getActiveQuarter();
        activeQuarter = activeQuarterData?.activeQuarter;
      } catch (error) {
        console.warn('Failed to fetch active quarter for attendance, using no quarter filter:', error);
      }
    }

    const params = new URLSearchParams({ sectionId, date });
    if (activeQuarter) params.append("quarter", activeQuarter);

    const response = await api.get<DailyAttendanceSummary>(`/api/attendance/summary/daily?${params}`);
    return response.data;
  },

  // Update attendance record
  updateAttendance: async (id: string, status: AttendanceStatus): Promise<AttendanceResponse> => {
    const response = await api.put<AttendanceResponse>(`/api/attendance/${id}`, { status });
    return response.data;
  },

  // Delete attendance record
  deleteAttendance: async (id: string): Promise<void> => {
    await api.delete(`/api/attendance/${id}`);
  },
};
