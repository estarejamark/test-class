package com.kapston.CTU_DB_API.domain.dto.response

data class GradeSummaryResponse(
    val subjectName: String,
    val averageGrade: Double,
    val passingRate: Double, // percentage
    val totalStudents: Int,
    val lowestGrade: Double,
    val highestGrade: Double
)

data class GradeTrendResponse(
    val quarter: String,
    val averageGrade: Double,
    val passingRate: Double,
    val totalGrades: Int
)
