package com.kapston.CTU_DB_API.controller

import com.kapston.CTU_DB_API.service.abstraction.AdviserService
import com.kapston.CTU_DB_API.service.abstraction.QuarterPackageService
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/quarter-packages")
@PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER') or hasRole('ADVISER')")
class QuarterPackageController(
    private val quarterPackageService: QuarterPackageService,
    private val adviserService: AdviserService
) {

    @GetMapping
    fun getAllQuarterPackages(): ResponseEntity<List<com.kapston.CTU_DB_API.domain.dto.response.QuarterPackageResponse>> {
        val packages = quarterPackageService.getAllQuarterPackages()
        return ResponseEntity.ok(packages)
    }

    @GetMapping("/{id}")
    fun getQuarterPackageById(@PathVariable id: UUID): ResponseEntity<com.kapston.CTU_DB_API.domain.dto.response.QuarterPackageResponse> {
        val quarterPackage = quarterPackageService.getQuarterPackageById(id)
        return if (quarterPackage != null) {
            ResponseEntity.ok(quarterPackage)
        } else {
            ResponseEntity.notFound().build()
        }
    }

    @GetMapping("/section/{sectionId}")
    fun getQuarterPackagesBySectionId(@PathVariable sectionId: UUID): ResponseEntity<List<com.kapston.CTU_DB_API.domain.dto.response.QuarterPackageResponse>> {
        val packages = quarterPackageService.getQuarterPackagesBySectionId(sectionId)
        return ResponseEntity.ok(packages)
    }

    @GetMapping("/adviser/{adviserId}")
    fun getQuarterPackagesByAdviserId(@PathVariable adviserId: UUID): ResponseEntity<List<com.kapston.CTU_DB_API.domain.dto.response.QuarterPackageResponse>> {
        val packages = quarterPackageService.getQuarterPackagesByAdviserId(adviserId)
        return ResponseEntity.ok(packages)
    }

    @GetMapping("/status/{status}")
    fun getQuarterPackagesByStatus(@PathVariable status: String): ResponseEntity<List<com.kapston.CTU_DB_API.domain.dto.response.QuarterPackageResponse>> {
        val packages = quarterPackageService.getQuarterPackagesByStatus(status)
        return ResponseEntity.ok(packages)
    }

    @PostMapping
    fun createQuarterPackage(
        @RequestParam sectionId: UUID,
        @RequestParam quarter: String
    ): ResponseEntity<com.kapston.CTU_DB_API.domain.dto.response.QuarterPackageResponse> {
        val quarterPackage = quarterPackageService.createQuarterPackage(sectionId, quarter)
        return ResponseEntity.ok(quarterPackage)
    }

    @PostMapping("/{id}/submit")
    fun submitQuarterPackage(@PathVariable id: UUID): ResponseEntity<com.kapston.CTU_DB_API.domain.dto.response.QuarterPackageResponse> {
        val quarterPackage = quarterPackageService.submitQuarterPackage(id)
        return ResponseEntity.ok(quarterPackage)
    }

    @PutMapping("/{id}/status")
    fun updateQuarterPackageStatus(
        @PathVariable id: UUID,
        @RequestParam status: String
    ): ResponseEntity<com.kapston.CTU_DB_API.domain.dto.response.QuarterPackageResponse> {
        val quarterPackage = quarterPackageService.updateQuarterPackageStatus(id, status)
        return ResponseEntity.ok(quarterPackage)
    }

    @PostMapping("/{id}/forward-to-admin")
    fun forwardQuarterPackageToAdmin(@PathVariable id: UUID): ResponseEntity<com.kapston.CTU_DB_API.domain.dto.response.QuarterPackageResponse> {
        val quarterPackage = adviserService.forwardQuarterPackageToAdmin(id)
        return ResponseEntity.ok(quarterPackage)
    }

    @PostMapping("/{id}/return")
    fun returnQuarterPackage(
        @PathVariable id: UUID,
        @RequestBody remarks: String
    ): ResponseEntity<com.kapston.CTU_DB_API.domain.dto.response.QuarterPackageResponse> {
        val quarterPackage = quarterPackageService.returnQuarterPackage(id, remarks)
        return ResponseEntity.ok(quarterPackage)
    }

    @DeleteMapping("/{id}")
    fun deleteQuarterPackage(@PathVariable id: UUID): ResponseEntity<Void> {
        quarterPackageService.deleteQuarterPackage(id)
        return ResponseEntity.noContent().build()
    }
}
