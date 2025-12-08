/**
 * API TypeScript interfaces for all backend entities
 * Based on the CTU Database API documentation
 */

// Enums
export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

export enum Role {
  ADMIN = "ADMIN",
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
  ADVISER = "ADVISER",
}

export enum SectionStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

// Base interfaces
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Subject interfaces
export interface Subject extends BaseEntity {
  subjectCode: string;
  name: string;
}

export interface CreateSubjectRequest {
  subjectCode: string;
  name: string;
}

export interface UpdateSubjectRequest extends CreateSubjectRequest {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectSearchParams {
  subjectCode?: string;
  name?: string;
  page?: number;
  size?: number;
}

// Section interfaces
export interface Section extends BaseEntity {
  name: string;
  gradeLevel: string;
  adviser: AdviserSummary;
}

export interface CreateSectionRequest {
  name: string;
  gradeLevel: string;
  adviser: string; // ID of existing teacher profile
}

export interface UpdateSectionRequest {
  name: string;
  gradeLevel: string;
  adviser: string | null;
}

export interface SectionSearchParams {
  name?: string;
  gradeLevel?: string;
  adviserName?: string;
  page?: number;
  size?: number;
}

// Profile interfaces
export interface Profile extends BaseEntity {
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: Gender;
  birthDate: string; // YYYY-MM-DD format
  contactNumber: string;
  address: string;
  parentName?: string;
  parentContact?: string;
  gradeLevel?: string;
  lrn?: string;
  user?: {
    id: string;
    email: string;
    role: string;
  };
  // Backend compatibility - actual response uses 'userEntity'
  userEntity?: {
    id: string;
    email: string;
    password: string;
    membershipCode: string;
    role: string;
    createdAt: string;
    updatedAt: string | null;
  };
}

export interface ProfileResponse {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: Gender;
  birthDate: string;
  contactNumber: string;
  address: string;
  parentName?: string;
  parentContact?: string;
  gradeLevel?: string;
  isAdviser?: boolean;
}

export interface CreateProfileRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: Gender;
  birthDate: string; // YYYY-MM-DD format
  contactNumber: string;
  address: string;
  parentName?: string; // Optional parent/guardian name for students
  parentContact?: string; // Optional parent/guardian contact for students
  gradeLevel?: string; // Optional grade level for students
  lrn?: string; // Optional LRN for students
  password?: string; // Optional password field for teachers during profile creation
  confirmPassword?: string; // Optional confirm password field for teachers
}

export interface UpdateProfileRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: Gender;
  birthDate: string; // YYYY-MM-DD format
  contactNumber?: string | null; // Make optional for updates
  address: string;
  parentName?: string; // Optional parent/guardian name for students
  parentContact?: string; // Optional parent/guardian contact for students
  gradeLevel?: string; // Optional grade level for students
  password?: string; // Optional password field for teachers during profile creation
  confirmPassword?: string; // Optional confirm password field for teachers
  id?: string; // Optional since it's in URL path, not request body
}

export interface ProfileSearchParams {
  role?: string;
  name?: string;
  page?: number;
  size?: number;
}

// Schedule interfaces (backend API)
export interface Schedule extends BaseEntity {
  teacher: Profile;
  subject: Subject;
  section: Section;
  days: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

// Backend response interfaces matching Kotlin data classes
export interface UserSummary {
  id: string;
  email: string;
  role: string;
}

export interface ProfileSummary {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  user?: UserSummary;
}

export interface SubjectSummary {
  id: string;
  subjectCode: string;
  name: string;
}

export interface AdviserSummary {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  name?: string;
  fullName?: string;
}

export interface SectionSummary {
  id: string;
  name: string;
  gradeLevel: string;
  adviser: AdviserSummary;
}

export interface ScheduleResponse extends BaseEntity {
  teacher: ProfileSummary;
  subject: SubjectSummary;
  section: SectionSummary;
  days: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

export interface CreateScheduleRequest {
  teacher: Partial<Profile>;
  subject: Partial<Subject>;
  section: Partial<Section>;
  startTime: string; // ISO 8601 format
  endTime: string; // ISO 8601 format
}

export interface CreateScheduleByIdRequest {
  teacherId: string;
  subjectId: string;
  sectionId: string;
  days: string;
  startTime: string; // ISO 8601 format
  endTime: string; // ISO 8601 format
}

export interface UpdateScheduleByIdRequest {
  teacherId: string;
  subjectId: string;
  sectionId: string;
  days: string;
  startTime: string; // ISO 8601 format
  endTime: string; // ISO 8601 format
}

// Teacher Load interfaces (frontend-specific)
export interface TeacherLoad extends BaseEntity {
  teacherName: string;
  subjectName: string;
  sectionName: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  status?: "assigned" | "pending";
}

export interface CreateTeacherLoadRequest {
  teacherId: string;
  subjectId: string;
  sectionId: string;
  startTime: string;
  endTime: string;
}

// API Response wrappers
export interface ApiPaginatedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      empty: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    empty: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

export interface ApiSuccessResponse {
  message: string;
  id?: string;
}

// Dashboard Data interfaces
export interface DashboardStats {
  totalSubjects: number;
  totalSections: number;
  totalTeachers: number;
  totalStudents: number;
  assignedLoads: number;
  pendingLoads: number;
}

// Chart data interfaces
export interface SubjectsByGradeData {
  grade: string;
  subjects: number;
}

export interface StudentsPerSectionData {
  name: string;
  value: number;
  fill: string;
}

export interface TeacherLoadStatusData {
  month: string;
  assigned: number;
  pending: number;
}

// System User interfaces for user management
export interface SystemUser {
  id: string;
  email: string;
  membershipCode: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt?: string;

