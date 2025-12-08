package com.kapston.CTU_DB_API.domain.dto.request

import com.kapston.CTU_DB_API.domain.Enums.Quarter
import com.kapston.CTU_DB_API.utility.ContactNumberUtils
import java.util.UUID

data class UpdateStudentRequest(
    val firstName: String? = null,
    val lastName: String? = null,
    val middleName: String? = null,
    val gender: String? = null,
    val birthDate: String? = null,
    val contactNumber: String? = null,
    val address: String? = null,
    val parentName: String? = null,
    val parentContact: String? = null,
    val email: String? = null,
    val newSectionId: UUID? = null,
    val schoolYear: String? = null,
    val quarter: Quarter? = null
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
}
