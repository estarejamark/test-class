package com.kapston.CTU_DB_API.domain.dto.request

import com.kapston.CTU_DB_API.domain.Enums.Quarter
import com.kapston.CTU_DB_API.domain.Enums.Role
import com.kapston.CTU_DB_API.utility.ContactNumberUtils
import java.util.UUID

data class CreateStudentRequest(
    val email: String,
    val password: String? = null,
    val firstName: String,
    val lastName: String,
    val middleName: String? = null,
    val gender: String,
    val birthDate: String,
    val contactNumber: String? = null,
    val address: String,
    val parentName: String? = null,
    val parentContact: String? = null,
    val sectionId: UUID,
    val schoolYear: String = "2024-2025",
    val quarter: Quarter = Quarter.Q1
) {
    val role: Role = Role.STUDENT

    // Validate contact numbers on creation
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
}