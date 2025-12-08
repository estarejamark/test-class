package com.kapston.CTU_DB_API.domain.dto.response

import com.kapston.CTU_DB_API.domain.Enums.Role
import com.kapston.CTU_DB_API.domain.entity.UserEntity
import com.kapston.CTU_DB_API.service.abstraction.SectionService
import java.util.UUID

data class UserResponse(
    val email: String,
    val membershipCode: String,
    val role: Role,
    val status: String,
    val id: UUID,
    val gradeLevel: String?,          // only for students
    val sectionName: String?,         // only for students
    val profile: ProfileResponse?     // include profile for all users
) {
    companion object {
        fun fromEntity(entity: UserEntity, sectionService: SectionService): UserResponse {
            // Include profile data for system users endpoint
            val profileResponse = entity.profile?.let { ProfileResponse.fromEntity(it, sectionService) }

            // For students, include enrollment data
            val enrollment = if (entity.role == Role.STUDENT) entity.enrollments.firstOrNull() else null
            val section = enrollment?.section

            return UserResponse(
                email = entity.email,
                membershipCode = entity.membershipCode ?: "",
                role = entity.role,
                status = entity.status.name,
                id = entity.id ?: throw RuntimeException("User entity has null ID - this should not happen for persisted entities"),
                gradeLevel = if (entity.role == Role.STUDENT) section?.gradeLevel?.toString() else null,
                sectionName = if (entity.role == Role.STUDENT) section?.name else null,
                profile = profileResponse
            )
        }
    }
}

// ✅ Extension function for UserEntity
fun UserEntity.toResponse(sectionService: SectionService): UserResponse = UserResponse.fromEntity(this, sectionService)

