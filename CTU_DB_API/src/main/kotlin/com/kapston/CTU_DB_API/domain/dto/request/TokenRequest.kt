package com.kapston.CTU_DB_API.domain.dto.request

import com.kapston.CTU_DB_API.domain.entity.TokenEntity
import java.util.UUID

data class TokenRequest(
    val id: UUID,
    val hashedAccessToken: String,
    val hashedRefreshToken: String,
    val role: String
) {
    fun toEntity(): TokenEntity = TokenEntity(
        userId = id,
        role = role,
        hashedAccessToken = hashedAccessToken,
        hashedRefreshToken = hashedRefreshToken
    )
}
