plugins {
    kotlin("jvm") version "1.9.25"
    kotlin("plugin.spring") version "1.9.25"
    id("org.springframework.boot") version "3.5.4"
    id("io.spring.dependency-management") version "1.1.7"
    kotlin("plugin.jpa") version "1.9.25"
    id("org.flywaydb.flyway") version "10.20.1"
}

group = "com.kapston"
version = "0.0.1-SNAPSHOT"

/*
java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}
*/

repositories {
    mavenCentral()
}

dependencies {
    // Spring Boot Starters
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-mail")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-websocket")
    implementation("org.springframework.boot:spring-boot-starter-cache")

    // Jackson & Kotlin
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-hibernate6:2.19.2")
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310")
    implementation("org.jetbrains.kotlin:kotlin-reflect")

    // Caching
    implementation("com.github.ben-manes.caffeine:caffeine:3.1.8")

    // Flyway & PostgreSQL
    implementation("org.flywaydb:flyway-core:10.20.1")
    implementation("org.flywaydb:flyway-database-postgresql")

    // Spring Boot runtime PostgreSQL driver
    runtimeOnly("org.postgresql:postgresql:42.7.3")

    // Dotenv
    implementation("io.github.cdimascio:dotenv-kotlin:6.4.1")

    // JWT
    implementation("io.jsonwebtoken:jjwt-api:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.6")

    // OpenAPI / Swagger
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.13")

    // Testing
    testImplementation("org.springframework.boot:spring-boot-starter-test") {
        exclude(group = "org.mockito", module = "mockito-core")
        exclude(group = "org.mockito", module = "mockito-junit-jupiter")
    }
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation("com.h2database:h2")
    testImplementation("org.mockito:mockito-core:4.11.0")
    testImplementation("org.mockito:mockito-junit-jupiter:4.11.0")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.bootRun {
    jvmArgs = listOf(
        "-Dspring.profiles.active=dev",
        "-Xms256m",
        "-Xmx1g",
        "-XX:MaxMetaspaceSize=1g",
        "-XX:+UseSerialGC",
        "-XX:MaxGCPauseMillis=100",
        "-XX:+UseStringDeduplication"
    )
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
}

// Flyway configuration
flyway {
    url = "jdbc:postgresql://localhost:5432/ctu_db"
    user = "Hp"
    password = "password"
}

// JPA entities open
allOpen {
    annotation("jakarta.persistence.Entity")
    annotation("jakarta.persistence.MappedSuperclass")
    annotation("jakarta.persistence.Embeddable")
}

tasks.withType<Test> {
    useJUnitPlatform()
    jvmArgs = listOf(
        "-Xms256m",
        "-Xmx1g",
        "-XX:MaxMetaspaceSize=1g",
        "-Dmockito.inlineMockMaker.disabled=true"
    )
}
