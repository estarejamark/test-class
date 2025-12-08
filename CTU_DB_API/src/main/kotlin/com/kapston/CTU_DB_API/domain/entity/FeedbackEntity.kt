package com.kapston.CTU_DB_API.domain.entity

import com.kapston.CTU_DB_API.domain.Enums.Quarter
import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.UpdateTimestamp
import java.time.LocalDateTime
import java.util.*

@Entity
@Table(name = "feedback")
class FeedbackEntity(

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    var student: ProfileEntity,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    var section: SectionEntity,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var quarter: Quarter,

    @Column(nullable = false, columnDefinition = "TEXT")
    var feedback: String,

    @Column(name = "student_response", columnDefinition = "TEXT")
    var studentResponse: String? = null,

    @Column(name = "response_reviewed", nullable = false)
    var responseReviewed: Boolean = false,

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
