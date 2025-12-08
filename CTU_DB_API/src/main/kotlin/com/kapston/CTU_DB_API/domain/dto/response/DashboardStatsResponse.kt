package com.kapston.CTU_DB_API.domain.dto.response

data class DashboardStatsResponse(
    val totalSubjects: Int,
    val totalSections: Int,
    val totalTeachers: Int,
    val totalStudents: Int,
    val assignedLoads: Int,
    val pendingLoads: Int
)
