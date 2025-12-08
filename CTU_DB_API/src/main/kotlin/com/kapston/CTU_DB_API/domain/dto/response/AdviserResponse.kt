package com.kapston.CTU_DB_API.domain.dto.response

import com.kapston.CTU_DB_API.domain.entity.ProfileEntity
import com.kapston.CTU_DB_API.service.abstraction.SectionService
import java.util.UUID

data class AdviserResponse(
    val id: UUID,
    val firstName: String,
    val lastName: String,
    val fullName: String,
    val isAdviser: Boolean
) {
    companion object {
        fun fromEntity(entity: ProfileEntity, sectionService: SectionService): AdviserResponse {
            return AdviserResponse(
                id = entity.id!!,
                firstName = entity.firstName,
                lastName = entity.lastName,
                fullName = "${entity.firstName} ${entity.lastName}",
                isAdviser = sectionService.isTeacherAdviser(entity.id!!)
            )
        }
    }
}