  // --- Only for students ---
  gradeLevel?: string;
  sectionName?: string;

  // --- For all users ---
  profile?: {
    id: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    gender: Gender;
    birthDate: string;
    contactNumber: string;
    address: string;
    parentName?: string;
    parentContact?: string;
  };

  // Optional enrollments (students)
  enrollments?: {
    id: string;
    section: {
      id: string;
      name: string;
      gradeLevel: string;
    };
    enrolledAt: string;
    schoolYear: string;
    quarter: Quarter;
  }[];
}


export interface SystemUsersResponse {
  content: SystemUser[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface UserSearchParams {
  email?: string;
  role?: string;
  name?: string;
  page?: number;
  size?: number;
}

// Section Dependencies interfaces for delete confirmation
export interface SectionDependencyResponse {
  sectionId: string;
  sectionName: string;
  gradeLevel: string;
  adviser: AdviserSummary;
  dependencies: SectionDependencyDetails;
}

export interface SectionDependencyDetails {
  hasClassEnrollments: boolean;
  classEnrollmentsCount: number;
  enrolledStudents?: EnrolledStudent[];
  hasScheduleEntries: boolean;
  scheduleEntriesCount: number;
  scheduleEntries?: ScheduleEntry[];
  canDelete: boolean;
  deleteOptions: string[];
}

export interface EnrolledStudent {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

export interface ScheduleEntry {
  id: string;
  subjectName: string;
  teacherName: string;
  startTime: string;
  endTime: string;
}

// Records/Monitor Records interfaces
export enum Quarter {
  Q1 = "Q1",
  Q2 = "Q2",
  Q3 = "Q3",
  Q4 = "Q4",
}

export enum PackageStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  RETURNED = "RETURNED",
  FORWARDED_TO_ADMIN = "FORWARDED_TO_ADMIN",
  PUBLISHED = "PUBLISHED",
  SUBMITTED = "SUBMITTED",
}

export enum ApprovalAction {
  APPROVE = "APPROVE",
  RETURN = "RETURN",
}

export interface QuarterPackageResponse {
  subject: any;
  id: string;
  section: SectionResponse;
  quarter: Quarter;
  status: PackageStatus;
  submittedAt: string | null;
  adviser: AdviserResponse | null;
  teacher: AdviserResponse | null;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecordApprovalResponse {
  id: string;
  packageId: string;
  approver: AdviserResponse;
  action: ApprovalAction;
  remarks: string | null;
  createdAt: string;
}

export interface SectionResponse {
  id: string;
  name: string;
  gradeLevel: string;
  adviser: AdviserResponse;
}

export interface AdviserResponse {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

// Reports interfaces
export interface GradeSummaryResponse {
  subjectName: string;
  averageGrade: number;
  passingRate: number;
  totalStudents: number;
  lowestGrade: number;
  highestGrade: number;
}

export interface GradeTrendResponse {
  quarter: string;
  averageGrade: number;
  passingRate: number;
  totalGrades: number;
}

export interface AttendanceReportResponse {
  studentId: string;
  studentName: string;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  totalDays: number;
  attendanceRate: number;
}

export interface DailyAttendanceResponse {
  date: string;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  totalStudents: number;
}

export interface FeedbackReportResponse {
  id: string;
  studentId: string;
  studentName: string;
  sectionId: string;
  sectionName: string;
  quarter: string;
  feedback: string;
  createdAt: string;
}

export interface FeedbackResponse {
  id: string;
  studentId: string;
  studentName: string;
  sectionId: string;
  sectionName: string;
  quarter: string;
  feedback: string;
  studentResponse?: string;
  responseReviewed: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TeacherLoadReportResponse {
  teacherId: string;
  teacherName: string;
  subjectCount: number;
  subjects: string;
  sections: string;
}

export interface UsageStatsResponse {
  activeStudents: number;
  activeSections: number;
  totalGrades: number;
  period: string;
}

// Student Response interface for adviser functionality
export interface StudentResponse {
  studentId: string;
  userId: string;
  profileId: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gradeLevel?: string;
  sectionId: string;
  sectionName: string;
  schoolYear: string;
  quarter: string;
  enrolledAt: string;
  isActive: boolean;
  hasCompleteProfile: boolean;
}

// Adviser suggestion request
export interface AdviserSuggestionRequest {
  suggestion: string;
}

// Notification Template interface for SMS messaging
export interface NotificationTemplate {
  id: number;
  name: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

// Grade Response interface for student grades
export interface GradeResponse {
  id: string;
  studentId: string;
  subjectId: string;
  quarter: Quarter;
  grade: number;
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
}
