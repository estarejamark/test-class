package com.kapston.CTU_DB_API.domain.dto.response

import com.kapston.CTU_DB_API.domain.Enums.ApprovalAction
import java.time.LocalDateTime
import java.util.*

data class RecordApprovalResponse(
    val id: UUID,
    val packageId: UUID,
    val approver: AdviserResponse,
    val action: ApprovalAction,
    val remarks: String?,
    val createdAt: LocalDateTime?
)
