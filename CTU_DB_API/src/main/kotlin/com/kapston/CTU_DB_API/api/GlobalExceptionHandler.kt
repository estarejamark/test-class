package com.kapston.CTU_DB_API.api

import com.kapston.CTU_DB_API.CustomException.*
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.stereotype.Component
import org.springframework.validation.FieldError
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler

@ControllerAdvice
@Component("globalExceptionHandler")
class GlobalExceptionHandler {

    private val logger: Logger = LoggerFactory.getLogger(GlobalExceptionHandler::class.java)

    // API Exception handlers
    @ExceptionHandler(ApiException::class)
    fun handleApiException(ex: ApiException): ResponseEntity<ApiError> {
        val error = ApiError(
            code = ex.code,
            message = ex.message,
            status = ex.status
        )
        return ResponseEntity.status(ex.status).body(error)
    }

    // Custom business exception handlers
    @ExceptionHandler(UserAlreadyExistsException::class)
    fun handleUserAlreadyExists(ex: UserAlreadyExistsException): ResponseEntity<GlobalExceptionModel> {
        logger.error("User already exists: ${ex.message}", ex)
        val response = GlobalExceptionModel(
            ex.message ?: "User already exists"
        )
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response)
    }

    @ExceptionHandler(BadCredentialsException::class)
    fun handleInvalidCredentials(ex: BadCredentialsException): ResponseEntity<GlobalExceptionModel> {
        logger.warn("Invalid credentials attempt: ${ex.message}")
        val response = GlobalExceptionModel(
            ex.message ?: "Invalid credentials"
        )
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response)
    }

    @ExceptionHandler(IllegalArgumentException::class)
    fun handleIllegalArgumentException(ex: IllegalArgumentException): ResponseEntity<GlobalExceptionModel> {
        logger.warn("Illegal argument: ${ex.message}", ex)
        val response = GlobalExceptionModel(
            ex.message ?: "Invalid argument provided"
        )
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response)
    }

    @ExceptionHandler(SectionAlreadyExistsException::class)
    fun handleSectionAlreadyExistsException(ex: SectionAlreadyExistsException): ResponseEntity<GlobalExceptionModel> {
        logger.warn("Section already exists: ${ex.message}", ex)
        val response = GlobalExceptionModel(
            ex.message ?: "Section already exists"
        )
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response)
    }

    @ExceptionHandler(ProfileNotFoundException::class)
    fun handleProfileNotFoundException(ex: ProfileNotFoundException): ResponseEntity<GlobalExceptionModel> {
        logger.warn("Profile not found: ${ex.message}", ex)
        val response = GlobalExceptionModel(
            ex.message ?: "Profile not found"
        )
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response)
    }

    @ExceptionHandler(ScheduleConflictError::class)
    fun handleScheduleConflict(ex: ScheduleConflictError): ResponseEntity<GlobalExceptionModel> {
        logger.warn("Schedule conflict: ${ex.message}", ex)
        val response = GlobalExceptionModel(
            ex.message ?: "Schedule conflict detected"
        )
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response)
    }

    @ExceptionHandler(TeacherScheduleError::class)
    fun handleTeacherScheduleError(ex: TeacherScheduleError): ResponseEntity<GlobalExceptionModel> {
        logger.warn("Teacher schedule error: ${ex.message}", ex)
        val response = GlobalExceptionModel(
            ex.message ?: "Teacher schedule error detected"
        )
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response)
    }

    @ExceptionHandler(ScheduleSaveError::class)
    fun handleScheduleSaveError(ex: ScheduleSaveError): ResponseEntity<GlobalExceptionModel> {
        logger.error("Schedule save error: ${ex.message}", ex)
        val response = GlobalExceptionModel(
            ex.message ?: "Failed to save schedule"
        )
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response)
    }

    @ExceptionHandler(SectionNotFoundException::class)
    fun handleSectionNotFoundException(ex: SectionNotFoundException): ResponseEntity<GlobalExceptionModel> {
        logger.warn("Section not found: ${ex.message}", ex)
        val response = GlobalExceptionModel(
            ex.message ?: "Section not found"
        )
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response)
    }

    @ExceptionHandler(SectionHasDependenciesException::class)
    fun handleSectionHasDependenciesException(ex: SectionHasDependenciesException): ResponseEntity<GlobalExceptionModel> {
        logger.warn("Section has dependencies: ${ex.message}", ex)
        val response = GlobalExceptionModel(
            ex.message ?: "Section has dependent records and cannot be deleted"
        )
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response)
    }

    @ExceptionHandler(OtpTooManyRequestException::class)
    fun handleOtpTooManyRequestException(ex: OtpTooManyRequestException): ResponseEntity<GlobalExceptionModel> {
        logger.warn("OTP too many requests: ${ex.message}", ex)
        val response = GlobalExceptionModel(
            ex.message ?: "Too many OTP requests"
        )
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(response)
    }

    @ExceptionHandler(OtpInvalidException::class)
    fun handleOtpInvalidException(ex: OtpInvalidException): ResponseEntity<GlobalExceptionModel> {
        logger.warn("Invalid OTP: ${ex.message}", ex)
        val response = GlobalExceptionModel(
            ex.message ?: "Invalid OTP provided"
        )
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response)
    }

    // HTTP and parsing exception handlers
    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleHttpMessageNotReadable(ex: HttpMessageNotReadableException): ResponseEntity<GlobalExceptionModel> {
        logger.warn("Malformed request body: ${ex.message}", ex)
        val message = ex.cause?.message ?: ex.message ?: "Malformed request body"
        val response = GlobalExceptionModel(message)
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response)
    }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleMethodArgumentNotValid(ex: MethodArgumentNotValidException): ResponseEntity<GlobalExceptionModel> {
        logger.warn("Validation failed: ${ex.message}", ex)

        val errors = ex.bindingResult.allErrors
        val errorMessage = if (errors.isNotEmpty()) {
            val fieldError = errors[0] as? FieldError
            fieldError?.defaultMessage ?: "Validation failed"
        } else {
            "Validation failed"
        }

        val response = GlobalExceptionModel(errorMessage)
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response)
    }

    // Runtime and generic exception handlers
    @ExceptionHandler(RuntimeException::class)
    fun handleRuntimeException(ex: RuntimeException): ResponseEntity<GlobalExceptionModel> {
        logger.error("Runtime exception: ${ex.message}", ex)
        val response = GlobalExceptionModel(
            ex.message ?: "Unexpected runtime error"
        )
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response)
    }

    @ExceptionHandler(AccessDeniedException::class)
    fun handleAccessDeniedException(ex: AccessDeniedException): ResponseEntity<GlobalExceptionModel> {
        logger.warn("Access denied: ${ex.message}", ex)
        val response = GlobalExceptionModel(
            ex.message ?: "Access denied"
        )
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response)
    }

    @ExceptionHandler(Exception::class)
    fun handleGenericException(ex: Exception): ResponseEntity<GlobalExceptionModel> {
        logger.error("Unexpected error: ${ex.message}", ex)
        ex.printStackTrace()
        val response = GlobalExceptionModel(
            ex.message ?: "Internal server error"
        )
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response)
    }
}
