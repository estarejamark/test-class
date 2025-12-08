package com.kapston.CTU_DB_API.domain.entity

import com.kapston.CTU_DB_API.domain.Enums.PackageStatus
import com.kapston.CTU_DB_API.domain.Enums.Quarter
import com.kapston.CTU_DB_API.domain.dto.response.AdviserResponse
import com.kapston.CTU_DB_API.domain.dto.response.QuarterPackageResponse
import com.kapston.CTU_DB_API.service.abstraction.SectionService
import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.UpdateTimestamp
import java.time.LocalDateTime
import java.util.*

@Entity
@Table(name = "quarter_packages")
class QuarterPackageEntity(

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    var section: SectionEntity,

    @Enumerated(EnumType.STRING)
    @Convert(converter = com.kapston.CTU_DB_API.config.QuarterAttributeConverter::class)
    @Column(nullable = false)
    var quarter: Quarter,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: PackageStatus = PackageStatus.PENDING,

    @Column(name = "submitted_at")
    var submittedAt: LocalDateTime? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "adviser_id", nullable = true)
    var adviser: ProfileEntity?,

    @Column(length = 1000)
    var remarks: String? = null,

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    val createdAt: LocalDateTime? = LocalDateTime.now(),

    @UpdateTimestamp
    @Column(name = "updated_at")
    var updatedAt: LocalDateTime? = null
)

{
    fun toResponse(sectionService: SectionService): QuarterPackageResponse = QuarterPackageResponse(
        id = id!!,
        section = section.toResponse(),
        quarter = quarter,
        status = status,
        submittedAt = submittedAt,
        adviser = adviser?.let {
            AdviserResponse.fromEntity(it, sectionService)
        },
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}
