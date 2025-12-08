package com.kapston.CTU_DB_API.domain.dto.response

import java.time.LocalDateTime
import java.util.UUID

data class SubjectResponse(
    val subjectCode: String,
    val name: String,
    val id: UUID?,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)
