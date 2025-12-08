package com.kapston.CTU_DB_API.domain.dto.response

import com.kapston.CTU_DB_API.domain.Enums.GradeType
import com.kapston.CTU_DB_API.domain.Enums.Quarter
import java.time.LocalDateTime
import java.util.*

data class GradeResponse(
    val id: UUID,
    val studentId: UUID,
    val studentName: String,
    val subjectId: UUID,
    val subjectName: String,
    val sectionId: UUID,
    val sectionName: String,
    val quarter: Quarter,
    val gradeType: GradeType,
    val score: Double,
    val totalScore: Double,
    val percentage: Double,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime?
)
