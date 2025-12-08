package com.kapston.CTU_DB_API.domain.dto.response

import java.time.LocalDate

// Teacher Reports
data class ClassGradeSummaryResponse(
    val subjectName: String,
    val averageGrade: Double,
    val passingCount: Int,
    val totalCount: Int,
    val lowestGrade: Double,
    val highestGrade: Double,
    val passingRate: Double
)

data class ClassAttendanceSummaryResponse(
    val studentId: String,
    val studentName: String,
    val presentCount: Int,
    val absentCount: Int,
    val lateCount: Int,
    val totalDays: Int,
    val attendanceRate: Double
)

data class IndividualStudentReportResponse(
    val studentId: String,
    val studentName: String,
    val grades: List<SubjectGrade>,
    val attendance: StudentAttendanceSummary,
    val overallAverage: Double,
    val conductRating: String?
)

data class SubjectGrade(
    val subjectName: String,
    val grade: Double,
    val quarter: String
)

data class StudentAttendanceSummary(
    val presentCount: Int,
    val absentCount: Int,
    val lateCount: Int,
    val totalDays: Int,
    val attendanceRate: Double
)

// Adviser Reports
data class AdvisoryClassGeneralResponse(
    val sectionName: String,
    val gradeLevel: Int,
    val totalStudents: Int,
    val activeStudents: Int,
    val averageAttendance: Double,
    val averageGrade: Double,
    val conductIssues: Int,
    val parentCommunications: Int
)

data class AdvisoryAttendanceConsolidatedResponse(
    val sectionName: String,
    val month: String,
    val totalDays: Int,
    val presentCount: Int,
    val absentCount: Int,
    val lateCount: Int,
    val attendanceRate: Double,
    val topPerformers: List<String>,
    val needsAttention: List<String>
)

data class BehaviourConductReportResponse(
    val studentId: String,
    val studentName: String,
    val conductRating: String,
    val incidents: List<ConductIncident>,
    val positiveNotes: List<String>,
    val recommendations: String?
)

data class ConductIncident(
    val date: LocalDate,
    val type: String,
    val description: String,
    val severity: String
)

data class ParentCommunicationActivityResponse(
    val studentId: String,
    val studentName: String,
    val communications: List<ParentCommunication>,
    val totalCommunications: Int,
    val lastCommunication: LocalDate?,
    val communicationTypes: Map<String, Int>
)

data class ParentCommunication(
    val date: LocalDate,
    val type: String,
    val subject: String,
    val status: String,
    val notes: String?
)

// Common response wrapper
data class ReportResponse<T>(
    val data: T,
    val generatedAt: LocalDate,
    val generatedBy: String,
    val filters: Map<String, Any>
)
