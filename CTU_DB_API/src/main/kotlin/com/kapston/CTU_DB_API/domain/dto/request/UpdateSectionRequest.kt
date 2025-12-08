package com.kapston.CTU_DB_API.domain.dto.request

import com.kapston.CTU_DB_API.domain.entity.ProfileEntity
import com.kapston.CTU_DB_API.domain.entity.SectionEntity
import java.util.*

data class UpdateSectionRequest(
    val name: String,
    val gradeLevel: String,
    val adviser: String? = null
) {
    fun toEntity(adviserEntity: ProfileEntity?, id: UUID): SectionEntity {
        val adviserId = adviserEntity?.id
        val adviserName = adviserEntity?.let { "${it.firstName} ${it.middleName ?: ""} ${it.lastName}".trim() }
        return SectionEntity(
            id = id,
            name = this.name,
            gradeLevel = this.gradeLevel,
            adviserId = adviserId,
            adviserName = adviserName
        )
    }
}
