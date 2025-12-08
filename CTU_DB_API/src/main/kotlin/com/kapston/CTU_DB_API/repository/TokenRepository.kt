package com.kapston.CTU_DB_API.repository

import com.kapston.CTU_DB_API.domain.entity.TokenEntity
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID
import jakarta.transaction.Transactional  

interface TokenRepository : JpaRepository<TokenEntity, Int> {

    fun existsByHashedAccessTokenAndHashedRefreshToken(
        hashedAccessToken: String, 
        hashedRefreshToken: String
    ): Boolean

    fun existsByUserId(userId: UUID): Boolean

    fun findByUserId(userId: UUID): TokenEntity?

    fun existsByHashedAccessToken(hashedAccessToken: String): Boolean

    fun existsByHashedRefreshToken(hashedRefreshToken: String): Boolean

    fun findByHashedRefreshToken(hashedRefreshToken: String): TokenEntity?

    @Transactional
    fun deleteByUserId(userId: UUID): Int
}
