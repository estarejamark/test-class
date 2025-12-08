package com.kapston.CTU_DB_API.repository

import com.kapston.CTU_DB_API.domain.dto.response.SubjectResponse
import com.kapston.CTU_DB_API.domain.entity.SubjectEntity
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.UUID

interface SubjectRepository: JpaRepository<SubjectEntity, UUID> {
    fun existsBySubjectCodeOrName(subjectCode: String, name: String): Boolean
    fun existsBySubjectCodeOrNameAndIdNot(subjectCode: String, name: String, id: UUID): Boolean

    @Query(
        """
        SELECT s
        FROM SubjectEntity s
        WHERE (:subjectCode IS NULL OR LOWER(s.subjectCode) LIKE LOWER(CONCAT('%', CAST(:subjectCode AS string), '%')))
        AND   (:name IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', CAST(:name AS string), '%')))
    """
    )
    fun search(
        @Param("subjectCode") subjectCode: String?,
        @Param("name") name: String?,
        page: Pageable
    ): Page<SubjectResponse>
}