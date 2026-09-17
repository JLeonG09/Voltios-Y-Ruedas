package com.voltiosyruedas.taller.auditoria.controller;

import com.voltiosyruedas.taller.auditoria.dto.AuditoriaResponse;
import com.voltiosyruedas.taller.auditoria.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auditoria")
@RequiredArgsConstructor
@Tag(name = "Auditoría", description = "Registro de actividad del sistema (solo administración)")
public class AuditoriaController {

    private final AuditService auditService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER')")
    @Operation(summary = "Listar registros de auditoría", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Page<AuditoriaResponse>> listar(Pageable pageable) {
        return ResponseEntity.ok(auditService.listar(pageable).map(auditService::toResponse));
    }
}
