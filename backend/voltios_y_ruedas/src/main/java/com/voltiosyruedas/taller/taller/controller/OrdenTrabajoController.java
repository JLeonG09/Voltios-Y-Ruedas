package com.voltiosyruedas.taller.taller.controller;

import com.voltiosyruedas.taller.auditoria.service.AuditService;
import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.auth.security.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import com.voltiosyruedas.taller.notificaciones.service.NotificacionService;
import com.voltiosyruedas.taller.taller.dto.OrdenTrabajoRequest;
import com.voltiosyruedas.taller.taller.dto.OrdenTrabajoResponse;
import com.voltiosyruedas.taller.taller.dto.RepuestoOrdenRequest;
import com.voltiosyruedas.taller.taller.entity.Bitacora;
import com.voltiosyruedas.taller.taller.entity.OrdenTrabajo;
import com.voltiosyruedas.taller.taller.service.OrdenTrabajoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ordenes")
@RequiredArgsConstructor
public class OrdenTrabajoController {

    private static final Logger logger = LoggerFactory.getLogger(OrdenTrabajoController.class);

    private final OrdenTrabajoService ordenTrabajoService;
    private final NotificacionService notificacionService;
    private final AuditService auditService;

    /**
     * Listado completo: solo staff.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER', 'MECANICO')")
    public ResponseEntity<Page<OrdenTrabajoResponse>> listar(Pageable pageable) {
        Page<OrdenTrabajoResponse> response = ordenTrabajoService.listar(pageable)
                .map(o -> ordenTrabajoService.mapearRespuesta(o, false));
        return ResponseEntity.ok(response);
    }

    /**
     * Mis ordenes (cliente autenticado): ve sus propias ordenes.
     */
    @GetMapping("/mis-ordenes")
    @PreAuthorize("hasAnyRole('CLIENTE', 'ADMIN', 'JEFE_TALLER', 'MECANICO')")
    public ResponseEntity<List<OrdenTrabajoResponse>> misOrdenes(Authentication authentication) {
        Usuario usuario = SecurityUtils.requerirUsuario(authentication);
        return ResponseEntity.ok(
                ordenTrabajoService.listarPorCliente(usuario).stream()
                        .map(o -> ordenTrabajoService.mapearRespuesta(o, false))
                        .toList()
        );
    }

    /**
     * Mi historial completo (cliente autenticado): incluye bitacora y facturacion.
     */
    @GetMapping("/mi-historial")
    @PreAuthorize("hasAnyRole('CLIENTE', 'ADMIN', 'JEFE_TALLER', 'MECANICO')")
    public ResponseEntity<List<OrdenTrabajoResponse>> miHistorial(Authentication authentication) {
        Usuario usuario = SecurityUtils.requerirUsuario(authentication);
        return ResponseEntity.ok(
                ordenTrabajoService.listarPorCliente(usuario).stream()
                        .map(o -> ordenTrabajoService.mapearRespuesta(o, true))
                        .toList()
        );
    }

    @GetMapping("/mecanico/{mecanicoId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER', 'MECANICO')")
    public ResponseEntity<List<OrdenTrabajoResponse>> ordenesPorMecanico(@PathVariable Long mecanicoId) {
        Usuario mecanico = new Usuario();
        mecanico.setId(mecanicoId);
        return ResponseEntity.ok(
                ordenTrabajoService.listarPorMecanico(mecanico).stream()
                        .map(o -> ordenTrabajoService.mapearRespuesta(o, false))
                        .toList()
        );
    }

    @GetMapping("/estado/{estado}")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER', 'MECANICO')")
    public ResponseEntity<List<OrdenTrabajoResponse>> ordenesPorEstado(@PathVariable String estado) {
        return ResponseEntity.ok(
                ordenTrabajoService.listarPorEstado(estado).stream()
                        .map(o -> ordenTrabajoService.mapearRespuesta(o, false))
                        .toList()
        );
    }

