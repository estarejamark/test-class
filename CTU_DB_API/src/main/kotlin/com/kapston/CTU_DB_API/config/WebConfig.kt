package com.kapston.CTU_DB_API.config

import org.springframework.context.annotation.Configuration
import org.springframework.format.FormatterRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import com.kapston.CTU_DB_API.config.QuarterConverter

@Configuration
class WebConfig(
    private val quarterConverter: QuarterConverter
) : WebMvcConfigurer {

    override fun addFormatters(registry: FormatterRegistry) {
        registry.addConverter(quarterConverter)
    }
}
