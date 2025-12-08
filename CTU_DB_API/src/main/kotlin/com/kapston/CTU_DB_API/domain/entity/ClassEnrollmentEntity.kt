package com.kapston.CTU_DB_API.domain.entity

import com.kapston.CTU_DB_API.domain.Enums.Quarter
import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import java.time.LocalDateTime
import java.util.*

@Entity
@Table(name = "class_enrollments")
class ClassEnrollmentEntity(

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    val student: UserEntity,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    var section: SectionEntity,  // <- changed from val to var

    @Column(name = "school_year")
    val schoolYear: String? = null,

    @Enumerated(EnumType.STRING)
    @Convert(converter = com.kapston.CTU_DB_API.config.QuarterAttributeConverter::class)
    @Column(name = "quarter")
    val quarter: Quarter? = null,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @CreationTimestamp
    @Column(name = "enrolled_at", updatable = false)
    val enrolledAt: LocalDateTime = LocalDateTime.now()
)
