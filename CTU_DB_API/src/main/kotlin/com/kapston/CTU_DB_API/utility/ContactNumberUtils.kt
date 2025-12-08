package com.kapston.CTU_DB_API.utility

object ContactNumberUtils {

    /**
     * Standardizes contact number to 09XXXXXXXXX format
     * Handles various input formats:
     * - +639XXXXXXXXX -> 09XXXXXXXXX
     * - 639XXXXXXXXX -> 09XXXXXXXXX
     * - 9XXXXXXXXX -> 09XXXXXXXXX
     * - 09XXXXXXXXX -> 09XXXXXXXXX (already correct)
     */
    fun standardizeContactNumber(contactNumber: String?): String? {
        if (contactNumber.isNullOrBlank()) {
            return null
        }

        // Remove all non-digit characters
        val digitsOnly = contactNumber!!.replace(Regex("[^\\d]"), "")

        return when {
            // If starts with +63, remove +63 and ensure 09 prefix
            digitsOnly.startsWith("639") && digitsOnly.length == 12 -> {
                "09${digitsOnly.substring(3)}"
            }
            // If starts with 63, remove 63 and ensure 09 prefix
            digitsOnly.startsWith("63") && digitsOnly.length == 11 -> {
                "09${digitsOnly.substring(2)}"
            }
            // If starts with 9 and has 10 digits, add 0 prefix
            digitsOnly.startsWith("9") && digitsOnly.length == 10 -> {
                "0$digitsOnly"
            }
            // If already starts with 09 and has 11 digits, return as is
            digitsOnly.startsWith("09") && digitsOnly.length == 11 -> {
                digitsOnly
            }
            // If starts with 9 and has 9 digits, add 0 prefix
            digitsOnly.startsWith("9") && digitsOnly.length == 9 -> {
                "0$digitsOnly"
            }
            // Invalid format, return null or original (depending on strictness)
            else -> null
        }
    }

    /**
     * Validates if contact number is in correct 09XXXXXXXXX or 09XX XXX XXXX format
     */
    fun isValidContactNumber(contactNumber: String?): Boolean {
        if (contactNumber.isNullOrBlank()) {
            return false
        }

        // Check for display format: 09XX XXX XXXX (with spaces)
        if (contactNumber!!.matches(Regex("""^09\d{2} \d{3} \d{4}$"""))) {
            return true
        }

        // Check for standard format: 09XXXXXXXXX (digits only)
        val digitsOnly = contactNumber.replace(Regex("""[^\d]"""), "")
        return digitsOnly.matches(Regex("""^09\d{9}$"""))
    }

    /**
     * Formats contact number for display (09XX XXX XXXX)
     */
    fun formatForDisplay(contactNumber: String?): String? {
        if (contactNumber.isNullOrBlank()) {
            return null
        }

        val standardized = standardizeContactNumber(contactNumber)
        return standardized?.let {
            "${it.substring(0, 4)} ${it.substring(4, 7)} ${it.substring(7)}"
        }
    }
}
