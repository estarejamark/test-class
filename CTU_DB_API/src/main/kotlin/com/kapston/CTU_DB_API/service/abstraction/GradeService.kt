package com.kapston.CTU_DB_API.service.abstraction

import com.kapston.CTU_DB_API.domain.dto.response.GradeResponse
import java.util.*

interface GradeService {

    fun recordGrade(
        studentId: UUID,
        subjectId: UUID,
        sectionId: UUID,
        quarter: String,
        gradeType: String,
        score: Double,
        totalScore: Double? = null
    ): GradeResponse

    fun getGradesForStudent(
        studentId: UUID,
        sectionId: UUID,
        quarter: String
    ): List<GradeResponse>

    fun getGradesForSection(
        sectionId: UUID,
        subjectId: UUID,
        quarter: String
    ): List<GradeResponse>

    fun calculateFinalGrade(
        studentId: UUID,
        subjectId: UUID,
        sectionId: UUID,
        quarter: String
    ): GradeResponse

    fun updateGrade(
        gradeId: UUID,
        score: Double,
        totalScore: Double? = null
    ): GradeResponse

    fun deleteGrade(gradeId: UUID)
}
