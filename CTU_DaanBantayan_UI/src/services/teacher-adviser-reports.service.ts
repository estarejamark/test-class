import { apiClient } from '@/lib/api-client';
import {
  ClassGradeSummary,
  ClassAttendanceSummary,
  IndividualStudentReport,
  AdvisoryClassGeneral,
  AdvisoryAttendanceConsolidated,
  BehaviourConductReport,
  ParentCommunicationActivity,
  ReportResponse,
  TeacherReportFilters,
  AdviserReportFilters,
  StudentReportFilters,
  SubjectOption,
  SectionOption
} from '@/types/teacher-adviser-reports';

class TeacherAdviserReportsService {

  // Teacher Reports
  async getClassGradeSummary(filters: TeacherReportFilters): Promise<ReportResponse<ClassGradeSummary>> {
    const response = await apiClient.get<ReportResponse<ClassGradeSummary>>(
      `/teacher-adviser-reports/teacher/class-grade-summary?sectionId=${filters.sectionId}&subjectId=${filters.subjectId}&quarter=${filters.quarter}`
    );
    return response.data;
  }

  async getClassAttendanceSummary(filters: TeacherReportFilters): Promise<ReportResponse<ClassAttendanceSummary[]>> {
    const response = await apiClient.get<ReportResponse<ClassAttendanceSummary[]>>(
      `/teacher-adviser-reports/teacher/class-attendance-summary?sectionId=${filters.sectionId}&subjectId=${filters.subjectId}&quarter=${filters.quarter}`
    );
    return response.data;
  }

  async getIndividualStudentReport(filters: StudentReportFilters): Promise<ReportResponse<IndividualStudentReport>> {
    const response = await apiClient.get<ReportResponse<IndividualStudentReport>>(
      `/teacher-adviser-reports/teacher/student-report/${filters.studentId}?subjectId=${filters.subjectId}&quarter=${filters.quarter}`
    );
    return response.data;
  }

  // Adviser Reports
  async getAdvisoryClassGeneralReport(quarter: string): Promise<ReportResponse<AdvisoryClassGeneral[]>> {
    const response = await apiClient.get<ReportResponse<AdvisoryClassGeneral[]>>(
      `/teacher-adviser-reports/adviser/class-general?quarter=${quarter}`
    );
    return response.data;
  }

  async getAdvisoryAttendanceConsolidated(filters: AdviserReportFilters): Promise<ReportResponse<AdvisoryAttendanceConsolidated[]>> {
    const params = new URLSearchParams({
      quarter: filters.quarter,
      startDate: filters.startDate || '',
      endDate: filters.endDate || ''
    });
    const response = await apiClient.get<ReportResponse<AdvisoryAttendanceConsolidated[]>>(
      `/teacher-adviser-reports/adviser/attendance-consolidated?${params}`
    );
    return response.data;
  }

  async getBehaviourConductReport(quarter: string): Promise<ReportResponse<BehaviourConductReport[]>> {
    const response = await apiClient.get<ReportResponse<BehaviourConductReport[]>>(
      `/teacher-adviser-reports/adviser/behaviour-conduct?quarter=${quarter}`
    );
    return response.data;
  }

  async getParentCommunicationActivity(filters: AdviserReportFilters): Promise<ReportResponse<ParentCommunicationActivity[]>> {
    const params = new URLSearchParams({
      startDate: filters.startDate || '',
      endDate: filters.endDate || ''
    });
    const response = await apiClient.get<ReportResponse<ParentCommunicationActivity[]>>(
      `/teacher-adviser-reports/adviser/parent-communication?${params}`
    );
    return response.data;
  }

  // Helper methods
  async getTeacherSubjects(startDate: string, endDate: string, schoolYear?: string): Promise<SubjectOption[]> {
    const params = new URLSearchParams({
      startDate,
      endDate
    });
    if (schoolYear) params.append('schoolYear', schoolYear);
    const response = await apiClient.get<SubjectOption[]>(
      `/teacher-adviser-reports/teacher/subjects?${params}`
    );
    return response.data;
  }

