package com.kapston.CTU_DB_API.domain.dto.response

import java.util.UUID

data class ScheduleConflictResponse(
    val conflictingScheduleId: UUID,
    val teacherName: String,
    val subjectName: String,
    val sectionName: String,
    val days: String,
    val startTime: String,
    val endTime: String,
    val conflictReason: String
)
