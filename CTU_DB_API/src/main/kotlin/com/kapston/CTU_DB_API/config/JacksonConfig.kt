package com.kapston.CTU_DB_API.config

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.KotlinModule
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter

@Configuration
class JacksonConfig {

    @Bean
    fun mappingJackson2HttpMessageConverter(): MappingJackson2HttpMessageConverter {
        val mapper = ObjectMapper()
        val hibernate6Module = Hibernate6Module()
        hibernate6Module.configure(Hibernate6Module.Feature.FORCE_LAZY_LOADING, false)
        hibernate6Module.configure(Hibernate6Module.Feature.USE_TRANSIENT_ANNOTATION, false)
        mapper.registerModule(hibernate6Module)
        mapper.registerModule(KotlinModule.Builder().build())
        mapper.registerModule(JavaTimeModule()) // Add JavaTimeModule for LocalDateTime serialization
        return MappingJackson2HttpMessageConverter(mapper)
    }
}
