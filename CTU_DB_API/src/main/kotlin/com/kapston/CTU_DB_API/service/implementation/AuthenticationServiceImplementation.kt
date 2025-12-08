package com.kapston.CTU_DB_API.service.implementation

import com.kapston.CTU_DB_API.CustomException.UnauthorizedException
import com.kapston.CTU_DB_API.domain.entity.TokenEntity
import com.kapston.CTU_DB_API.repository.TokenRepository
import com.kapston.CTU_DB_API.service.abstraction.AuthenticationService
import com.kapston.CTU_DB_API.utility.JwtUtils
import jakarta.transaction.Transactional
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.time.LocalDateTime
import java.util.UUID

@Service
class AuthenticationServiceImplementation(
    private val jwtUtils: JwtUtils,
    private val tokenRepository: TokenRepository
) : AuthenticationService {

    private val logger = LoggerFactory.getLogger(AuthenticationServiceImplementation::class.java)

    // ✅ Generate new tokens and save them
    @Transactional
    override fun generateAndSaveTokens(userId: UUID, role: String): TokenEntity {
        // Delete old tokens first
        tokenRepository.deleteByUserId(userId)

        val accessToken = jwtUtils.generateAccessToken(userId.toString(), role)
        val refreshToken = jwtUtils.generateRefreshToken(userId.toString(), role)

        val tokenEntity = TokenEntity(
            userId = userId,
            hashedAccessToken = accessToken,
            hashedRefreshToken = refreshToken,
            role = role,
            createdAt = LocalDateTime.now()
        )

        tokenRepository.save(tokenEntity)
        logger.info("Tokens generated and saved for user: $userId")
        return tokenEntity
    }

    // ✅ Save or update tokens (if you want a separate method)
    override fun saveTokens(token: TokenEntity) {
        val existing = tokenRepository.findByUserId(token.userId)
        if (existing != null) {
            val updated = existing.copy(
                hashedAccessToken = token.hashedAccessToken,
                hashedRefreshToken = token.hashedRefreshToken,
                role = token.role,
                createdAt = token.createdAt ?: LocalDateTime.now()
            )
            tokenRepository.save(updated)
        } else {
            tokenRepository.save(token)
        }
    }

    // ✅ Validate access token
    override fun validateAccessToken(token: String): Boolean = jwtUtils.validateAccessToken(token)

    // ✅ Refresh access token
    @Transactional
    override fun refresh(userId: UUID): String {
        val tokenData = tokenRepository.findByUserId(userId)
            ?: throw UnauthorizedException("No token found for user.")

        if (!jwtUtils.validateRefreshToken(tokenData.hashedRefreshToken)) {
            tokenRepository.deleteByUserId(userId)
            throw UnauthorizedException("Refresh token expired. Please log in again.")
        }

        val newAccessToken = jwtUtils.generateAccessToken(userId.toString(), tokenData.role)
        val newRefreshToken = jwtUtils.generateRefreshToken(userId.toString(), tokenData.role)

        val updatedToken = tokenData.copy(
            hashedAccessToken = newAccessToken,
            hashedRefreshToken = newRefreshToken,
            createdAt = LocalDateTime.now()
        )
        tokenRepository.save(updatedToken)
        logger.info("Tokens refreshed for user: $userId")
        return newAccessToken
    }

    // ✅ Logout user by JWT
    @Transactional
    override fun logout(jwt: String) {
        val userId = UUID.fromString(jwtUtils.getUserIdFromToken(jwt))
        tokenRepository.deleteByUserId(userId)
        logger.info("User $userId logged out and tokens deleted")
    }

    // Implement missing logoutByUserId
    @Transactional
    override fun logoutByUserId(userId: UUID) {
        tokenRepository.deleteByUserId(userId)
        logger.info("Tokens deleted for user $userId")
    }
}
