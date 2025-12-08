package com.kapston.CTU_DB_API.config

import io.github.cdimascio.dotenv.dotenv
import org.springframework.context.annotation.Configuration
import org.springframework.core.env.Environment
import jakarta.annotation.PostConstruct

@Configuration
class EnvironmentConfig(private val environment: Environment) {

    @PostConstruct
    fun loadEnvironmentVariables() {
        val activeProfiles = environment.activeProfiles
        if (!activeProfiles.contains("test")) {
            val dotenv = dotenv {
                ignoreIfMissing = true
                directory = "."
            }
            dotenv.entries().forEach {
                System.setProperty(it.key, it.value)
            }
        }
    }
}
