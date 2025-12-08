package com.kapston.CTU_DB_API.service.abstraction

import com.kapston.CTU_DB_API.domain.dto.request.SubjectRequest
import com.kapston.CTU_DB_API.domain.dto.request.UpdateSubjectRequest
import com.kapston.CTU_DB_API.domain.dto.response.SubjectResponse
import org.springframework.data.domain.Page
import java.util.UUID

interface SubjectService {
    fun save(subjectRequest: SubjectRequest): String
    fun update(updateSubjectRequest: UpdateSubjectRequest): String
    fun search(
        subjectCode: String?,
        name: String?,
        page: Int,
        size: Int
    ): Page<SubjectResponse>
    fun delete(id: UUID): Unit
}