    /**
     * Detalle de una orden. Cliente solo si es dueno.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER', 'MECANICO', 'CLIENTE')")
    public ResponseEntity<OrdenTrabajoResponse> obtenerPorId(@PathVariable Long id, Authentication authentication) {
        OrdenTrabajo orden = ordenTrabajoService.obtenerPorId(id);
        validarAcceso(authentication, orden);
        return ResponseEntity.ok(ordenTrabajoService.mapearRespuesta(orden, true));
    }

    @GetMapping("/numero/{numeroOrden}")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER', 'MECANICO', 'CLIENTE')")
    public ResponseEntity<OrdenTrabajoResponse> obtenerPorNumeroOrden(@PathVariable String numeroOrden,
                                                                       Authentication authentication) {
        OrdenTrabajo orden = ordenTrabajoService.obtenerPorNumeroOrden(numeroOrden);
        validarAcceso(authentication, orden);
        return ResponseEntity.ok(ordenTrabajoService.mapearRespuesta(orden, true));
    }

    /**
     * Crear orden: solo staff.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER', 'MECANICO')")
    public ResponseEntity<OrdenTrabajoResponse> crear(@Valid @RequestBody OrdenTrabajoRequest request,
                                                      Authentication authentication) {
        Usuario usuario = SecurityUtils.requerirUsuario(authentication);
        OrdenTrabajo orden = ordenTrabajoService.crear(usuario, request);
        notificarClienteSeguro(orden, "Orden de trabajo creada",
                "Su orden " + orden.getNumeroOrden() + " ha sido registrada", "orden");
        auditService.registrar("CREAR_ORDEN", "ORDEN_TRABAJO", orden.getId(),
                "Creada la orden " + orden.getNumeroOrden() + " por " + usuario.getEmail());
        return ResponseEntity.ok(ordenTrabajoService.mapearRespuesta(orden, true));
    }

    /**
     * Actualizar orden: solo staff.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER', 'MECANICO')")
    public ResponseEntity<OrdenTrabajoResponse> actualizar(@PathVariable Long id,
                                                           @Valid @RequestBody OrdenTrabajoRequest request,
                                                           Authentication authentication) {
        Usuario usuario = SecurityUtils.requerirUsuario(authentication);
        OrdenTrabajo orden = ordenTrabajoService.actualizar(usuario, id, request);
        return ResponseEntity.ok(ordenTrabajoService.mapearRespuesta(orden, true));
    }

    /**
     * Cambiar estado: solo staff.
     */
    @PutMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER', 'MECANICO')")
    public ResponseEntity<OrdenTrabajoResponse> cambiarEstado(@PathVariable Long id,
                                                              @RequestParam String estado,
                                                              Authentication authentication) {
        Usuario usuario = SecurityUtils.requerirUsuario(authentication);
        OrdenTrabajo orden = ordenTrabajoService.cambiarEstado(usuario, id, estado);
        notificarClienteSeguro(orden, "Estado de orden actualizado",
                "Su orden " + orden.getNumeroOrden() + " cambió a " + estado, "orden");
        auditService.registrar("CAMBIO_ESTADO_ORDEN", "ORDEN_TRABAJO", id,
                "Estado cambiado a " + estado + " por " + usuario.getEmail());
        return ResponseEntity.ok(ordenTrabajoService.mapearRespuesta(orden, true));
    }

    /**
     * Eliminar orden: solo ADMIN.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id, Authentication authentication) {
        Usuario usuario = SecurityUtils.requerirUsuario(authentication);
        ordenTrabajoService.eliminar(usuario, id);
        auditService.registrar("ELIMINAR_ORDEN", "ORDEN_TRABAJO", id,
                "Orden eliminada por " + usuario.getEmail());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/repuestos")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER', 'MECANICO')")
    public ResponseEntity<Void> agregarRepuesto(@PathVariable Long id,
                                                 @Valid @RequestBody RepuestoOrdenRequest request,
                                                 Authentication authentication) {
        Usuario usuario = SecurityUtils.requerirUsuario(authentication);
        ordenTrabajoService.agregarRepuesto(usuario, id, request);
        auditService.registrar("AGREGAR_REPUESTO", "ORDEN_TRABAJO", id,
                "Repuesto agregado por " + usuario.getEmail());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/repuestos/{inventarioId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER', 'MECANICO')")
    public ResponseEntity<Void> quitarRepuesto(@PathVariable Long id,
                                                @PathVariable Long inventarioId,
                                                Authentication authentication) {
        Usuario usuario = SecurityUtils.requerirUsuario(authentication);
        ordenTrabajoService.quitarRepuesto(usuario, id, inventarioId);
        auditService.registrar("QUITAR_REPUESTO", "ORDEN_TRABAJO", id,
                "Repuesto retirado por " + usuario.getEmail());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/bitacora")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER', 'MECANICO', 'CLIENTE')")
    public ResponseEntity<List<com.voltiosyruedas.taller.taller.dto.BitacoraResponse>> obtenerBitacora(
            @PathVariable Long id, Authentication authentication) {
        OrdenTrabajo orden = ordenTrabajoService.obtenerPorId(id);
        validarAcceso(authentication, orden);
        List<Bitacora> bitacoras = ordenTrabajoService.obtenerBitacora(id);
        return ResponseEntity.ok(bitacoras.stream().map(ordenTrabajoService::mapBitacora).toList());
    }

    /**
     * Historial completo de todas las ordenes (staff, para facturacion y reportes).
     */
    @GetMapping("/historial")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER')")
    public ResponseEntity<List<OrdenTrabajoResponse>> historial(Pageable pageable) {
        Page<OrdenTrabajo> page = ordenTrabajoService.listar(pageable);
        return ResponseEntity.ok(page.stream()
                .map(o -> ordenTrabajoService.mapearRespuesta(o, true))
                .toList());
    }

    private void validarAcceso(Authentication authentication, OrdenTrabajo orden) {
        Usuario usuario = SecurityUtils.requerirUsuario(authentication);
        String rol = usuario.getRol() != null ? usuario.getRol().getNombre() : "";
        boolean esStaff = List.of("ADMIN", "JEFE_TALLER", "MECANICO").contains(rol);
        boolean esDueno = orden.getCliente() != null && orden.getCliente().getId().equals(usuario.getId());
        if (!esStaff && !esDueno) {
            throw new AccessDeniedException("No tiene permisos sobre esta orden");
        }
    }

    private void notificarClienteSeguro(OrdenTrabajo orden, String titulo, String mensaje, String tipo) {
        try {
            if (orden != null && orden.getCliente() != null && orden.getCliente().getId() != null) {
                notificacionService.crear(orden.getCliente().getId(), titulo, mensaje, tipo);
            }
        } catch (Exception e) {
            logger.warn("No se pudo notificar al cliente de la orden {}",
                    orden != null ? orden.getNumeroOrden() : "?");
        }
    }
}
