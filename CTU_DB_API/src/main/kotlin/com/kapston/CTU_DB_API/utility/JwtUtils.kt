package com.kapston.CTU_DB_API.utility

import io.jsonwebtoken.Claims
import io.jsonwebtoken.ExpiredJwtException
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatusCode
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import java.util.Base64
import java.util.Date

@Service
class JwtUtils(
    @Value("\${jwt.secret}") private val jwtSecret: String,
    @Value("\${jwt.access-token.validity-seconds}") private val accessTokenValidityS: Long,
    @Value("\${jwt.refresh-token.validity-seconds}") private val refreshTokenValidityS: Long
) {

    private val secretKey = Keys.hmacShaKeyFor(Base64.getDecoder().decode(jwtSecret))
    private val accessTokenValidityMs = accessTokenValidityS * 1000L
    private val refreshTokenValidityMs = refreshTokenValidityS * 1000L

    // Generic token generator
    private fun generateToken(
        userId: String,
        role: String,
        type: String,
        expiry: Long
    ): String {
        val now = Date()
        val expiryDate = Date(now.time + expiry)
        return Jwts.builder()
            .setSubject(userId)
            .claim("role", role.uppercase()) // ensure role is uppercase
            .claim("type", type)
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(secretKey)
            .compact()
    }

    fun generateAccessToken(userId: String, role: String): String =
        generateToken(userId, role, "access", accessTokenValidityMs)

    fun generateRefreshToken(userId: String, role: String): String =
        generateToken(userId, role, "refresh", refreshTokenValidityMs)

    fun validateAccessToken(token: String): Boolean {
        val claims = parseAllClaims(token) ?: return false
        val type = claims["type"] as? String ?: return false
        return type == "access"
    }

    fun validateRefreshToken(token: String): Boolean {
        val claims = parseAllClaims(token) ?: return false
        val type = claims["type"] as? String ?: return false
        return type == "refresh"
    }

    fun getUserIdFromToken(token: String): String {
        val claims = parseAllClaims(token) ?: throw ResponseStatusException(
            HttpStatusCode.valueOf(401),
            "Invalid token."
        )
        return claims.subject
    }

    fun getRoleFromToken(token: String): String {
        val claims = parseAllClaims(token) ?: throw ResponseStatusException(
            HttpStatusCode.valueOf(401),
            "Invalid token."
        )
        return claims["role"] as? String ?: throw ResponseStatusException(
            HttpStatusCode.valueOf(401),
            "Role not found in token."
        )
    }

    private fun parseAllClaims(token: String): Claims? {
        val rawToken = if (token.startsWith("Bearer ")) token.removePrefix("Bearer ") else token
        return try {
            Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(rawToken)
                .payload
        } catch (e: ExpiredJwtException) {
            return null
        }
    }
}
