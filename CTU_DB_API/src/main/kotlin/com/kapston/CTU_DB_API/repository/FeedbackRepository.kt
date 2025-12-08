package com.kapston.CTU_DB_API.repository

import com.kapston.CTU_DB_API.domain.entity.FeedbackEntity
import com.kapston.CTU_DB_API.domain.entity.ProfileEntity
import com.kapston.CTU_DB_API.domain.entity.SectionEntity
import com.kapston.CTU_DB_API.domain.Enums.Quarter
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface FeedbackRepository : JpaRepository<FeedbackEntity, UUID> {
    @Query("SELECT f FROM FeedbackEntity f WHERE f.student.id = :studentId AND f.section.id = :sectionId AND f.quarter = :quarter")
    fun findByStudentAndSectionAndQuarter(
        @Param("studentId") studentId: UUID,
        @Param("sectionId") sectionId: UUID,
        @Param("quarter") quarter: Quarter
    ): FeedbackEntity?

    @Query("SELECT f FROM FeedbackEntity f WHERE f.section.id = :sectionId AND f.quarter = :quarter")
    fun findBySectionAndQuarter(
        @Param("sectionId") sectionId: UUID,
        @Param("quarter") quarter: Quarter
    ): List<FeedbackEntity>
}
