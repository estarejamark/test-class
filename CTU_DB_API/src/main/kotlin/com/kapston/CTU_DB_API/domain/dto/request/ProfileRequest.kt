package com.kapston.CTU_DB_API.domain.dto.request

import com.kapston.CTU_DB_API.domain.entity.ProfileEntity
import com.kapston.CTU_DB_API.domain.Enums.Gender
import com.kapston.CTU_DB_API.domain.entity.UserEntity
import com.kapston.CTU_DB_API.utility.ContactNumberUtils
import java.time.LocalDate

data class ProfileRequest(
    val firstName: String,
    val middleName: String? = null,
    val lastName: String,
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
        if (contactNumber != null && contactNumber.isNotBlank()) {
            require(ContactNumberUtils.standardizeContactNumber(contactNumber) != null) {
                "Contact number must be a valid Philippine mobile number (e.g., 09123456789, +639123456789, 9123456789)"
            }
        }
        if (parentContact != null && parentContact.isNotBlank()) {
            require(ContactNumberUtils.standardizeContactNumber(parentContact) != null) {
                "Parent contact number must be a valid Philippine mobile number (e.g., 09123456789, +639123456789, 9123456789)"
            }
        }
    }

    // Standardized contact numbers
    val standardizedContactNumber: String? = contactNumber?.takeIf { it.isNotBlank() }?.let { ContactNumberUtils.standardizeContactNumber(it) }
    val standardizedParentContact: String? = parentContact?.takeIf { it.isNotBlank() }?.let { ContactNumberUtils.standardizeContactNumber(it) }

    fun toEntity(userEntity: UserEntity): ProfileEntity = ProfileEntity(
        firstName,
        middleName,
        lastName,
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
