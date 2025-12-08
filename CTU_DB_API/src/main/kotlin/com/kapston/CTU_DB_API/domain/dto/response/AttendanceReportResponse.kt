package com.kapston.CTU_DB_API.domain.dto.response

data class AttendanceReportResponse(
    val studentId: String,
    val studentName: String,
    val presentCount: Long,
    val absentCount: Long,
    val lateCount: Long,
    val totalDays: Long,
    val attendanceRate: Double
)

data class DailyAttendanceResponse(
    val date: String,
    val presentCount: Long,
    val absentCount: Long,
    val lateCount: Long,
    val totalStudents: Long
)
