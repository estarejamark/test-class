package com.kapston.CTU_DB_API.controller

import com.kapston.CTU_DB_API.model.SchoolYearQuarter
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.SendTo
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Controller

@Controller
class WebSocketController(private val messagingTemplate: SimpMessagingTemplate) {

    companion object {
        private val logger: Logger = LoggerFactory.getLogger(WebSocketController::class.java)
    }

    // Method to broadcast quarter updates to all connected clients
    fun broadcastQuarterUpdate(quarter: SchoolYearQuarter) {
        logger.info("Broadcasting quarter update: ${quarter.quarter?.name} - ${quarter.status}")
        messagingTemplate.convertAndSend("/topic/quarter-updates", mapOf(
            "type" to "QUARTER_UPDATE",
            "quarter" to quarter.quarter?.name,
            "status" to quarter.status.name,
            "startDate" to quarter.startDate,
            "endDate" to quarter.endDate
        ))
    }

    // Optional: Handle client messages if needed
    @MessageMapping("/quarter-subscribe")
    @SendTo("/topic/quarter-updates")
    fun handleQuarterSubscription(message: Map<String, Any>): Map<String, Any> {
        logger.info("Client subscribed to quarter updates")
        return mapOf(
            "type" to "SUBSCRIPTION_CONFIRMED",
            "message" to "Successfully subscribed to quarter updates"
        )
    }
}
