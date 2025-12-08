package com.kapston.CTU_DB_API.domain.dto.response

import java.util.UUID

data class UnassignedStudentResponse(
    val studentId: UUID,
    val studentName: String,
    val email: String,
    val gradeLevel: String,
    val parentName: String?,
    val parentContact: String?
)
