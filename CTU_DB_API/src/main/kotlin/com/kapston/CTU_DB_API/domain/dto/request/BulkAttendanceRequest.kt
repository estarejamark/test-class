package com.kapston.CTU_DB_API.domain.dto.request

import com.kapston.CTU_DB_API.domain.Enums.AttendanceStatus
import com.kapston.CTU_DB_API.domain.Enums.Quarter
import java.time.LocalDate
import java.util.*

data class BulkAttendanceRequest(
    val sectionId: UUID,
    val quarter: Quarter,
    val attendanceDate: LocalDate,
    val attendanceRecords: List<AttendanceRecordRequest>
)

data class AttendanceRecordRequest(
    val studentId: UUID,
    val status: AttendanceStatus
)
