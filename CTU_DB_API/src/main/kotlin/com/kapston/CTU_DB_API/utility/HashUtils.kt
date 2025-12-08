package com.kapston.CTU_DB_API.utility

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder

object HashUtils {

    fun String.hashPassword(): String {
        return BCryptPasswordEncoder().encode(this)
    }

    fun String.verifyPassword(hashed: String): Boolean {
        return BCryptPasswordEncoder().matches(this, hashed)
    }
}