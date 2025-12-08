package com.kapston.CTU_DB_API.model

import java.time.LocalDateTime

data class SchoolProfile(
    val id: Long = 0,
    val name: String,
    val address: String? = null,
    val contactInfo: String? = null,
    val email: String? = null,
    val officeHours: String? = null,
    val logoUrl: String? = null,
    val themeColors: Map<String, String> = emptyMap(), // optional
    val updatedAt: LocalDateTime? = null
)
