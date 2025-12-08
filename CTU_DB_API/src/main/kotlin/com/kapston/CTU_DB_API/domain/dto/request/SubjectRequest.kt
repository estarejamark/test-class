package com.kapston.CTU_DB_API.domain.dto.request

import com.kapston.CTU_DB_API.domain.entity.SubjectEntity
import java.time.LocalDateTime

data class SubjectRequest(
    val subjectCode: String,
    val name: String
)

{
    fun toEntity(): SubjectEntity = SubjectEntity(
        subjectCode,
        name,
    )
}