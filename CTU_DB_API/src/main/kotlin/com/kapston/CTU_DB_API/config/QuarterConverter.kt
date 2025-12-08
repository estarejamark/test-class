package com.kapston.CTU_DB_API.config

import com.kapston.CTU_DB_API.domain.Enums.Quarter
import org.springframework.core.convert.converter.Converter
import org.springframework.stereotype.Component

@Component
class QuarterConverter : Converter<String, Quarter> {
    override fun convert(source: String): Quarter? {
        return when (source.uppercase()) {
            "Q1", "1ST", "1st" -> Quarter.Q1
            "Q2", "2ND", "2nd" -> Quarter.Q2
            "Q3", "3RD", "3rd" -> Quarter.Q3
            "Q4", "4TH", "4th" -> Quarter.Q4
            else -> throw IllegalArgumentException("Invalid quarter value: $source")
        }
    }
}
