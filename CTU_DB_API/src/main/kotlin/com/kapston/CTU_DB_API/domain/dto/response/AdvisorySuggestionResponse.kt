package com.kapston.CTU_DB_API.domain.dto.response

import java.time.LocalDateTime
import java.util.*

data class AdvisorySuggestionResponse(
    val id: UUID,
    val adviserId: UUID,
    val adviserName: String,
    val studentId: UUID,
    val studentName: String,
    val suggestion: String,
    val isResolved: Boolean,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
)
