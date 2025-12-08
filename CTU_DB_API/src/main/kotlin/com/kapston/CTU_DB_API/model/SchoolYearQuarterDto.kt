package com.kapston.CTU_DB_API.model

import com.kapston.CTU_DB_API.domain.Enums.Quarter
import com.fasterxml.jackson.annotation.JsonSetter
import com.fasterxml.jackson.annotation.Nulls
import java.time.LocalDate
import java.time.LocalDateTime
import com.kapston.CTU_DB_API.model.QuarterStatus

data class SchoolYearQuarterDto(
    val id: Long,
    val quarter: Quarter,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val status: QuarterStatus,
    
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime? = null
)