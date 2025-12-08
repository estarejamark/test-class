package com.school.data.repository

import com.school.data.model.AuditLog
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface AuditLogRepository : JpaRepository<AuditLog, Long> {
    fun findByEntityTypeAndEntityId(entityType: String, entityId: String): List<AuditLog>
    fun findByUserId(userId: Long): List<AuditLog>
}