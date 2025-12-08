package com.kapston.CTU_DB_API.domain.dto.response

import com.kapston.CTU_DB_API.domain.Enums.Role
import com.kapston.CTU_DB_API.domain.entity.ProfileEntity
import com.kapston.CTU_DB_API.domain.entity.ScheduleEntity
import com.kapston.CTU_DB_API.domain.entity.SectionEntity
import com.kapston.CTU_DB_API.domain.entity.SubjectEntity
import com.kapston.CTU_DB_API.domain.entity.UserEntity
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.UUID

data class ScheduleResponse(
    val id: UUID,
    val teacher: ProfileSummary,
    val subject: SubjectSummary,
    val section: SectionSummary,
    val days: String,
    val startTime: String,
    val endTime: String,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime?
) {
    companion object {
        private val timeFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("HH:mm")

        fun fromEntity(entity: ScheduleEntity): ScheduleResponse {
            // Validate required fields
            val entityId = entity.id ?: throw IllegalArgumentException("Schedule entity ID cannot be null")
            val createdAt = entity.createdAt ?: throw IllegalArgumentException("Schedule entity createdAt cannot be null")

            return ScheduleResponse(
                id = entityId,
                teacher = ProfileSummary.fromEntity(entity.teacher),
                subject = SubjectSummary.fromEntity(entity.subject),
                section = SectionSummary.fromEntity(entity.section),
                days = entity.days,
                startTime = entity.startTime.format(timeFormatter),
                endTime = entity.endTime.format(timeFormatter),
                createdAt = createdAt,
                updatedAt = entity.updatedAt
            )
        }
    }
}

data class ProfileSummary(
    val id: UUID,
    val firstName: String,
    val middleName: String?,
    val lastName: String,
    val user: UserSummary?
) {
    companion object {
        fun fromEntity(entity: ProfileEntity): ProfileSummary {
            val entityId = entity.id ?: throw IllegalArgumentException("Profile entity ID cannot be null")
            val userEntity = entity.userEntity

            return ProfileSummary(
                id = entityId,
                firstName = entity.firstName,
                middleName = entity.middleName,
                lastName = entity.lastName,
                user = userEntity?.let { UserSummary.fromEntity(it) }
            )
        }
    }
}

data class UserSummary(
    val id: UUID,
    val email: String,
    val role: Role
) {
    companion object {
        fun fromEntity(entity: UserEntity): UserSummary {
            val entityId = entity.id ?: throw IllegalArgumentException("User entity ID cannot be null")

            return UserSummary(
                id = entityId,
                email = entity.email,
                role = entity.role
            )
        }
    }
}

data class SubjectSummary(
    val id: UUID,
    val subjectCode: String,
    val name: String
) {
    companion object {
        fun fromEntity(entity: SubjectEntity): SubjectSummary {
            val entityId = entity.id ?: throw IllegalArgumentException("Subject entity ID cannot be null")

            return SubjectSummary(
                id = entityId,
                subjectCode = entity.subjectCode,
                name = entity.name
            )
        }
    }
}

data class AdviserSummary(
    val id: UUID,
    val firstName: String,
    val middleName: String?,
    val lastName: String
) {
    companion object {
        fun fromEntity(entity: ProfileEntity): AdviserSummary {
            val entityId = entity.id ?: throw IllegalArgumentException("Profile entity ID cannot be null")

            return AdviserSummary(
                id = entityId,
                firstName = entity.firstName,
                middleName = entity.middleName,
                lastName = entity.lastName
            )
        }

        fun fromIdAndName(id: UUID?, name: String?): AdviserSummary? {
            if (id == null || name == null) return null

            val nameParts = name.split(" ")
            val firstName = nameParts.getOrNull(0) ?: ""
            val middleName = if (nameParts.size > 2) nameParts[1] else null
            val lastName = nameParts.lastOrNull() ?: ""

            return AdviserSummary(
                id = id,
                firstName = firstName,
                middleName = middleName,
                lastName = lastName
            )
        }
    }
}

data class SectionSummary(
    val id: UUID,
    val name: String,
    val gradeLevel: String,
    val adviser: AdviserSummary?
) {
    companion object {
        fun fromEntity(entity: SectionEntity): SectionSummary {
            val entityId = entity.id ?: throw IllegalArgumentException("Section entity ID cannot be null")

            return SectionSummary(
                id = entityId,
                name = entity.name,
                gradeLevel = entity.gradeLevel,
                adviser = AdviserSummary.fromIdAndName(entity.adviserId, entity.adviserName)
            )
        }
    }
}
