package com.kapston.CTU_DB_API.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.JavaMailSenderImpl

@Configuration
class MailConfig {

    @Bean
    fun javaMailSender(): JavaMailSender {
        val mailSender = JavaMailSenderImpl()
        // These dummy settings prevent the app from crashing when you don't have SMTP configured.
        mailSender.host = "localhost"
        mailSender.port = 25
        return mailSender
    }
}
