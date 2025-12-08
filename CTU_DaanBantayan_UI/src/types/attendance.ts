import { Quarter } from './api';

export enum AttendanceStatus {
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
  LATE = "LATE",
}

export interface AttendanceRecord {
  id?: string;
  studentId: string;
  sectionId: string;
  quarter: string;
  attendanceDate: string; // YYYY-MM-DD format
  status: AttendanceStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAttendanceRequest {
  studentId: string;
  sectionId: string;
  quarter: string;
  attendanceDate: string; // YYYY-MM-DD format
  status: AttendanceStatus;
}

export interface BulkAttendanceRequest {
  sectionId: string;
  quarter: Quarter;
  attendanceDate: string; // YYYY-MM-DD format
  attendanceRecords: {
    studentId: string;
    status: AttendanceStatus;
  }[];
}

export interface AttendanceResponse {
  id: string;
  studentId: string;
  sectionId: string;
  quarter: string;
  attendanceDate: string;
  status: AttendanceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StudentAttendanceSummary {
  studentId: string;
  studentName: string;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  totalDays: number;
  attendanceRate: number;
}

export interface DailyAttendanceSummary {
  date: string;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  totalStudents: number;
}
