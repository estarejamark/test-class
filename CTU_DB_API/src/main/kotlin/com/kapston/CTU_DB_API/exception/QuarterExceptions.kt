package com.kapston.CTU_DB_API.exception

class QuarterNotFoundException(message: String) : RuntimeException(message)

class QuarterActivationException(message: String) : RuntimeException(message)

class QuarterForbiddenException(message: String) : RuntimeException(message)
