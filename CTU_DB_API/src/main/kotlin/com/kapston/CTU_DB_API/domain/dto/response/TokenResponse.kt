package com.kapston.CTU_DB_API.domain.dto.response

data class TokenResponse(
    val accessToken: String,
    val refreshToken: String,
    val role: String
)
