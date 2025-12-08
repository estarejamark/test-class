package com.kapston.CTU_DB_API.domain.entity

import com.fasterxml.jackson.annotation.JsonFormat
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "school_profile")
data class SchoolProfileEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    var name: String,

    var address: String? = null,

    @Column(name = "contact_info")
    var contactInfo: String? = null,

    var email: String? = null,

    @Column(name = "office_hours")
    var officeHours: String? = null,

    @Column(name = "logo_url")
    var logoUrl: String? = null,

    @ElementCollection
    @CollectionTable(name = "theme_colors")
    var themeColors: Map<String, String> = mapOf(),

    @Column(name = "updated_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    var updatedAt: LocalDateTime = LocalDateTime.now()
)
