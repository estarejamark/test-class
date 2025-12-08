package com.kapston.CTU_DB_API.domain.dto.response

data class TeacherLoadReportResponse(
    val teacherId: String,
    val teacherName: String,
    val subjectCount: Long,
    val subjects: String,
    val sections: String
)
