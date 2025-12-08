package com.kapston.CTU_DB_API.controller

import com.kapston.CTU_DB_API.domain.dto.response.*
import com.kapston.CTU_DB_API.repository.UserRepository
import com.kapston.CTU_DB_API.service.abstraction.ReportsService
import com.kapston.CTU_DB_API.utility.JwtUtils
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
class ReportsController(
    private val reportsService: ReportsService,
    private val jwtUtils: JwtUtils,
    private val userRepository: UserRepository
) {

    // Grade Reports
    @GetMapping("/grades")
    fun getGradeSummary(
        @CookieValue("jwt") jwt: String,
        @RequestParam(required = false) year: Int?,
        @RequestParam(required = false) quarter: String?,
        @RequestParam(required = false) sectionId: String?,
        @RequestParam(required = false) teacherId: String?
    ): ResponseEntity<List<GradeSummaryResponse>> {
        validateUserAccess(jwt)
        val sectionUUID = sectionId?.let { UUID.fromString(it) }
        val teacherUUID = teacherId?.let { UUID.fromString(it) }
        val summaries = reportsService.getGradeSummary(year, quarter, sectionUUID, teacherUUID)
        return ResponseEntity.ok(summaries)
    }

    @GetMapping("/grades/trends")
    fun getGradeTrends(
        @CookieValue("jwt") jwt: String,
        @RequestParam(required = false) year: Int?,
        @RequestParam(required = false) sectionId: String?,
        @RequestParam(required = false) teacherId: String?
    ): ResponseEntity<List<GradeTrendResponse>> {
        validateUserAccess(jwt)
        val sectionUUID = sectionId?.let { UUID.fromString(it) }
        val teacherUUID = teacherId?.let { UUID.fromString(it) }
        val trends = reportsService.getGradeTrends(year, sectionUUID, teacherUUID)
        return ResponseEntity.ok(trends)
    }

    // Attendance Reports
    @GetMapping("/attendance")
    fun getAttendanceReport(
        @CookieValue("jwt") jwt: String,
        @RequestParam(required = false) year: Int?,
        @RequestParam(required = false) quarter: String?,
        @RequestParam(required = false) sectionId: String?,
        @RequestParam(required = false) teacherId: String?
    ): ResponseEntity<List<AttendanceReportResponse>> {
        validateUserAccess(jwt)
        val sectionUUID = sectionId?.let { UUID.fromString(it) }
        val teacherUUID = teacherId?.let { UUID.fromString(it) }
        val report = reportsService.getAttendanceReport(year, quarter, sectionUUID, teacherUUID)
        return ResponseEntity.ok(report)
    }

    @GetMapping("/attendance/daily")
    fun getDailyAttendanceReport(
        @CookieValue("jwt") jwt: String,
        @RequestParam(required = false) year: Int?,
        @RequestParam(required = false) quarter: String?,
        @RequestParam(required = false) sectionId: String?
    ): ResponseEntity<List<DailyAttendanceResponse>> {
        validateUserAccess(jwt)
        val sectionUUID = sectionId?.let { UUID.fromString(it) }
        val report = reportsService.getDailyAttendanceReport(year, quarter, sectionUUID)
        return ResponseEntity.ok(report)
    }

    // Feedback Reports
    @GetMapping("/feedback")
    fun getFeedbackReport(
        @CookieValue("jwt") jwt: String,
        @RequestParam(required = false) year: Int?,
        @RequestParam(required = false) quarter: String?,
        @RequestParam(required = false) sectionId: String?,
        @RequestParam(required = false) teacherId: String?
    ): ResponseEntity<List<FeedbackReportResponse>> {
        validateUserAccess(jwt)
        val sectionUUID = sectionId?.let { UUID.fromString(it) }
        val teacherUUID = teacherId?.let { UUID.fromString(it) }
        val report = reportsService.getFeedbackReport(year, quarter, sectionUUID, teacherUUID)
        return ResponseEntity.ok(report)
    }

    // Teacher Load Reports
    @GetMapping("/teacher-load")
    fun getTeacherLoadReport(
        @CookieValue("jwt") jwt: String,
        @RequestParam(required = false) year: Int?,
        @RequestParam(required = false) teacherId: String?
    ): ResponseEntity<List<TeacherLoadReportResponse>> {
        validateUserAccess(jwt)
        val teacherUUID = teacherId?.let { UUID.fromString(it) }
        val report = reportsService.getTeacherLoadReport(year, teacherUUID)
        return ResponseEntity.ok(report)
    }

    @GetMapping("/teacher-load/quarter")
    fun getTeacherLoadReportByQuarter(
        @CookieValue("jwt") jwt: String,
        @RequestParam(required = false) year: Int?,
        @RequestParam(required = false) quarter: String?,
        @RequestParam(required = false) teacherId: String?
    ): ResponseEntity<List<TeacherLoadReportResponse>> {
        validateUserAccess(jwt)
        val teacherUUID = teacherId?.let { UUID.fromString(it) }
        val report = reportsService.getTeacherLoadReportByQuarter(year, quarter, teacherUUID)
        return ResponseEntity.ok(report)
    }

    // Usage Statistics
    @GetMapping("/system-usage")
    fun getUsageStats(
        @CookieValue("jwt") jwt: String,
        @RequestParam(defaultValue = "last_30_days") period: String
    ): ResponseEntity<UsageStatsResponse> {
        validateUserAccess(jwt)
        val stats = reportsService.getUsageStats(period)
        return ResponseEntity.ok(stats)
    }

    // Helper endpoints
    @GetMapping("/quarters")
    fun getAvailableQuarters(@CookieValue("jwt") jwt: String): ResponseEntity<List<String>> {
        validateUserAccess(jwt)
        val quarters = reportsService.getAvailableQuarters()
        return ResponseEntity.ok(quarters)
    }

    @GetMapping("/years")
    fun getAvailableYears(@CookieValue("jwt") jwt: String): ResponseEntity<List<Int>> {
        validateUserAccess(jwt)
        val years = reportsService.getAvailableYears()
        return ResponseEntity.ok(years)
    }

    @GetMapping("/sections")
    fun getAllSectionsForReports(@CookieValue("jwt") jwt: String): ResponseEntity<List<SectionSummaryResponse>> {
        validateUserAccess(jwt)
        val sections = reportsService.getAllSectionsForReports()
        return ResponseEntity.ok(sections)
    }

    private fun validateUserAccess(jwt: String) {
        // Access control is now handled by @PreAuthorize at class level
        // This method can be removed or kept for additional validation if needed
    }
}
