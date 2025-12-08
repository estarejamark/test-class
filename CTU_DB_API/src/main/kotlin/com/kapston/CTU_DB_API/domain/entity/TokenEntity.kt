package com.kapston.CTU_DB_API.domain.entity

import com.kapston.CTU_DB_API.domain.dto.response.TokenResponse
import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import java.time.LocalDateTime
import java.util.UUID

@Entity
@Table(name = "token")
data class TokenEntity(

    @Id
    @GeneratedValue(
        strategy = GenerationType.SEQUENCE,
        generator = "token_id_seq"
    )
    @SequenceGenerator(
        name = "token_id_seq",
        sequenceName = "token_id_seq",
        allocationSize = 1
    )
    @Column(name = "id")
    val id: Int? = null,

    @Column(name = "user_id", nullable = false)
    val userId: UUID,

    @Column(name = "role", nullable = false)
    val role: String = "",

    @Column(name = "hashed_access_token", nullable = false, columnDefinition = "TEXT")
    val hashedAccessToken: String = "",

    @Column(name = "hashed_refresh_token", nullable = false, columnDefinition = "TEXT")
    val hashedRefreshToken: String = "",

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    val createdAt: LocalDateTime? = null
)

fun TokenEntity.toResponse(): TokenResponse {
    return TokenResponse(
        accessToken = this.hashedAccessToken,
        refreshToken = this.hashedRefreshToken,
        role = this.role
    )
}
