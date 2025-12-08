package com.kapston.CTU_DB_API.service.abstraction

import com.kapston.CTU_DB_API.domain.dto.request.CreateSectionRequest
import com.kapston.CTU_DB_API.domain.dto.response.SectionResponse
import com.kapston.CTU_DB_API.domain.dto.response.SectionDependencyResponse
import com.kapston.CTU_DB_API.domain.entity.SectionEntity
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.UUID

interface SectionService {
    fun create(sectionRequest: CreateSectionRequest): String
    fun update(sectionEntity: SectionEntity): String
    fun delete(id: UUID, forceDelete: Boolean = false): String
    fun search(
        gradeLevel: String?,
        name: String?,
        adviserName: String?,
        page: Int,
        size: Int
    ): Page<SectionResponse>
    fun getDependencies(id: UUID): SectionDependencyResponse
    fun isTeacherAdviser(profileId: UUID): Boolean
    fun getSectionsByAdviser(adviserId: UUID): List<SectionResponse>
}
