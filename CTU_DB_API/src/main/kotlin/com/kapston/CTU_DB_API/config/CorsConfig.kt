package com.kapston.CTU_DB_API.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.springframework.web.filter.CorsFilter
import jakarta.annotation.PostConstruct

@Configuration
class CorsConfig {

    @Value("\${cors.allowed-origins:http://localhost:3000}")
    private lateinit var allowedOriginsString: String

    private lateinit var allowedOrigins: List<String>

    @Value("\${cors.allow-credentials:true}")
    private var allowCredentials: Boolean = true

    @PostConstruct
    fun initialize() {
        // Parse the comma-separated string into a list
        allowedOrigins = allowedOriginsString.split(",").map { it.trim() }

        // Validate CORS configuration
        require(allowedOrigins.isNotEmpty()) { "cors.allowed-origins must contain at least one valid origin" }
        allowedOrigins.forEach { origin ->
            require(isValidOrigin(origin)) { "Invalid CORS origin: $origin" }
        }
    }

    private fun isValidOrigin(origin: String): Boolean {
        return origin.startsWith("http://") || origin.startsWith("https://")
    }

    @Bean
    fun corsFilter(): CorsFilter {
        val config = CorsConfiguration()

        // Set allowed origins from environment variable
        config.allowedOrigins = allowedOrigins

        // Allow credentials only if explicitly enabled
        config.allowCredentials = allowCredentials

        // Allow all headers and methods
        config.allowedHeaders = listOf("*")
        config.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "OPTIONS")

        // Expose necessary headers for frontend
        config.exposedHeaders = listOf("Access-Control-Allow-Origin", "Access-Control-Allow-Credentials")

        // Cache preflight response for 1 hour
        config.maxAge = 3600L

        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", config)

        return CorsFilter(source)
    }
}
