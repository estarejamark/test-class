package com.kapston.CTU_DB_API.repository

import com.kapston.CTU_DB_API.domain.entity.GradeEntity
import com.kapston.CTU_DB_API.domain.entity.ProfileEntity
import com.kapston.CTU_DB_API.domain.entity.SectionEntity
import com.kapston.CTU_DB_API.domain.entity.SubjectEntity
import com.kapston.CTU_DB_API.domain.Enums.GradeType
import com.kapston.CTU_DB_API.domain.Enums.Quarter
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface GradeRepository : JpaRepository<GradeEntity, UUID> {
    fun findByStudentIdAndSubjectIdAndSectionIdAndQuarterAndGradeType(
        studentId: UUID,
        subjectId: UUID,
        sectionId: UUID,
        quarter: Quarter,
        gradeType: GradeType
    ): GradeEntity?

    fun findByStudentIdAndSectionIdAndQuarter(
        studentId: UUID,
        sectionId: UUID,
        quarter: Quarter
    ): List<GradeEntity>

    fun findBySectionIdAndSubjectIdAndQuarter(
        sectionId: UUID,
        subjectId: UUID,
        quarter: Quarter
    ): List<GradeEntity>
}
