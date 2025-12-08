package com.kapston.CTU_DB_API.domain.dto.request

import com.kapston.CTU_DB_API.domain.entity.SubjectEntity
import java.time.LocalDateTime
import java.util.UUID

data class UpdateSubjectRequest(
    val subjectCode: String,
    val name: String,
    val id: UUID,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime = LocalDateTime.now()
)

{
    fun toEntity(): SubjectEntity = SubjectEntity(
        subjectCode,
        name,
        id,
        createdAt,
    )
}