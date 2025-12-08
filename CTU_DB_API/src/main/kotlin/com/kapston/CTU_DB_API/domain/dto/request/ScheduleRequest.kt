package com.kapston.CTU_DB_API.domain.dto.request

import com.kapston.CTU_DB_API.domain.entity.ProfileEntity
import com.kapston.CTU_DB_API.domain.entity.ScheduleEntity
import com.kapston.CTU_DB_API.domain.entity.SectionEntity
import com.kapston.CTU_DB_API.domain.entity.SubjectEntity
import com.kapston.CTU_DB_API.model.SchoolYearQuarter
import java.time.LocalDateTime
import java.util.UUID

data class ScheduleRequest(
    val teacher: ProfileEntity,
    val subject: SubjectEntity,
    val section: SectionEntity,
    val schoolYearQuarter: SchoolYearQuarter,
    val days: String,
    val startTime: LocalDateTime,
    val endTime: LocalDateTime,
    val createdAt: LocalDateTime = LocalDateTime.now()
)

{
    fun toEntity(id: UUID? = null, createdAt: LocalDateTime? = null): ScheduleEntity = ScheduleEntity(
        id = id,
        teacher = teacher,
        subject = subject,
        section = section,
        schoolYearQuarter = schoolYearQuarter,
        days = days,
        startTime = startTime,
        endTime = endTime,
        createdAt = createdAt,
        updatedAt = LocalDateTime.now()
    )
}
