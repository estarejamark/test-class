package com.kapston.CTU_DB_API.service.implementation

import com.kapston.CTU_DB_API.domain.dto.response.*
import com.kapston.CTU_DB_API.repository.ReportsRepository
import com.kapston.CTU_DB_API.repository.ScheduleRepository
import com.kapston.CTU_DB_API.service.abstraction.ReportsService
import com.kapston.CTU_DB_API.service.abstraction.SettingsService
import org.springframework.cache.annotation.Cacheable
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.util.*

@Service
class ReportsServiceImplementation(
    private val reportsRepository: ReportsRepository,
    private val scheduleRepository: ScheduleRepository,
    private val settingsService: SettingsService
) : ReportsService {

    @Cacheable("gradeSummary")
    override fun getGradeSummary(year: Int?, quarter: String?, sectionId: UUID?, teacherId: UUID?): List<GradeSummaryResponse> {
        // Use active school year if no year specified
        val effectiveYear = year ?: settingsService.getActiveSchoolYear()?.startDate?.year
        // For now, return summary for a specific section and quarter
        // In a full implementation, this would aggregate across multiple sections/teachers
        if (sectionId != null && quarter != null) {
            val rawData = reportsRepository.getGradeSummaryBySectionAndQuarter(sectionId, quarter)
            return rawData.map { row ->
                GradeSummaryResponse(
                    subjectName = row[0] as String,
                    averageGrade = (row[1] as Double?) ?: 0.0,
                    passingRate = if (row[3] as Long > 0) ((row[2] as Long).toDouble() / (row[3] as Long).toDouble()) * 100 else 0.0,
                    totalStudents = (row[3] as Long).toInt(),
                    lowestGrade = (row[4] as Double?) ?: 0.0,
                    highestGrade = (row[5] as Double?) ?: 0.0
                )
            }
        }
        return emptyList()
    }

    @Cacheable("gradeTrends")
    override fun getGradeTrends(year: Int?, sectionId: UUID?, teacherId: UUID?): List<GradeTrendResponse> {
        // Use active school year if no year specified
        val effectiveYear = year ?: settingsService.getActiveSchoolYear()?.startDate?.year
        if (sectionId != null) {
            val rawData = reportsRepository.getGradeTrendsBySection(sectionId)
            return rawData.map { row ->
                GradeTrendResponse(
                    quarter = row[0] as String,
                    averageGrade = (row[1] as Double?) ?: 0.0,
                    passingRate = if (row[3] as Long > 0) ((row[2] as Long).toDouble() / (row[3] as Long).toDouble()) * 100 else 0.0,
                    totalGrades = (row[3] as Long).toInt()
                )
            }
        }
        return emptyList()
    }

    @Cacheable("attendanceReport")
    override fun getAttendanceReport(year: Int?, quarter: String?, sectionId: UUID?, teacherId: UUID?): List<AttendanceReportResponse> {
        // Use active school year if no year specified
        val effectiveYear = year ?: settingsService.getActiveSchoolYear()?.startDate?.year
        if (sectionId != null && quarter != null) {
            val rawData = reportsRepository.getAttendanceBySectionAndQuarter(sectionId, quarter)
            return rawData.map { row ->
                AttendanceReportResponse(
                    studentId = row[0] as String,
                    studentName = row[1] as String,
                    presentCount = row[2] as Long,
                    absentCount = row[3] as Long,
                    lateCount = row[4] as Long,
                    totalDays = row[5] as Long,
                    attendanceRate = (row[6] as Double?) ?: 0.0
                )
            }
        }
        return emptyList()
    }

    @Cacheable("dailyAttendance")
    override fun getDailyAttendanceReport(year: Int?, quarter: String?, sectionId: UUID?): List<DailyAttendanceResponse> {
        // Use active school year if no year specified
        val effectiveYear = year ?: settingsService.getActiveSchoolYear()?.startDate?.year
        if (sectionId != null && quarter != null) {
            val rawData = reportsRepository.getDailyAttendanceBySectionAndQuarter(sectionId, quarter)
            return rawData.map { row ->
                DailyAttendanceResponse(
                    date = (row[0] as java.sql.Date).toString(),
                    presentCount = row[1] as Long,
                    absentCount = row[2] as Long,
                    lateCount = row[3] as Long,
                    totalStudents = row[4] as Long
                )
            }
        }
        return emptyList()
    }

    @Cacheable("feedbackReport")
    override fun getFeedbackReport(year: Int?, quarter: String?, sectionId: UUID?, teacherId: UUID?): List<FeedbackReportResponse> {
        val feedbackEntities = reportsRepository.getFeedbackReports(sectionId, quarter)
        return feedbackEntities.map { feedback ->
            FeedbackReportResponse(
                id = feedback.id.toString(),
                studentId = feedback.student.id.toString(),
                studentName = "${feedback.student.firstName} ${feedback.student.lastName}",
                sectionId = feedback.section.id.toString(),
                sectionName = feedback.section.name,
                quarter = feedback.quarter.toString(),
                feedback = feedback.feedback,
                createdAt = feedback.createdAt.toString()
            )
        }
    }

    @Cacheable("teacherLoad")
    override fun getTeacherLoadReport(year: Int?, teacherId: UUID?): List<TeacherLoadReportResponse> {
        // Use active school year if no year specified
        val effectiveYear = year ?: settingsService.getActiveSchoolYear()?.startDate?.year
        val effectiveQuarter = settingsService.getActiveQuarter()?.quarter?.name

        if (effectiveQuarter == null) {
            return emptyList()
        }

        val rawData = reportsRepository.getTeacherLoadSummary(teacherId, effectiveQuarter)
        return rawData.map { row ->
            TeacherLoadReportResponse(
                teacherId = row[0] as String,
                teacherName = row[1] as String,
                subjectCount = row[2] as Long,
                subjects = row[3] as String,
                sections = row[4] as String
            )
        }
    }

    @Cacheable("teacherLoadByQuarter")
    override fun getTeacherLoadReportByQuarter(year: Int?, quarter: String?, teacherId: UUID?): List<TeacherLoadReportResponse> {
        // Use active school year if no year specified
        val effectiveYear = year ?: settingsService.getActiveSchoolYear()?.startDate?.year
        val effectiveQuarter = quarter ?: settingsService.getActiveQuarter()?.quarter?.name

        if (effectiveQuarter == null) {
            return emptyList()
        }

        val rawData = reportsRepository.getTeacherLoadSummaryByQuarter(teacherId, effectiveQuarter)
        return rawData.map { row ->
            TeacherLoadReportResponse(
                teacherId = row[0] as String,
                teacherName = row[1] as String,
                subjectCount = row[2] as Long,
                subjects = row[3] as String,
                sections = row[4] as String
            )
        }
    }

    @Cacheable("usageStats")
    override fun getUsageStats(period: String): UsageStatsResponse {
        val days = when (period) {
            "last_30_days" -> 30
            "last_90_days" -> 90
            else -> 30
        }
        val startDate = LocalDate.now().minusDays(days.toLong())
        val stats = reportsRepository.getBasicUsageStats(startDate)

        return UsageStatsResponse(
            activeStudents = stats[0],
            activeSections = stats[1],
            totalGrades = stats[2],
            period = period
        )
    }

    override fun getAvailableQuarters(): List<String> {
        return reportsRepository.getAvailableQuarters()
    }

    override fun getAvailableYears(): List<Int> {
        return reportsRepository.getAvailableYears()
    }

    override fun getAllSectionsForReports(): List<SectionSummaryResponse> {
        val rawData = reportsRepository.getAllSectionsForReports()
        return rawData.map { row ->
            SectionSummaryResponse(
                sectionId = row[0] as String,
                sectionName = row[1] as String,
                gradeLevel = row[2] as String,
                adviserName = row[3] as String,
                adviserId = row[4] as String
            )
        }
    }
}
