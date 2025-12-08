package com.kapston.CTU_DB_API.service.abstraction

import com.kapston.CTU_DB_API.domain.dto.response.*
import java.util.*

interface ReportsService {

    // Grade Reports
    fun getGradeSummary(year: Int?, quarter: String?, sectionId: UUID?, teacherId: UUID?): List<GradeSummaryResponse>
    fun getGradeTrends(year: Int?, sectionId: UUID?, teacherId: UUID?): List<GradeTrendResponse>

    // Attendance Reports
    fun getAttendanceReport(year: Int?, quarter: String?, sectionId: UUID?, teacherId: UUID?): List<AttendanceReportResponse>
    fun getDailyAttendanceReport(year: Int?, quarter: String?, sectionId: UUID?): List<DailyAttendanceResponse>

    // Feedback Reports
    fun getFeedbackReport(year: Int?, quarter: String?, sectionId: UUID?, teacherId: UUID?): List<FeedbackReportResponse>

    // Teacher Load Reports
    fun getTeacherLoadReport(year: Int?, teacherId: UUID?): List<TeacherLoadReportResponse>
    fun getTeacherLoadReportByQuarter(year: Int?, quarter: String?, teacherId: UUID?): List<TeacherLoadReportResponse>

    // Usage Statistics
    fun getUsageStats(period: String): UsageStatsResponse

    // Helper methods
    fun getAvailableQuarters(): List<String>
    fun getAvailableYears(): List<Int>
    fun getAllSectionsForReports(): List<SectionSummaryResponse>
}
