package com.kapston.CTU_DB_API.CustomException

sealed class ApiException(
    override val message: String,
    val code: String,
    val status: Int
) : RuntimeException(message)

class ResourceNotFoundException(message: String) :
    ApiException(message, "RESOURCE_NOT_FOUND", 404)

class ValidationException(message: String) :
    ApiException(message, "VALIDATION_ERROR", 400)



class ForbiddenException(message: String) :
    ApiException(message, "FORBIDDEN", 403)

data class ApiError(
    val code: String,
    val message: String,
    val status: Int,
    val timestamp: Long = System.currentTimeMillis()
)
