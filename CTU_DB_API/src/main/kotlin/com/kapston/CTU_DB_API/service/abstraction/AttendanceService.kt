package com.kapston.CTU_DB_API.service.abstraction

import com.kapston.CTU_DB_API.domain.dto.request.BulkAttendanceRequest
import com.kapston.CTU_DB_API.domain.dto.response.AttendanceResponse
import java.time.LocalDate
import java.util.*

interface AttendanceService {

    fun recordAttendance(
        studentId: UUID,
        sectionId: UUID,
        quarter: String,
        attendanceDate: LocalDate,
        status: String
    ): AttendanceResponse

    fun recordBulkAttendance(request: BulkAttendanceRequest): List<AttendanceResponse>

    fun getAttendanceForSection(
        sectionId: UUID,
        quarter: String,
        startDate: LocalDate? = null,
        endDate: LocalDate? = null
    ): List<AttendanceResponse>

    fun getSectionAttendanceByDate(
        sectionId: UUID,
        attendanceDate: LocalDate,
        quarter: String
    ): List<AttendanceResponse>

    fun getStudentAttendance(
        studentId: UUID,
        sectionId: UUID,
        quarter: String
    ): List<AttendanceResponse>

    fun updateAttendance(
        attendanceId: UUID,
        status: String
    ): AttendanceResponse

    fun deleteAttendance(attendanceId: UUID)
}
