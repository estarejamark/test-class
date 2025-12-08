package com.kapston.CTU_DB_API.domain.dto.response

import com.kapston.CTU_DB_API.domain.Enums.Quarter
import java.time.LocalDateTime
import java.util.*

data class FeedbackResponse(
    val id: UUID,
    val studentId: UUID,
    val studentName: String,
    val sectionId: UUID,
    val sectionName: String,
    val quarter: Quarter,
    val feedback: String,
    val studentResponse: String?,
    val responseReviewed: Boolean,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime?
)
