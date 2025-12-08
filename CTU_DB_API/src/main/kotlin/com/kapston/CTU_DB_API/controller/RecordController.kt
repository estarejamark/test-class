package com.kapston.CTU_DB_API.controller

import com.kapston.CTU_DB_API.domain.Enums.Role
import com.kapston.CTU_DB_API.domain.dto.response.QuarterPackageResponse
import com.kapston.CTU_DB_API.domain.dto.response.RecordApprovalResponse
import com.kapston.CTU_DB_API.repository.UserRepository
import com.kapston.CTU_DB_API.service.abstraction.RecordService
import com.kapston.CTU_DB_API.utility.JwtUtils
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import java.util.*

@RestController
@RequestMapping("/api/records")
class RecordController(
    private val recordService: RecordService,
    private val jwtUtils: JwtUtils,
    private val userRepository: UserRepository
) {

    @GetMapping("/pending")
    fun getPendingPackages(@CookieValue("jwt") jwt: String): ResponseEntity<List<QuarterPackageResponse>> {
        // Check if user is admin
        val userId = jwtUtils.getUserIdFromToken(jwt)
        val user = userRepository.findById(UUID.fromString(userId)).orElseThrow {
            ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found")
        }
        if (user.role != Role.ADMIN) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied. You do not have permission to perform this action.")
        }

        val packages = recordService.getPendingPackages()
        return ResponseEntity.ok(packages)
    }

    @GetMapping("/published")
    fun getPublishedPackages(@CookieValue("jwt") jwt: String): ResponseEntity<List<QuarterPackageResponse>> {
        // Check if user is admin
        val userId = jwtUtils.getUserIdFromToken(jwt)
        val user = userRepository.findById(UUID.fromString(userId)).orElseThrow {
            ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found")
        }
        if (user.role != Role.ADMIN) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied. You do not have permission to perform this action.")
        }

        val packages = recordService.getPublishedPackages()
        return ResponseEntity.ok(packages)
    }

    @GetMapping("/{sectionId}/{quarter}")
    fun getPackageDetails(
        @PathVariable sectionId: String,
        @PathVariable quarter: String
    ): ResponseEntity<QuarterPackageResponse> {
        val packageDetails = recordService.getPackageDetails(UUID.fromString(sectionId), quarter)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(packageDetails)
    }

    @PatchMapping("/{packageId}/approve")
    fun approvePackage(
        @PathVariable packageId: String,
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<QuarterPackageResponse> {
        val userId = jwtUtils.getUserIdFromToken(jwt)
        val updatedPackage = recordService.approvePackage(
            UUID.fromString(packageId),
            UUID.fromString(userId)
        )
        return ResponseEntity.ok(updatedPackage)
    }

    @PatchMapping("/{packageId}/return")
    fun returnPackage(
        @PathVariable packageId: String,
        @RequestParam remarks: String,
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<QuarterPackageResponse> {
        val userId = jwtUtils.getUserIdFromToken(jwt)
        val updatedPackage = recordService.returnPackage(
            UUID.fromString(packageId),
            UUID.fromString(userId),
            remarks
        )
        return ResponseEntity.ok(updatedPackage)
    }

    @PatchMapping("/{packageId}/publish")
    fun publishPackage(
        @PathVariable packageId: String,
        @CookieValue("jwt") jwt: String
    ): ResponseEntity<QuarterPackageResponse> {
        // Check if user is admin
        val userId = jwtUtils.getUserIdFromToken(jwt)
        val user = userRepository.findById(UUID.fromString(userId)).orElseThrow {
            ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found")
        }
        if (user.role != Role.ADMIN) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied. You do not have permission to perform this action.")
        }

        val updatedPackage = recordService.publishPackage(UUID.fromString(packageId))
        return ResponseEntity.ok(updatedPackage)
    }

    @GetMapping("/{packageId}/approvals")
    fun getPackageApprovals(@PathVariable packageId: String): ResponseEntity<List<RecordApprovalResponse>> {
        val approvals = recordService.getPackageApprovals(UUID.fromString(packageId))
        return ResponseEntity.ok(approvals)
    }
}
