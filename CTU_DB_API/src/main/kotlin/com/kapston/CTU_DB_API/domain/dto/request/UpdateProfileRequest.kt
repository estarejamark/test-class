package com.kapston.CTU_DB_API.domain.dto.request

import com.kapston.CTU_DB_API.domain.entity.ProfileEntity
import com.kapston.CTU_DB_API.domain.Enums.Gender
import com.kapston.CTU_DB_API.domain.entity.UserEntity
import com.kapston.CTU_DB_API.utility.ContactNumberUtils
import java.time.LocalDate

data class UpdateProfileRequest(
    val firstName: String? = null,
    val middleName: String? = null,
    val lastName: String? = null,
    val gender: Gender? = null,
    val birthDate: LocalDate? = null,
    val contactNumber: String? = null,
    val address: String? = null,
    val parentName: String? = null, // For students' parent/guardian name
    val parentContact: String? = null, // For students' parent/guardian contact
    val gradeLevel: String? = null, // For students' grade level
    val password: String? = null, // For teachers to set their password during profile creation
) {
    // Validate contact numbers if provided
    init {
        if (contactNumber != null) {
            require(ContactNumberUtils.isValidContactNumber(contactNumber)) {
                "Contact number must be in format 09XX XXX XXXX or 09XXXXXXXXX"
            }
        }
        if (parentContact != null) {
            require(ContactNumberUtils.isValidContactNumber(parentContact)) {
                "Parent contact number must be in format 09XX XXX XXXX or 09XXXXXXXXX"
            }
        }
    }

    // Standardized contact numbers
    val standardizedContactNumber: String? = contactNumber?.let { ContactNumberUtils.standardizeContactNumber(it) }
    val standardizedParentContact: String? = parentContact?.let { ContactNumberUtils.standardizeContactNumber(it) }

    fun toEntity(userEntity: UserEntity): ProfileEntity = ProfileEntity(
        firstName ?: "",
        middleName,
        lastName ?: "",
        gender,
        birthDate,
        standardizedContactNumber ?: contactNumber,
        address,
        parentName,
        standardizedParentContact ?: parentContact,
        gradeLevel,
        userEntity = userEntity
    )
}
