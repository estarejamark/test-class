package com.kapston.CTU_DB_API.domain.Enums

import com.fasterxml.jackson.databind.annotation.JsonDeserialize

@JsonDeserialize(using = QuarterDeserializer::class)
enum class Quarter {
    Q1, Q2, Q3, Q4;

    companion object {
        fun fromString(value: String): Quarter {
            return when (value.uppercase()) {
                "Q1", "1ST", "1st" -> Q1
                "Q2", "2ND", "2nd" -> Q2
                "Q3", "3RD", "3rd" -> Q3
                "Q4", "4TH", "4th" -> Q4
                else -> throw IllegalArgumentException("Invalid quarter value: $value")
            }
        }
    }
}
