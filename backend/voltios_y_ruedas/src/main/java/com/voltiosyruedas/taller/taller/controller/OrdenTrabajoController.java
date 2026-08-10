package com.voltiosyruedas.taller.taller.controller;

import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.taller.dto.BitacoraResponse;
import com.voltiosyruedas.taller.taller.dto.OrdenTrabajoRequest;
import com.voltiosyruedas.taller.taller.dto.OrdenTrabajoResponse;
import com.voltiosyruedas.taller.taller.dto.RepuestoOrdenRequest;
import com.voltiosyruedas.taller.taller.entity.OrdenTrabajo;
import com.voltiosyruedas.taller.taller.service.OrdenTrabajoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ordenes")
@RequiredArgsConstructor
public class OrdenTrabajoController {

    private final OrdenTrabajoService ordenTrabajoService;

    @GetMapping
    public ResponseEntity<Page<OrdenTrabajo>> listar(Pageable pageable) {
        return ResponseEntity.ok(ordenTrabajoService.listar(pageable));
    }

    @GetMapping("/mis-ordenes")
    public ResponseEntity<List<OrdenTrabajo>> misOrdenes(Authentication authentication) {
        Usuario usuario = (Usuario) authentication.getPrincipal();
        return ResponseEntity.ok(ordenTrabajoService.listarPorCliente(usuario));
    }

    @GetMapping("/mecanico/{mecanicoId}")
    public ResponseEntity<List<OrdenTrabajo>> ordenesPorMecanico(@PathVariable Long mecanicoId) {
        Usuario mecanico = new Usuario();
        mecanico.setId(mecanicoId);
        return ResponseEntity.ok(ordenTrabajoService.listarPorMecanico(mecanico));
    }

    @GetMapping("/estado/{estado}")
    public ResponseEntity<List<OrdenTrabajo>> ordenesPorEstado(@PathVariable String estado) {
        return ResponseEntity.ok(ordenTrabajoService.listarPorEstado(estado));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrdenTrabajo> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ordenTrabajoService.obtenerPorId(id));
    }

    @GetMapping("/numero/{numeroOrden}")
    public ResponseEntity<OrdenTrabajo> obtenerPorNumeroOrden(@PathVariable String numeroOrden) {
        return ResponseEntity.ok(ordenTrabajoService.obtenerPorNumeroOrden(numeroOrden));
    }

    @PostMapping
    public ResponseEntity<OrdenTrabajo> crear(@Valid @RequestBody OrdenTrabajoRequest request) {
        return ResponseEntity.ok(ordenTrabajoService.crear(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrdenTrabajo> actualizar(@PathVariable Long id, @Valid @RequestBody OrdenTrabajoRequest request) {
        return ResponseEntity.ok(ordenTrabajoService.actualizar(id, request));
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<OrdenTrabajo> cambiarEstado(@PathVariable Long id, @RequestParam String estado) {
        return ResponseEntity.ok(ordenTrabajoService.cambiarEstado(id, estado));
    }

    @PostMapping("/{id}/repuestos")
    public ResponseEntity<Void> agregarRepuesto(@PathVariable Long id, @Valid @RequestBody RepuestoOrdenRequest request) {
        ordenTrabajoService.agregarRepuesto(id, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/repuestos/{inventarioId}")
    public ResponseEntity<Void> quitarRepuesto(@PathVariable Long id, @PathVariable Long inventarioId) {
        ordenTrabajoService.quitarRepuesto(id, inventarioId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/bitacora")
    public ResponseEntity<List<BitacoraResponse>> obtenerBitacora(@PathVariable Long id) {
        // Map entities to response DTOs
        return ResponseEntity.ok(ordenTrabajoService.obtenerBitacora(id).stream()
                .map(this::mapToResponse)
                .toList());
    }

    private BitacoraResponse mapToResponse(com.voltiosyruedas.taller.taller.entity.Bitacora bitacora) {
        return BitacoraResponse.builder()
                .id(bitacora.getId())
                .ordenTrabajoId(bitacora.getOrdenTrabajo().getId())
                .usuario(com.voltiosyruedas.taller.auth.dto.UsuarioResponse.builder()
                        .id(bitacora.getUsuario().getId())
                        .nombre(bitacora.getUsuario().getNombre())
                        .apellido(bitacora.getUsuario().getApellido())
                        .email(bitacora.getUsuario().getEmail())
                        .rol(com.voltiosyruedas.taller.auth.dto.UsuarioResponse.RolResponse.builder()
                                .id(bitacora.getUsuario().getRol().getId())
                                .nombre(bitacora.getUsuario().getRol().getNombre())
                                .build())
                        .build())
                .accion(bitacora.getAccion())
                .descripcion(bitacora.getDescripcion())
                .estadoAnterior(bitacora.getEstadoAnterior())
                .estadoNuevo(bitacora.getEstadoNuevo())
                .fecha(bitacora.getFecha())
                .build();
    }
}