package com.kapston.CTU_DB_API.domain.entity

import com.kapston.CTU_DB_API.domain.dto.response.SubjectResponse
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.UpdateTimestamp
import java.time.LocalDateTime
import java.util.UUID

@Entity
@Table(name = "subjects")
data class SubjectEntity(

    @Column(name = "subject_code", nullable = false, unique = true)
    val subjectCode: String,

    @Column(name = "name", nullable = false, unique = true)
    val name: String,

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    val createdAt: LocalDateTime? = LocalDateTime.now(),

    @UpdateTimestamp
    @Column(name = "updated_at")
    val updatedAt: LocalDateTime? = null
)
{
    fun toResponse(): SubjectResponse = SubjectResponse(
        subjectCode,
        name,
        id,
        createdAt,
        updatedAt
    )
}