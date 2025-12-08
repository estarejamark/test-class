package com.kapston.CTU_DB_API.domain.dto.response

data class TeacherLoadStatusResponse(
    val month: String,
    val assigned: Int,
    val pending: Int
)
