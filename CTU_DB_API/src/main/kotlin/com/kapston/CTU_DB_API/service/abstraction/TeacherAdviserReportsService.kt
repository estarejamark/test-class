package com.kapston.CTU_DB_API.service.abstraction

import com.kapston.CTU_DB_API.domain.dto.response.*
import java.time.LocalDate
import java.util.*

interface TeacherAdviserReportsService {

    // Teacher Reports
    fun getClassGradeSummary(teacherId: UUID, sectionId: UUID, subjectId: UUID, quarter: String): ClassGradeSummaryResponse
    fun getClassAttendanceSummary(teacherId: UUID, sectionId: UUID, subjectId: UUID, quarter: String): List<ClassAttendanceSummaryResponse>
    fun getIndividualStudentReport(teacherId: UUID, studentId: UUID, subjectId: UUID, quarter: String): IndividualStudentReportResponse

    // Adviser Reports
    fun getAdvisoryClassGeneralReport(adviserId: UUID, quarter: String): List<AdvisoryClassGeneralResponse>
    fun getAdvisoryAttendanceConsolidated(adviserId: UUID, quarter: String, startDate: LocalDate, endDate: LocalDate): List<AdvisoryAttendanceConsolidatedResponse>
    fun getBehaviourConductReport(adviserId: UUID, quarter: String): List<BehaviourConductReportResponse>
    fun getParentCommunicationActivity(adviserId: UUID, startDate: LocalDate, endDate: LocalDate): List<ParentCommunicationActivityResponse>

    // Helper methods
    fun getAdviserSections(adviserId: UUID, schoolYear: String? = null): List<Map<String, Any>>
    fun getTeacherSubjects(teacherId: UUID, startDate: LocalDate, endDate: LocalDate, schoolYear: String? = null): List<Map<String, Any>>
    fun getTeacherSections(teacherId: UUID, schoolYear: String? = null): List<Map<String, Any>>
    fun getAvailableYears(): List<String>
    fun getAvailableSections(): List<Map<String, Any>>
}
