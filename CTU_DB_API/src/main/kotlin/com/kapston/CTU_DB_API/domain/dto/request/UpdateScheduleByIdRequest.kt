package com.kapston.CTU_DB_API.domain.dto.request

import com.kapston.CTU_DB_API.model.SchoolYearQuarter
import java.time.LocalDateTime
import java.util.UUID

data class UpdateScheduleByIdRequest(
    val teacherId: UUID,
    val subjectId: UUID,
    val sectionId: UUID,
    val schoolYearQuarter: SchoolYearQuarter,
    val days: String,
    val startTime: LocalDateTime,
    val endTime: LocalDateTime
)
