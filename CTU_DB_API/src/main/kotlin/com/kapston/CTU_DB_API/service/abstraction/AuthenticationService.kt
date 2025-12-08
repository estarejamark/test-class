package com.kapston.CTU_DB_API.service.abstraction

import com.kapston.CTU_DB_API.domain.entity.TokenEntity
import java.util.UUID

interface AuthenticationService {
    fun saveTokens(token: TokenEntity): Unit
    fun validateAccessToken(token: String): Boolean
    fun refresh(userId: UUID): String
    fun logout(jwt: String): Unit
    fun logoutByUserId(userId: UUID)
    fun generateAndSaveTokens(userId: UUID, role: String): TokenEntity
}