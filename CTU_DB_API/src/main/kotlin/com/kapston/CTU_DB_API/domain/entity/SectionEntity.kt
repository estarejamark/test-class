package com.kapston.CTU_DB_API.domain.entity

import com.kapston.CTU_DB_API.domain.dto.response.SectionResponse
import com.kapston.CTU_DB_API.domain.dto.response.ProfileResponse
import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.OnDelete
import org.hibernate.annotations.OnDeleteAction
import org.hibernate.annotations.UpdateTimestamp
import java.time.LocalDateTime
import java.util.*

@Entity
@Table(name = "sections")
class SectionEntity(

    @Column(nullable = false, unique = true)
    var name: String,

    @Column(name = "grade_level", nullable = false)
    var gradeLevel: String,

    @Column(name = "adviser_id", nullable = true)
    var adviserId: UUID?,

    @Column(name = "adviser_name", nullable = true)
    var adviserName: String?,

    @Column(nullable = true)
    var capacity: Int? = null,

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @Version
    @Column(name = "version")
    var version: Long? = null,

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    val createdAt: LocalDateTime? = LocalDateTime.now(),

    @UpdateTimestamp
    @Column(name = "updated_at")
    var updatedAt: LocalDateTime? = null
)

{
    fun toResponse(): SectionResponse = SectionResponse.fromEntity(this)
}
