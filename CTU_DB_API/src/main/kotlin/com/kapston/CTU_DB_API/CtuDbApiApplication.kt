package com.kapston.CTU_DB_API

import io.github.cdimascio.dotenv.Dotenv
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class CtuDbApiApplication

fun main(args: Array<String>) {
    // ✅ Load .env file first
    Dotenv.configure()
        .ignoreIfMissing() // avoid crashing if .env missing
        .load()

    runApplication<CtuDbApiApplication>(*args)
}
