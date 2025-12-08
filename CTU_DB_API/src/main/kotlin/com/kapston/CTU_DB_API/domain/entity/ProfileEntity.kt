package com.kapston.CTU_DB_API.domain.entity

import com.kapston.CTU_DB_API.domain.Enums.Gender
import com.kapston.CTU_DB_API.domain.dto.response.ProfileResponse
import com.kapston.CTU_DB_API.service.abstraction.SectionService
import jakarta.persistence.*
import org.hibernate.annotations.ColumnTransformer
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.UpdateTimestamp
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.UUID
import com.fasterxml.jackson.annotation.JsonBackReference

@Entity
@Table(
    name = "profiles",
    uniqueConstraints = [UniqueConstraint(columnNames = ["user_id"])]
)
class ProfileEntity(

    @Column(name = "first_name", nullable = false)
    var firstName: String,

    @Column(name = "middle_name")
    var middleName: String? = null,

    @Column(name = "last_name", nullable = false)
    var lastName: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "gender")
    var gender: Gender? = null,

    @Column(name = "birth_date")
    var birthDate: LocalDate? = null,

    @Column(name = "contact_number")
    var contactNumber: String? = null,

    @Column(name = "address")
    var address: String? = null,

    @Column(name = "parent_name")
    var parentName: String? = null,

    @Column(name = "parent_contact")
    var parentContact: String? = null,

    @Column(name = "grade_level")
    var gradeLevel: String? = null,

    @Column(name = "lrn")
    var lrn: String? = null,

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    var id: UUID? = null,

    @OneToOne
    @JoinColumn(name = "user_id", nullable = true)
    @JsonBackReference
    var userEntity: UserEntity? = null,

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    val createdAt: LocalDateTime? = LocalDateTime.now(),

    @UpdateTimestamp
    @Column(name = "updated_at")
    var updatedAt: LocalDateTime? = null
)

{
    fun toResponse(sectionService: SectionService): ProfileResponse = ProfileResponse.fromEntity(this, sectionService)
}
