/**
 * Dashboard service for centralized dashboard data
 */

import { apiClient } from "@/lib/api-client";
import {
  DashboardStats,
  SubjectsByGradeData,
  StudentsPerSectionData,
  TeacherLoadStatusData,
  AdviserSummary,
  Role,
  ProfileResponse,
  Section,
  SectionResponse,
} from "@/types/api";
import { schedulesService } from "@/services/schedules.service";
import { sectionsService } from "@/services/sections.service";
import { studentsService } from "@/services/students.service";
import { attendanceService } from "@/services/attendance.service";
import { feedbackService } from "@/services/feedback.service";
import { settingsService } from "@/services/settings.service";

/**
 * Dashboard service class
 */
class DashboardService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get<DashboardStats>("/api/dashboard/stats");
      return response.data;
    } catch (error) {
      throw new Error("Failed to get dashboard statistics");
    }
  }

  /**
   * Get subjects overview data
   */
  async getSubjectsOverview(role?: Role, profile?: ProfileResponse): Promise<
    Array<{
      id: string;
      subject: string;
      grade: string;
      teacher: AdviserSummary;
      sections: number;
      students: number;
    }>
  > {
    try {
      const response = await apiClient.get<Array<{
        id: string;
        subject: string;
        grade: string;
        teacher: AdviserSummary;
        sections: number;
        students: number;
      }>>("/api/dashboard/subjects-overview");
      return response.data;
    } catch (error) {
      throw new Error("Failed to get subjects overview");
    }
  }

  /**
   * Get teacher loads overview data
   */
  async getTeacherLoadsOverview(role?: Role, profile?: ProfileResponse): Promise<
    Array<{
      id: string;
      teacher: AdviserSummary;
      subject: string;
      section: string;
      schedule: string;
      status: string;
    }>
  > {
    try {
      const response = await apiClient.get<Array<{
        id: string;
        teacher: AdviserSummary;
        subject: string;
        section: string;
        schedule: string;
        status: string;
      }>>("/api/dashboard/teacher-loads-overview");
      return response.data;
    } catch (error) {
      throw new Error("Failed to get teacher loads overview");
    }
  }

  /**
   * Get sections overview data
   */
  async getSectionsOverview(role?: Role, profile?: ProfileResponse): Promise<
    Array<{
      id: string;
      section: string;
      grade: string;
      adviser: AdviserSummary;
      students: number;
      status: string;
    }>
  > {
    try {
      const response = await apiClient.get<Array<{
        id: string;
        section: string;
        grade: string;
        adviser: AdviserSummary;
        students: number;
        status: string;
      }>>("/api/dashboard/sections-overview");
      return response.data;
    } catch (error) {
      throw new Error("Failed to get sections overview");
    }
  }

  /**
   * Get subjects by grade level data for charts
   */
  async getSubjectsByGradeData(role?: Role, profile?: ProfileResponse): Promise<SubjectsByGradeData[]> {
    try {
      const response = await apiClient.get<SubjectsByGradeData[]>("/api/dashboard/subjects-by-grade");
      return response.data;
    } catch (error) {
      throw new Error("Failed to get subjects by grade data");
    }
  }

  /**
   * Get students per section data for pie chart
   */
  async getStudentsPerSectionData(role?: Role, profile?: ProfileResponse): Promise<StudentsPerSectionData[]> {
    try {
      // Use the backend API directly instead of filtering on frontend
      const response = await apiClient.get<StudentsPerSectionData[]>("/api/dashboard/students-per-section");
      return response.data;
    } catch (error) {
      console.error("Failed to get students per section data from backend:", error);
      // Return empty array as fallback
      return [];
    }
  }

  /**
   * Get teacher load status data for line chart
   */
  async getTeacherLoadStatusData(role?: Role, profile?: ProfileResponse): Promise<TeacherLoadStatusData[]> {
    try {
      const response = await apiClient.get<TeacherLoadStatusData[]>("/api/dashboard/teacher-load-status");
      return response.data;
    } catch (error) {
      console.error("Failed to get teacher load status data:", error);
      throw new Error("Failed to get teacher load status data");
    }
  }

  /**
   * Get student attendance summary for dashboard
   */
  async getStudentAttendanceSummary(studentId: string): Promise<{
    currentQuarter: string;
    presentDays: number;
    totalDays: number;
    attendanceRate: number;
  }> {
    try {
      // Get active quarter from settings
      const activeQuarterResponse = await settingsService.getActiveQuarter();
      const currentQuarter = activeQuarterResponse?.activeQuarter || "Q1";

      // Get student's section first to get sectionId
      const studentResponse = await apiClient.get(`/api/students/${studentId}`);
      const student = studentResponse.data as { sectionId: string };
      const sectionId = student.sectionId;

      const summary = await attendanceService.getStudentAttendanceSummary(
        studentId,
        sectionId,
        currentQuarter
      );

      return {
        currentQuarter,
        presentDays: summary.presentCount,
        totalDays: summary.totalDays,
        attendanceRate: summary.attendanceRate,
      };
    } catch (error) {
      console.error("Failed to get student attendance summary:", error);
      // Return default values if API fails
      return {
        currentQuarter: "Q1",
        presentDays: 0,
        totalDays: 0,
        attendanceRate: 0,
      };
    }
  }

  /**
   * Get student feedback status for dashboard
   */
  async getStudentFeedbackStatus(studentId: string): Promise<{
    pendingReplies: number;
  }> {
    try {
      // Get student's section first
      const studentResponse = await apiClient.get(`/api/students/${studentId}`);
      const student = studentResponse.data as { sectionId: string };
      const sectionId = student.sectionId;

      // Get feedback for student's section
      const feedback = await feedbackService.getFeedbackForSection(sectionId);
      const pendingReplies = feedback.filter((f: any) => f.studentResponse === null || f.studentResponse === "").length;

      return {
        pendingReplies,
      };
    } catch (error) {
      console.error("Failed to get student feedback status:", error);
      return {
        pendingReplies: 0,
      };
    }
  }

  /**
   * Get student correction requests status for dashboard
   */
  async getStudentCorrectionRequestsStatus(studentId: string): Promise<{
    pending: number;
    approved: number;
    rejected: number;
  }> {
    try {
      // TODO: Implement correction requests API call
      // For now, return default values
      return {
        pending: 0,
        approved: 0,
        rejected: 0,
      };
    } catch (error) {
      console.error("Failed to get student correction requests status:", error);
      return {
        pending: 0,
        approved: 0,
        rejected: 0,
      };
    }
  }

  /**
   * Get student profile information for dashboard
   */
  async getStudentProfileInfo(studentId: string): Promise<{
    firstName: string;
    lastName: string;
    gradeLevel: string;
    sectionName: string;
    adviserName: string;
    profileImage?: string;
  }> {
    try {
      // Get student details from API
      const studentResponse = await apiClient.get(`/api/students/${studentId}`);
      const student = studentResponse.data as {
        firstName: string;
        lastName: string;
        sectionId: string;
        profileImage?: string;
      };

      // Get section details
      const sectionResponse = await apiClient.get(`/api/sections/${student.sectionId}`);
      const section = sectionResponse.data as {
        gradeLevel: string;
        name: string;
        adviserName?: string;
      };

      return {
        firstName: student.firstName,
        lastName: student.lastName,
        gradeLevel: section.gradeLevel,
        sectionName: section.name,
        adviserName: section.adviserName || "Unassigned",
        profileImage: student.profileImage,
      };
    } catch (error) {
      console.error("Failed to get student profile info:", error);
      // Return default values if API fails
      return {
        firstName: "Student",
        lastName: "Name",
        gradeLevel: "Grade 7",
        sectionName: "7-A",
        adviserName: "Dr. Maria Santos",
      };
    }
  }

  /**
   * Get all student dashboard data in one call
   */
  async getStudentDashboardData(studentId: string): Promise<{
    attendanceSummary: {
      currentQuarter: string;
      presentDays: number;
      totalDays: number;
      attendanceRate: number;
    };
    pendingFeedbackReplies: number;
    correctionRequestsStatus: {
      pending: number;
      approved: number;
      rejected: number;
    };
    profile: {
      firstName: string;
      lastName: string;
      gradeLevel: string;
      sectionName: string;
      adviserName: string;
      profileImage?: string;
    };
  }> {
    try {
      const [
        attendanceSummary,
        feedbackStatus,
        correctionRequestsStatus,
        profile,
      ] = await Promise.all([
        this.getStudentAttendanceSummary(studentId),
        this.getStudentFeedbackStatus(studentId),
        this.getStudentCorrectionRequestsStatus(studentId),
        this.getStudentProfileInfo(studentId),
      ]);

      return {
        attendanceSummary,
        pendingFeedbackReplies: feedbackStatus.pendingReplies,
        correctionRequestsStatus,
        profile,
      };
    } catch (error) {
      console.error("Failed to get student dashboard data:", error);
      throw new Error("Failed to get student dashboard data");
    }
  }

  /**
   * Get all dashboard data in one call
   */
  async getAllDashboardData(role?: Role, profile?: ProfileResponse): Promise<{
    stats: DashboardStats;
    subjectsOverview: Array<{
      id: string;
      subject: string;
      grade: string;
      teacher: AdviserSummary;
      sections: number;
      students: number;
    }>;
    teacherLoadsOverview: Array<{
      id: string;
      teacher: AdviserSummary;
      subject: string;
      section: string;
      schedule: string;
      status: string;
    }>;
    sectionsOverview: Array<{
      id: string;
      section: string;
      grade: string;
      adviser: AdviserSummary;
      students: number;
      status: string;
    }>;
    subjectsByGrade: SubjectsByGradeData[];
    studentsPerSection: StudentsPerSectionData[];
    teacherLoadStatus: TeacherLoadStatusData[];
  }> {
    const startTime = performance.now();
    console.log("⏱️ DASHBOARD_DATA_START: Starting dashboard data fetch");

    try {
      const [
        stats,
        subjectsOverview,
        teacherLoadsOverview,
        sectionsOverview,
        subjectsByGrade,
        studentsPerSection,
        teacherLoadStatus,
      ] = await Promise.all([
        this.getDashboardStats(),
        this.getSubjectsOverview(role, profile),
        this.getTeacherLoadsOverview(role, profile),
        this.getSectionsOverview(role, profile),
        this.getSubjectsByGradeData(role, profile),
        this.getStudentsPerSectionData(role, profile),
        this.getTeacherLoadStatusData(role, profile),
      ]);

      const endTime = performance.now();
      console.log(`⏱️ DASHBOARD_DATA_COMPLETE: All dashboard data fetched in ${(endTime - startTime).toFixed(2)}ms`);

      return {
        stats,
        subjectsOverview,
        teacherLoadsOverview,
        sectionsOverview,
        subjectsByGrade,
        studentsPerSection,
        teacherLoadStatus,
      };
    } catch (error) {
      const endTime = performance.now();
      console.error(`⏱️ DASHBOARD_DATA_ERROR: Failed after ${(endTime - startTime).toFixed(2)}ms`, error);
      throw new Error("Failed to get dashboard data");
    }
  }
}

// Create and export singleton instance
export const dashboardService = new DashboardService();

// Export the class for testing
export { DashboardService };
