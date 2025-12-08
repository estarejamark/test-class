package com.kapston.CTU_DB_API.model

fun SchoolYearQuarter.toDto() = SchoolYearQuarterDto(
    id = this.id ?: throw IllegalStateException("Quarter ID cannot be null"),
    quarter = this.quarter!!,
    startDate = this.startDate!!,
    endDate = this.endDate!!,
    status = this.status!!,
    createdAt = this.createdAt!!,
    updatedAt = this.updatedAt
)
