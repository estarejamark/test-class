package com.kapston.CTU_DB_API.domain.dto.response

import com.kapston.CTU_DB_API.domain.entity.SectionEntity
import java.time.LocalDateTime
import java.util.UUID

data class SectionResponse(
    val id: UUID,
    val name: String,
    val gradeLevel: String,
    val adviserId: UUID?,
    val adviserName: String?,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
) {
    companion object {
        fun fromEntity(entity: SectionEntity): SectionResponse {
            return SectionResponse(
                id = entity.id!!,
                name = entity.name,
                gradeLevel = entity.gradeLevel,
                adviserId = entity.adviserId,
                adviserName = entity.adviserName,
                createdAt = entity.createdAt!!,
                updatedAt = entity.updatedAt!!
            )
        }
    }
}