  async getTeacherSections(schoolYear?: string): Promise<SectionOption[]> {
    const params = schoolYear ? `?schoolYear=${schoolYear}` : '';
    const response = await apiClient.get<SectionOption[]>(
      `/teacher-adviser-reports/teacher/sections${params}`
    );
    return response.data;
  }

  async getAdviserSections(schoolYear?: string): Promise<SectionOption[]> {
    const params = schoolYear ? `?schoolYear=${schoolYear}` : '';
    const response = await apiClient.get<SectionOption[]>(
      `/teacher-adviser-reports/adviser/sections${params}`
    );
    return response.data;
  }

  // New methods for component compatibility
  async getAvailableYears(): Promise<string[]> {
    const response = await apiClient.get<string[]>('/teacher-adviser-reports/available-years');
    return response.data;
  }

  async getAvailableSections(): Promise<SectionOption[]> {
    const response = await apiClient.get<SectionOption[]>('/teacher-adviser-reports/available-sections');
    return response.data;
  }

  async getTeacherGradeSummary(year: string, sectionId: string): Promise<ReportResponse<ClassGradeSummary>> {
    const response = await apiClient.get<ReportResponse<ClassGradeSummary>>(`/teacher-adviser-reports/teacher/class-grade-summary?sectionId=${sectionId}&subjectId=default&quarter=Q1&year=${year}`);
    return response.data;
  }

  async getTeacherAttendanceSummary(year: string, sectionId: string): Promise<ReportResponse<ClassAttendanceSummary[]>> {
    const response = await apiClient.get<ReportResponse<ClassAttendanceSummary[]>>(`/teacher-adviser-reports/teacher/class-attendance-summary?sectionId=${sectionId}&subjectId=default&quarter=Q1&year=${year}`);
    return response.data;
  }

  async getTeacherStudentReport(year: string, sectionId: string): Promise<ReportResponse<IndividualStudentReport>> {
    const response = await apiClient.get<ReportResponse<IndividualStudentReport>>(`/teacher-adviser-reports/teacher/student-report/default?subjectId=default&quarter=Q1&year=${year}&sectionId=${sectionId}`);
    return response.data;
  }

  async getAdviserClassGeneral(year: string, sectionId: string): Promise<ReportResponse<AdvisoryClassGeneral[]>> {
    const response = await apiClient.get<ReportResponse<AdvisoryClassGeneral[]>>(`/teacher-adviser-reports/adviser/class-general?quarter=Q1&year=${year}&sectionId=${sectionId}`);
    return response.data;
  }

  async getAdviserConsolidatedAttendance(year: string, sectionId: string): Promise<ReportResponse<AdvisoryAttendanceConsolidated[]>> {
    const response = await apiClient.get<ReportResponse<AdvisoryAttendanceConsolidated[]>>(`/teacher-adviser-reports/adviser/attendance-consolidated?quarter=Q1&startDate=2024-01-01&endDate=2024-12-31&year=${year}&sectionId=${sectionId}`);
    return response.data;
  }

  async getAdviserBehaviorConduct(year: string, sectionId: string): Promise<ReportResponse<BehaviourConductReport[]>> {
    const response = await apiClient.get<ReportResponse<BehaviourConductReport[]>>(`/teacher-adviser-reports/adviser/behaviour-conduct?quarter=Q1&year=${year}&sectionId=${sectionId}`);
    return response.data;
  }

  async getAdviserParentCommunication(year: string, sectionId: string): Promise<ReportResponse<ParentCommunicationActivity[]>> {
    const response = await apiClient.get<ReportResponse<ParentCommunicationActivity[]>>(`/teacher-adviser-reports/adviser/parent-communication?startDate=2024-01-01&endDate=2024-12-31&year=${year}&sectionId=${sectionId}`);
    return response.data;
  }

  // Export functionality
  async exportReport(reportType: string, year: string, sectionId: string, format: 'pdf' | 'excel'): Promise<Blob> {
    const response = await apiClient.get(
      `/teacher-adviser-reports/export/${reportType}?year=${year}&sectionId=${sectionId}&format=${format}`,
      { responseType: 'blob' }
    );
    return response.data as Blob;
  }
}

export const teacherAdviserReportsService = new TeacherAdviserReportsService();
