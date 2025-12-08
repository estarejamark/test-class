package com.kapston.CTU_DB_API.domain.entity

import com.kapston.CTU_DB_API.domain.Enums.Role
import com.kapston.CTU_DB_API.domain.Enums.StatusEnum
import com.kapston.CTU_DB_API.domain.dto.response.UserResponse
import jakarta.persistence.*
import org.hibernate.annotations.ColumnTransformer
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.UpdateTimestamp
import java.time.LocalDateTime
import java.util.*
import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.annotation.JsonManagedReference

@Entity
@Table(name = "users")
class UserEntity(

    @Column(nullable = false, unique = true)
    var email: String = "",

    @Column(name = "student_id", unique = true)
    var studentId: UUID? = null,

    @Column(nullable = false)
    @JsonIgnore
    var password: String = "",

    @Column(name = "membership_code", insertable = false, updatable = false)
    val membershipCode: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var role: Role = Role.STUDENT,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: StatusEnum = StatusEnum.ACTIVE,

    // Temporary profile fields for students - used to create profile on first login
    var firstName: String? = null,
    var lastName: String? = null,
    var middleName: String? = null,
    @Enumerated(EnumType.STRING)
    var gender: com.kapston.CTU_DB_API.domain.Enums.Gender? = null,
    var birthDate: java.time.LocalDate? = null,
    var contactNumber: String? = null,
    var address: String? = null,
    var parentName: String? = null,
    var parentContact: String? = null,

    @OneToOne(mappedBy = "userEntity", cascade = [], orphanRemoval = false)
    @JsonManagedReference
    var profile: ProfileEntity? = null,

    @OneToMany(mappedBy = "student", cascade = [], orphanRemoval = false)
    val enrollments: MutableList<ClassEnrollmentEntity> = mutableListOf(),

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @UpdateTimestamp
    @Column(name = "updated_at")
    val updatedAt: LocalDateTime? = null
)
