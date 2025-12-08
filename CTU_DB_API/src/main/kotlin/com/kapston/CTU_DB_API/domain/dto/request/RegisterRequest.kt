package com.kapston.CTU_DB_API.domain.dto.request

import com.kapston.CTU_DB_API.domain.Enums.Role
import com.kapston.CTU_DB_API.domain.entity.UserEntity
import com.kapston.CTU_DB_API.utility.HashUtils.hashPassword

data class RegisterRequest(
    val email: String,
    val password: String?,     // nullable
    val role: Role = Role.STUDENT
) {
    fun toEntity(): UserEntity =
        UserEntity(
            email = email,
            password = (password ?: "admin123").hashPassword(),  // default password
            role = role
        )
}
