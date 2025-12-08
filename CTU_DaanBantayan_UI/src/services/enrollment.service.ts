import { apiClient } from '../lib/api-client';
import { Quarter } from '../types/api';

export interface EnrolledStudentResponse {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  email: string;
  gradeLevel: string;
  sectionName: string;
  parentName: string;
  parentContact: string;
  enrolledAt: string;
  schoolYear: string;
  quarter: Quarter;
}

export interface UnassignedStudentResponse {
  studentId: string;
  studentName: string;
  email: string;
  gradeLevel: string;
  parentName: string;
  parentContact: string;
}

export interface StudentWithEnrollmentResponse {
  studentId: string;
  studentName: string;
  email: string;
  gradeLevel: string;
  currentSectionId: string | null;
  currentSectionName: string | null;
  parentName: string;
  parentContact: string;
  enrolledAt?: string;
  schoolYear?: string;
  quarter?: Quarter;
}

export interface EnrollmentRequest {
  studentId: string;
  sectionId: string;
  schoolYear?: string;
  quarter?: Quarter;
}

export interface MoveStudentRequest {
  studentId: string;
  newSectionId: string;
  schoolYear?: string;
  quarter?: Quarter;
}

export const enrollmentService = {
  // Get enrolled students for a specific section
  getEnrolledStudents: async (sectionId: string): Promise<EnrolledStudentResponse[]> => {
    const response = await apiClient.get<EnrolledStudentResponse[]>(`/api/enrollments/sections/${sectionId}/students`);
    return response.data;
  },

  // Get unassigned students (not enrolled in any section)
  getUnassignedStudents: async (): Promise<UnassignedStudentResponse[]> => {
    const response = await apiClient.get<UnassignedStudentResponse[]>('/api/enrollments/students/unassigned');
    return response.data;
  },

  // Get all students with their enrollment status
  getAllStudentsWithEnrollmentStatus: async (): Promise<StudentWithEnrollmentResponse[]> => {
    const response = await apiClient.get<StudentWithEnrollmentResponse[]>('/api/enrollments/students');
    return response.data;
  },

  // Assign a student to a section
  assignStudentToSection: async (request: EnrollmentRequest): Promise<string> => {
    const response = await apiClient.post<string>('/api/enrollments', request);
    return response.data;
  },

  // Move a student to another section
  moveStudentToSection: async (request: MoveStudentRequest): Promise<string> => {
    const response = await apiClient.put<string>('/api/enrollments/move', request);
    return response.data;
  },

  // Mark a student as inactive (graduated/transferred)
  markStudentInactive: async (studentId: string): Promise<string> => {
    const response = await apiClient.put<string>(`/api/enrollments/students/${studentId}/inactive`);
    return response.data;
  },

  // Remove a student from a section
  removeStudentFromSection: async (studentId: string, sectionId: string): Promise<string> => {
    const response = await apiClient.delete<string>(`/api/enrollments/students/${studentId}/sections/${sectionId}`);
    return response.data;
  },
};
