package com.kapston.CTU_DB_API.controller

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDateTime
import java.util.*

@RestController
@RequestMapping("/health")
class HealthController {

    @GetMapping
    fun healthCheck(): ResponseEntity<Map<String, Any>> {
        val healthResponse = mapOf(
            "status" to "UP",
            "timestamp" to LocalDateTime.now(),
            "service" to "CTU_DB_API",
            "version" to "1.0.0"
        )
        return ResponseEntity.ok(healthResponse)
    }

    @GetMapping("/detailed")
    fun detailedHealthCheck(): ResponseEntity<Map<String, Any>> {
        val runtime = Runtime.getRuntime()
        val detailedResponse = mapOf(
            "status" to "UP",
            "timestamp" to LocalDateTime.now(),
            "service" to "CTU_DB_API",
            "version" to "1.0.0",
            "system" to mapOf(
                "javaVersion" to System.getProperty("java.version"),
                "os" to System.getProperty("os.name"),
                "totalMemory" to runtime.totalMemory(),
                "freeMemory" to runtime.freeMemory(),
                "availableProcessors" to runtime.availableProcessors()
            )
        )
        return ResponseEntity.ok(detailedResponse)
    }
}
