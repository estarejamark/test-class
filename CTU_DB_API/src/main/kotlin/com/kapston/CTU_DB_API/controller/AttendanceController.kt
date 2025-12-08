package com.kapston.CTU_DB_API.controller

import com.kapston.CTU_DB_API.domain.dto.request.BulkAttendanceRequest
import com.kapston.CTU_DB_API.domain.dto.response.AttendanceResponse
import com.kapston.CTU_DB_API.service.abstraction.AttendanceService
import com.kapston.CTU_DB_API.utility.JwtUtils
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.time.LocalDate
import java.time.Month
import java.util.*

@RestController
@RequestMapping("/api/attendance")
@PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
class AttendanceController(
    private val attendanceService: AttendanceService,
    private val jwtUtils: JwtUtils
) {

    @PostMapping
    fun recordAttendance(
        @RequestParam studentId: String,
        @RequestParam sectionId: String,
        @RequestParam quarter: String,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) attendanceDate: LocalDate,
        @RequestParam status: String,
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<AttendanceResponse> {
        // TODO: Verify teacher has access to this section
        // val teacherId = jwtUtils.getUserIdFromToken(jwt)

        val response = attendanceService.recordAttendance(
            UUID.fromString(studentId),
            UUID.fromString(sectionId),
            quarter,
            attendanceDate,
            status
        )
        return ResponseEntity.ok(response)
    }

    @PostMapping("/bulk")
    fun recordBulkAttendance(
        @RequestBody request: BulkAttendanceRequest,
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<List<AttendanceResponse>> {
        // TODO: Verify teacher has access to this section
        // val teacherId = jwtUtils.getUserIdFromToken(jwt)

        val response = attendanceService.recordBulkAttendance(request)
        return ResponseEntity.ok(response)
    }

    @GetMapping("/section/{sectionId}")
    fun getAttendanceForSection(
        @PathVariable sectionId: String,
        @RequestParam quarter: String,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate?,
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<List<AttendanceResponse>> {
        // TODO: Verify teacher has access to this section
        // val teacherId = jwtUtils.getUserIdFromToken(jwt)

        val attendance = attendanceService.getAttendanceForSection(
            UUID.fromString(sectionId),
            quarter,
            startDate,
            endDate
        )
        return ResponseEntity.ok(attendance)
    }

    @GetMapping("/section/{sectionId}/date")
    fun getSectionAttendanceByDate(
        @PathVariable sectionId: String,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) attendanceDate: LocalDate,
        @RequestParam(required = false) quarter: String?,
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<List<AttendanceResponse>> {
        // TODO: Verify teacher has access to this section
        // val teacherId = jwtUtils.getUserIdFromToken(jwt)

        // If no quarter provided, determine it from the date
        val quarterToUse = quarter ?: when (attendanceDate.month) {
            Month.JANUARY, Month.FEBRUARY, Month.MARCH -> "Q1"
            Month.APRIL, Month.MAY, Month.JUNE -> "Q2"
            Month.JULY, Month.AUGUST, Month.SEPTEMBER -> "Q3"
            Month.OCTOBER, Month.NOVEMBER, Month.DECEMBER -> "Q4"
        }

        val attendance = attendanceService.getSectionAttendanceByDate(
            UUID.fromString(sectionId),
            attendanceDate,
            quarterToUse
        )
        return ResponseEntity.ok(attendance)
    }

    @GetMapping("/student/{studentId}/section/{sectionId}")
    fun getStudentAttendance(
        @PathVariable studentId: String,
        @PathVariable sectionId: String,
        @RequestParam quarter: String,
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<List<AttendanceResponse>> {
        // TODO: Verify teacher has access to this section
        // val teacherId = jwtUtils.getUserIdFromToken(jwt)

        val attendance = attendanceService.getStudentAttendance(
            UUID.fromString(studentId),
            UUID.fromString(sectionId),
            quarter
        )
        return ResponseEntity.ok(attendance)
    }

    @PutMapping("/{attendanceId}")
    fun updateAttendance(
        @PathVariable attendanceId: String,
        @RequestParam status: String,
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<AttendanceResponse> {
        // TODO: Verify teacher has access to this attendance record
        // val teacherId = jwtUtils.getUserIdFromToken(jwt)

        val response = attendanceService.updateAttendance(
            UUID.fromString(attendanceId),
            status
        )
        return ResponseEntity.ok(response)
    }

    @DeleteMapping("/{attendanceId}")
    fun deleteAttendance(
        @PathVariable attendanceId: String,
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<Void> {
        // Verify teacher has access to this attendance record
        val teacherId = jwtUtils.getUserIdFromToken(jwt)

        attendanceService.deleteAttendance(UUID.fromString(attendanceId))
        return ResponseEntity.noContent().build()
    }
}
