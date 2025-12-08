package com.school.data.model

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "audit_logs")
data class AuditLog(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false)
    val userId: Long,

    @Column(nullable = false)
    val action: String,

    @Column(nullable = false)
    val entityType: String,

    @Column(nullable = false)
    val entityId: String,

    @Column(nullable = true)
    val oldValue: String?,

    @Column(nullable = true)
    val newValue: String?,

    @Column(nullable = false)
    val timestamp: LocalDateTime = LocalDateTime.now()
)