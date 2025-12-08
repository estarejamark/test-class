package com.kapston.CTU_DB_API.controller

import com.kapston.CTU_DB_API.domain.dto.response.*
import com.kapston.CTU_DB_API.repository.UserRepository
import com.kapston.CTU_DB_API.service.abstraction.TeacherAdviserReportsService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import java.time.LocalDate
import java.util.*

@RestController
@RequestMapping("/api/teacher-adviser-reports")
@Tag(name = "Teacher & Adviser Reports", description = "Endpoints for teacher and adviser specific reports")
class TeacherAdviserReportsController(
    private val teacherAdviserReportsService: TeacherAdviserReportsService,
    private val userRepository: UserRepository
) {

    // Teacher Reports
    @GetMapping("/teacher/class-grade-summary")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Get class grade summary for a specific subject")
    fun getClassGradeSummary(
        @RequestParam sectionId: UUID,
        @RequestParam subjectId: UUID,
        @RequestParam quarter: String,
        authentication: Authentication
    ): ResponseEntity<ReportResponse<ClassGradeSummaryResponse>> {
        val teacherId = getUserId(authentication)
        val data = teacherAdviserReportsService.getClassGradeSummary(teacherId, sectionId, subjectId, quarter)

        val response = ReportResponse(
            data = data,
            generatedAt = LocalDate.now(),
            generatedBy = authentication.name,
            filters = mapOf(
                "sectionId" to sectionId,
                "subjectId" to subjectId,
                "quarter" to quarter
            )
        )

        return ResponseEntity.ok(response)
    }

    @GetMapping("/teacher/class-attendance-summary")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Get class attendance summary for a specific subject")
    fun getClassAttendanceSummary(
        @RequestParam sectionId: UUID,
        @RequestParam subjectId: UUID,
        @RequestParam quarter: String,
        authentication: Authentication
    ): ResponseEntity<ReportResponse<List<ClassAttendanceSummaryResponse>>> {
        val teacherId = getUserId(authentication)
        val data = teacherAdviserReportsService.getClassAttendanceSummary(teacherId, sectionId, subjectId, quarter)

        val response = ReportResponse(
            data = data,
            generatedAt = LocalDate.now(),
            generatedBy = authentication.name,
            filters = mapOf(
                "sectionId" to sectionId,
                "subjectId" to subjectId,
                "quarter" to quarter
            )
        )

        return ResponseEntity.ok(response)
    }

    @GetMapping("/teacher/student-report/{studentId}")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Get individual student performance report")
    fun getIndividualStudentReport(
        @PathVariable studentId: UUID,
        @RequestParam subjectId: UUID,
        @RequestParam quarter: String,
        authentication: Authentication
    ): ResponseEntity<ReportResponse<IndividualStudentReportResponse>> {
        val teacherId = getUserId(authentication)
        val data = teacherAdviserReportsService.getIndividualStudentReport(teacherId, studentId, subjectId, quarter)

        val response = ReportResponse(
            data = data,
            generatedAt = LocalDate.now(),
            generatedBy = authentication.name,
            filters = mapOf(
                "studentId" to studentId,
                "subjectId" to subjectId,
                "quarter" to quarter
            )
        )

        return ResponseEntity.ok(response)
    }

    // Adviser Reports
    @GetMapping("/adviser/class-general")
    @PreAuthorize("hasRole('ADVISER')")
    @Operation(summary = "Get advisory class general report")
    fun getAdvisoryClassGeneralReport(
        @RequestParam quarter: String,
        authentication: Authentication
    ): ResponseEntity<ReportResponse<List<AdvisoryClassGeneralResponse>>> {
        val adviserId = getUserId(authentication)
        val data = teacherAdviserReportsService.getAdvisoryClassGeneralReport(adviserId, quarter)

        val response = ReportResponse(
            data = data,
            generatedAt = LocalDate.now(),
            generatedBy = authentication.name,
            filters = mapOf("quarter" to quarter)
        )

        return ResponseEntity.ok(response)
    }

    @GetMapping("/adviser/attendance-consolidated")
    @PreAuthorize("hasRole('ADVISER')")
    @Operation(summary = "Get advisory attendance consolidated report")
    fun getAdvisoryAttendanceConsolidated(
        @RequestParam quarter: String,
        @RequestParam startDate: LocalDate,
        @RequestParam endDate: LocalDate,
        authentication: Authentication
    ): ResponseEntity<ReportResponse<List<AdvisoryAttendanceConsolidatedResponse>>> {
        val adviserId = getUserId(authentication)
        val data = teacherAdviserReportsService.getAdvisoryAttendanceConsolidated(adviserId, quarter, startDate, endDate)

        val response = ReportResponse(
            data = data,
            generatedAt = LocalDate.now(),
            generatedBy = authentication.name,
            filters = mapOf(
                "quarter" to quarter,
                "startDate" to startDate,
                "endDate" to endDate
            )
        )

        return ResponseEntity.ok(response)
    }

    @GetMapping("/adviser/behaviour-conduct")
    @PreAuthorize("hasRole('ADVISER')")
    @Operation(summary = "Get behaviour and conduct report")
    fun getBehaviourConductReport(
        @RequestParam quarter: String,
        authentication: Authentication
    ): ResponseEntity<ReportResponse<List<BehaviourConductReportResponse>>> {
        val adviserId = getUserId(authentication)
        val data = teacherAdviserReportsService.getBehaviourConductReport(adviserId, quarter)

        val response = ReportResponse(
            data = data,
            generatedAt = LocalDate.now(),
            generatedBy = authentication.name,
            filters = mapOf("quarter" to quarter)
        )

        return ResponseEntity.ok(response)
    }

    @GetMapping("/adviser/parent-communication")
    @PreAuthorize("hasRole('ADVISER')")
    @Operation(summary = "Get parent communication activity report")
    fun getParentCommunicationActivity(
        @RequestParam startDate: LocalDate,
        @RequestParam endDate: LocalDate,
        authentication: Authentication
    ): ResponseEntity<ReportResponse<List<ParentCommunicationActivityResponse>>> {
        val adviserId = getUserId(authentication)
        val data = teacherAdviserReportsService.getParentCommunicationActivity(adviserId, startDate, endDate)

        val response = ReportResponse(
            data = data,
            generatedAt = LocalDate.now(),
            generatedBy = authentication.name,
            filters = mapOf(
                "startDate" to startDate,
                "endDate" to endDate
            )
        )

        return ResponseEntity.ok(response)
    }

    // Helper endpoints
    @GetMapping("/teacher/subjects")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Get teacher's subjects for current quarter")
    fun getTeacherSubjects(
        @RequestParam startDate: LocalDate,
        @RequestParam endDate: LocalDate,
        @RequestParam schoolYear: String?,
        authentication: Authentication
    ): ResponseEntity<List<Map<String, Any>>> {
        val teacherId = getUserId(authentication)
        val subjects = teacherAdviserReportsService.getTeacherSubjects(teacherId, startDate, endDate, schoolYear)
        return ResponseEntity.ok(subjects)
    }

    @GetMapping("/teacher/sections")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Get teacher's sections")
    fun getTeacherSections(
        @RequestParam schoolYear: String?,
        authentication: Authentication
    ): ResponseEntity<List<Map<String, Any>>> {
        val teacherId = getUserId(authentication)
        val sections = teacherAdviserReportsService.getTeacherSections(teacherId, schoolYear)
        return ResponseEntity.ok(sections)
    }

    @GetMapping("/adviser/sections")
    @PreAuthorize("hasRole('ADVISER')")
    @Operation(summary = "Get adviser's sections")
    fun getAdviserSections(
        @RequestParam schoolYear: String?,
        authentication: Authentication
    ): ResponseEntity<List<Map<String, Any>>> {
        val adviserId = getUserId(authentication)
        val sections = teacherAdviserReportsService.getAdviserSections(adviserId, schoolYear)
        return ResponseEntity.ok(sections)
    }

    @GetMapping("/available-years")
    @Operation(summary = "Get available school years for reports")
    fun getAvailableYears(): ResponseEntity<List<String>> {
        val years = teacherAdviserReportsService.getAvailableYears()
        return ResponseEntity.ok(years)
    }

    @GetMapping("/available-sections")
    @Operation(summary = "Get all available sections for reports")
    fun getAvailableSections(): ResponseEntity<List<Map<String, Any>>> {
        val sections = teacherAdviserReportsService.getAvailableSections()
        return ResponseEntity.ok(sections)
    }

    private fun getUserId(authentication: Authentication): UUID {
        val email = authentication.name
        val user = userRepository.findByEmail(email)
            ?: throw IllegalArgumentException("User not found: $email")
        return user.id!!
    }
}
