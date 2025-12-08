package com.kapston.CTU_DB_API.domain.Enums

import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.DeserializationContext
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.JsonNode

class QuarterDeserializer : JsonDeserializer<Quarter>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): Quarter {
        val node: JsonNode = p.codec.readTree(p)
        val value = node.asText().uppercase()

        return when (value) {
            "Q1", "1ST", "1st" -> Quarter.Q1
            "Q2", "2ND", "2nd" -> Quarter.Q2
            "Q3", "3RD", "3rd" -> Quarter.Q3
            "Q4", "4TH", "4th" -> Quarter.Q4
            else -> throw IllegalArgumentException("Invalid quarter value: $value. Valid values are Q1, Q2, Q3, Q4, 1st, 2nd, 3rd, 4th")
        }
    }
}
