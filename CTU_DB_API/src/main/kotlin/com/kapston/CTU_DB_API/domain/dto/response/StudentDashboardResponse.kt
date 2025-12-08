package com.kapston.CTU_DB_API.domain.dto.response

data class StudentDashboardResponse(
    val attendanceSummary: AttendanceSummary,
    val pendingFeedbackReplies: Int,
    val correctionRequestsStatus: CorrectionRequestsStatus,
    val profile: StudentProfileInfo
)

data class AttendanceSummary(
    val currentQuarter: String,
    val presentDays: Int,
    val totalDays: Int,
    val attendanceRate: Double
)

data class CorrectionRequestsStatus(
    val pending: Int,
    val approved: Int,
    val rejected: Int
)

data class StudentProfileInfo(
    val firstName: String,
    val lastName: String,
    val gradeLevel: String,
    val sectionName: String,
    val adviserName: String,
    val profileImage: String?
)
