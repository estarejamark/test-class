// Teacher Reports Types
export interface ClassGradeSummary {
  subjectName: string;
  averageGrade: number;
  passingCount: number;
  totalCount: number;
  lowestGrade: number;
  highestGrade: number;
  passingRate: number;
}

export interface ClassAttendanceSummary {
  studentId: string;
  studentName: string;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  totalDays: number;
  attendanceRate: number;
}

export interface SubjectGrade {
  subjectName: string;
  grade: number;
  quarter: string;
}

export interface AttendanceSummary {
  presentCount: number;
  absentCount: number;
  lateCount: number;
  totalDays: number;
  attendanceRate: number;
}

export interface IndividualStudentReport {
  studentId: string;
  studentName: string;
  grades: SubjectGrade[];
  attendance: AttendanceSummary;
  overallAverage: number;
  conductRating?: string;
}

// Adviser Reports Types
export interface AdvisoryClassGeneral {
  sectionName: string;
  gradeLevel: number;
  totalStudents: number;
  activeStudents: number;
  averageAttendance: number;
  averageGrade: number;
  conductIssues: number;
  parentCommunications: number;
}

export interface AdvisoryAttendanceConsolidated {
  sectionName: string;
  month: string;
  totalDays: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendanceRate: number;
  topPerformers: string[];
  needsAttention: string[];
}

export interface ConductIncident {
  date: string;
  type: string;
  description: string;
  severity: string;
}

export interface BehaviourConductReport {
  studentId: string;
  studentName: string;
  conductRating: string;
  incidents: ConductIncident[];
  positiveNotes: string[];
  recommendations?: string;
}

export interface ParentCommunication {
  date: string;
  type: string;
  subject: string;
  status: string;
  notes?: string;
}

export interface ParentCommunicationActivity {
  studentId: string;
  studentName: string;
  communications: ParentCommunication[];
  totalCommunications: number;
  lastCommunication?: string;
  communicationTypes: Record<string, number>;
}

// Common Response Types
export interface ReportResponse<T> {
  data: T;
  generatedAt: string;
  generatedBy: string;
  filters: Record<string, any>;
}

// API Request Types
export interface TeacherReportFilters {
  sectionId: string;
  subjectId: string;
  quarter: string;
}

export interface AdviserReportFilters {
  quarter: string;
  startDate?: string;
  endDate?: string;
}

export interface StudentReportFilters {
  studentId: string;
  subjectId: string;
  quarter: string;
}

// Helper Types
export interface SubjectOption {
  id: string;
  name: string;
}

export interface SectionOption {
  id: string;
  name: string;
  gradeLevel: number;
}
