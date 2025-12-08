package com.kapston.CTU_DB_API.utility

import java.security.SecureRandom

object OtpGeneratorUtil {
    private val random = SecureRandom()

    fun generateOtp(length: Int = 6): String {
        val digits = (0 until length)
            .map { random.nextInt(10) }
            .joinToString("")
        return digits
    }
}