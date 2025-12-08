package com.kapston.CTU_DB_API.domain.dto.response

import com.kapston.CTU_DB_API.domain.dto.request.CreateStudentRequest

data class BulkCreateResult(
    val successful: List<StudentResponse>,
    val failed: List<BulkCreateFailure>
)

data class BulkCreateFailure(
    val request: CreateStudentRequest,
    val errorMessage: String
)
