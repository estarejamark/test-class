package com.kapston.CTU_DB_API.config

import com.kapston.CTU_DB_API.domain.Enums.Quarter
import jakarta.persistence.AttributeConverter
import jakarta.persistence.Converter

@Converter(autoApply = true)
class QuarterAttributeConverter : AttributeConverter<Quarter, String> {

    override fun convertToDatabaseColumn(attribute: Quarter?): String? {
        return attribute?.name
    }

    override fun convertToEntityAttribute(dbData: String?): Quarter? {
        return dbData?.let { convertStringToQuarter(it) }
    }

    private fun convertStringToQuarter(value: String): Quarter? {
        return when (value.uppercase()) {
            "Q1", "1ST", "1st" -> Quarter.Q1
            "Q2", "2ND", "2nd" -> Quarter.Q2
            "Q3", "3RD", "3rd" -> Quarter.Q3
            "Q4", "4TH", "4th" -> Quarter.Q4
            else -> throw IllegalArgumentException("Invalid quarter value: $value")
        }
    }
}
