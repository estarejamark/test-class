package com.kapston.CTU_DB_API.domain.dto.response

import com.kapston.CTU_DB_API.domain.Enums.AttendanceStatus
import com.kapston.CTU_DB_API.domain.Enums.Quarter
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.*

data class AttendanceResponse(
    val id: UUID,
    val studentId: UUID,
    val studentName: String,
    val sectionId: UUID,
    val sectionName: String,
    val quarter: Quarter,
    val attendanceDate: LocalDate,
    val status: AttendanceStatus,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime?
)
