package com.voltiosyruedas.taller.reservas.controller;

import com.voltiosyruedas.taller.auditoria.service.AuditService;
import com.voltiosyruedas.taller.auth.entity.Usuario;
import org.springframework.security.access.AccessDeniedException;
import com.voltiosyruedas.taller.notificaciones.service.NotificacionService;
import com.voltiosyruedas.taller.reservas.dto.ReservaRequest;
import com.voltiosyruedas.taller.reservas.dto.ReservaResponse;
import com.voltiosyruedas.taller.reservas.entity.Reserva;
import com.voltiosyruedas.taller.reservas.service.ReservaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/reservas")
@RequiredArgsConstructor
public class ReservaController {

    private static final List<String> ESTADOS_NO_EDITABLES = List.of("CANCELADA", "COMPLETADA");

    private final ReservaService reservaService;
    private final NotificacionService notificacionService;
    private final AuditService auditService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER', 'MECANICO')")
    public ResponseEntity<Page<ReservaResponse>> listar(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String estado,
            Pageable pageable) {
        Page<ReservaResponse> respuesta = reservaService.listar(pageable, search, estado)
                .map(reservaService::toResponse);
        return ResponseEntity.ok(respuesta);
    }

    @GetMapping("/mis-reservas")
    @PreAuthorize("hasAnyRole('CLIENTE', 'ADMIN', 'JEFE_TALLER', 'MECANICO')")
    public ResponseEntity<List<ReservaResponse>> misReservas(Authentication authentication) {
        Usuario usuario = (Usuario) authentication.getPrincipal();
        List<ReservaResponse> respuesta = reservaService.listarPorCliente(usuario).stream()
                .map(reservaService::toResponse)
                .toList();
        return ResponseEntity.ok(respuesta);
    }

    @GetMapping("/fecha")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER', 'MECANICO')")
    public ResponseEntity<List<ReservaResponse>> listarPorFecha(
            @RequestParam LocalDateTime inicio,
            @RequestParam LocalDateTime fin) {
        List<ReservaResponse> respuesta = reservaService.listarPorFecha(inicio, fin).stream()
                .map(reservaService::toResponse)
                .toList();
        return ResponseEntity.ok(respuesta);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER', 'MECANICO', 'CLIENTE')")
    public ResponseEntity<ReservaResponse> obtenerPorId(@PathVariable Long id, Authentication authentication) {
        Reserva reserva = reservaService.obtenerPorId(id);
        validarAcceso(authentication, reserva);
        return ResponseEntity.ok(reservaService.toResponse(reserva));
    }

    /**
     * Crear reserva: cliente la crea para si mismo. Staff puede crearla para cualquier cliente.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('CLIENTE', 'ADMIN', 'JEFE_TALLER', 'MECANICO')")
    public ResponseEntity<ReservaResponse> crear(Authentication authentication, @Valid @RequestBody ReservaRequest request) {
        Usuario usuario = (Usuario) authentication.getPrincipal();
        Reserva creada = reservaService.crear(usuario, request);
        notificacionService.notificarAStaff("Nueva reserva",
                usuario.getNombreCompleto() + " ha solicitado una cita", "reserva");
        auditService.registrar("CREAR_RESERVA", "RESERVA", creada.getId(),
                "Nueva reserva creada por " + usuario.getEmail());
        return ResponseEntity.ok(reservaService.toResponse(creada));
    }

    /**
     * Actualizar reserva: staff o el cliente dueño (salvo estados no editables).
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CLIENTE', 'ADMIN', 'JEFE_TALLER', 'MECANICO')")
    public ResponseEntity<ReservaResponse> actualizar(@PathVariable Long id,
            Authentication authentication, @Valid @RequestBody ReservaRequest request) {
        validarAccesoEdicion(authentication, id);
        Reserva actualizada = reservaService.actualizar(id, request);
        auditService.registrar("ACTUALIZAR_RESERVA", "RESERVA", id, "Reserva modificada");
        return ResponseEntity.ok(reservaService.toResponse(actualizada));
    }

    @PutMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER', 'MECANICO')")
    public ResponseEntity<ReservaResponse> cambiarEstado(@PathVariable Long id, @RequestParam String estado) {
        Reserva actualizada = reservaService.cambiarEstado(id, estado);
        auditService.registrar("CAMBIO_ESTADO_RESERVA", "RESERVA", id, "Estado cambiado a " + estado);
        return ResponseEntity.ok(reservaService.toResponse(actualizada));
    }

    /**
     * Cancelar reserva: el dueno o el staff.
     */
    @PutMapping("/{id}/cancelar")
    @PreAuthorize("hasAnyRole('CLIENTE', 'ADMIN', 'JEFE_TALLER', 'MECANICO')")
    public ResponseEntity<Void> cancelar(@PathVariable Long id, Authentication authentication) {
        Reserva reserva = reservaService.obtenerPorId(id);
        validarAcceso(authentication, reserva);
        reservaService.cancelar(id);
        auditService.registrar("CANCELAR_RESERVA", "RESERVA", id, "Reserva cancelada");
        return ResponseEntity.ok().build();
    }

    /**
     * Eliminar reserva: solo staff.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        reservaService.eliminar(id);
        auditService.registrar("ELIMINAR_RESERVA", "RESERVA", id, "Reserva eliminada");
        return ResponseEntity.noContent().build();
    }

    private void validarAcceso(Authentication authentication, Reserva reserva) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Usuario)) {
            return;
        }
        Usuario usuario = (Usuario) authentication.getPrincipal();
        String rol = usuario.getRol() != null ? usuario.getRol().getNombre() : "";
        boolean esStaff = List.of("ADMIN", "JEFE_TALLER", "MECANICO").contains(rol);
        boolean esDueno = reserva.getCliente() != null && reserva.getCliente().getId().equals(usuario.getId());
        if (!esStaff && !esDueno) {
            throw new AccessDeniedException("No tiene permisos sobre esta reserva");
        }
    }

    private void validarAccesoEdicion(Authentication authentication, Long id) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Usuario)) {
            return;
        }
        Usuario usuario = (Usuario) authentication.getPrincipal();
        String rol = usuario.getRol() != null ? usuario.getRol().getNombre() : "";
        boolean esStaff = List.of("ADMIN", "JEFE_TALLER", "MECANICO").contains(rol);
        if (esStaff) {
            return;
        }
        Reserva reserva = reservaService.obtenerPorId(id);
        boolean esDueno = reserva.getCliente() != null && reserva.getCliente().getId().equals(usuario.getId());
        if (!esDueno) {
            throw new AccessDeniedException("No tiene permisos sobre esta reserva");
        }
        if (ESTADOS_NO_EDITABLES.contains(reserva.getEstado())) {
            throw new IllegalArgumentException("No se puede modificar una reserva cancelada o completada");
        }
    }
}
