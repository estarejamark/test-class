package com.kapston.CTU_DB_API.domain.dto.response

import com.kapston.CTU_DB_API.domain.Enums.Gender
import com.kapston.CTU_DB_API.domain.Enums.Role
import com.kapston.CTU_DB_API.domain.entity.ProfileEntity
import com.kapston.CTU_DB_API.service.abstraction.SectionService
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.UUID

data class ProfileResponse(
    val id: UUID?,
    val firstName: String,
    val middleName: String?,
    val lastName: String,
    val gender: Gender?,
    val birthDate: LocalDate?,
    val contactNumber: String?,
    val address: String?,
    val parentName: String?,
    val parentContact: String?,
    val gradeLevel: String?,
    val lrn: String?,
    val isAdviser: Boolean,
    val user: UserSummary?,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
) {
    companion object {
        fun fromEntity(entity: ProfileEntity, sectionService: SectionService): ProfileResponse {
            return ProfileResponse(
                id = entity.id,
                firstName = entity.firstName,
                middleName = entity.middleName,
                lastName = entity.lastName,
                gender = entity.gender,
                birthDate = entity.birthDate,
                contactNumber = entity.contactNumber,
                address = entity.address,
                parentName = entity.parentName,
                parentContact = entity.parentContact,
                gradeLevel = entity.gradeLevel,
                lrn = entity.lrn,
                isAdviser = entity.userEntity?.role == Role.ADVISER || sectionService.isTeacherAdviser(entity.id!!),
                user = entity.userEntity?.let { UserSummary.fromEntity(it) },
                createdAt = entity.createdAt,
                updatedAt = entity.updatedAt
            )
        }
    }
}
