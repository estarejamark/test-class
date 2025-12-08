package com.kapston.CTU_DB_API.config

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.InitializingBean
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component

@Component
class ConfigurationValidator : InitializingBean {

    private val logger = LoggerFactory.getLogger(ConfigurationValidator::class.java)

    @Value("\${spring.datasource.url:}")
    private lateinit var datasourceUrl: String

    @Value("\${spring.datasource.username:}")
    private lateinit var datasourceUsername: String

    @Value("\${spring.datasource.password:}")
    private lateinit var datasourcePassword: String

    @Value("\${jwt.secret:}")
    private lateinit var jwtSecret: String

    @Value("\${server.port:8080}")
    private var serverPort: Int = 8080

    @Value("\${cors.allowed-origins:http://localhost:3000}")
    private lateinit var corsAllowedOrigins: String

    @Value("\${spring.mail.host:#{null}}")
    private var mailHost: String? = null

    override fun afterPropertiesSet() {
        logger.info("Starting configuration validation...")

        validateRequiredConfigurations()
        validateOptionalConfigurations()

        logger.info("Configuration validation completed successfully.")
    }

    private fun validateRequiredConfigurations() {
        val errors = mutableListOf<String>()

        // Database configurations
        if (datasourceUrl.isBlank()) {
            errors.add("spring.datasource.url is required but not configured")
        } else if (!datasourceUrl.startsWith("jdbc:postgresql://")) {
            errors.add("spring.datasource.url must be a valid PostgreSQL JDBC URL")
        }

        if (datasourceUsername.isBlank()) {
            errors.add("spring.datasource.username is required but not configured")
        }

        if (datasourcePassword.isBlank()) {
            errors.add("spring.datasource.password is required but not configured")
        }

        // JWT configuration
        if (jwtSecret.isBlank()) {
            errors.add("jwt.secret is required but not configured")
        } else if (jwtSecret.length < 32) {
            errors.add("jwt.secret must be at least 32 characters long for security")
        }

        // Server port
        if (serverPort <= 0 || serverPort > 65535) {
            errors.add("server.port must be a valid port number (1-65535)")
        }

        if (errors.isNotEmpty()) {
            val errorMessage = "Configuration validation failed:\n" + errors.joinToString("\n") { "- $it" }
            logger.error(errorMessage)
            throw IllegalStateException(errorMessage)
        }
    }

    private fun validateOptionalConfigurations() {
        // CORS origins
        if (corsAllowedOrigins.isBlank()) {
            logger.warn("cors.allowed-origins is not configured, defaulting to http://localhost:3000")
        } else {
            val origins = corsAllowedOrigins.split(",").map { it.trim() }
            val invalidOrigins = origins.filter { !isValidUrl(it) }
            if (invalidOrigins.isNotEmpty()) {
                logger.warn("Invalid CORS origins detected: ${invalidOrigins.joinToString()}. Ensure they are valid URLs.")
            }
        }

        // Mail configuration (only if host is provided)
        if (mailHost != null && mailHost!!.isNotBlank()) {
            logger.info("Mail configuration detected. Ensure all mail properties are properly configured.")
        } else {
            logger.info("Mail configuration is disabled (no host configured)")
        }
    }

    private fun isValidUrl(url: String): Boolean {
        return try {
            java.net.URI(url).toURL()
            true
        } catch (e: Exception) {
            false
        }
    }
}
