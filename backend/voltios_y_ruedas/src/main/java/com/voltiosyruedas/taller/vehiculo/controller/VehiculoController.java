package com.voltiosyruedas.taller.vehiculo.controller;

import com.voltiosyruedas.taller.auth.entity.Usuario;
import com.voltiosyruedas.taller.auth.security.SecurityUtils;
import com.voltiosyruedas.taller.vehiculo.dto.VehiculoRequest;
import com.voltiosyruedas.taller.vehiculo.dto.VehiculoResponse;
import com.voltiosyruedas.taller.vehiculo.entity.Vehiculo;
import com.voltiosyruedas.taller.vehiculo.service.VehiculoService;
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
@RequestMapping("/api/vehiculos")
@RequiredArgsConstructor
public class VehiculoController {

    private final VehiculoService vehiculoService;

    /**
     * Listado completo: solo staff. El cliente usa /mis-vehiculos.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER', 'MECANICO')")
    public ResponseEntity<Page<VehiculoResponse>> listar(Pageable pageable) {
        Page<VehiculoResponse> response = vehiculoService.listar(pageable)
                .map(vehiculoService::mapearRespuesta);
        return ResponseEntity.ok(response);
    }

    /**
     * El cliente autenticado lista sus propios vehiculos.
     */
    @GetMapping("/mis-vehiculos")
    @PreAuthorize("hasAnyRole('CLIENTE', 'ADMIN', 'JEFE_TALLER', 'MECANICO')")
    public ResponseEntity<List<VehiculoResponse>> misVehiculos(Authentication authentication) {
        Usuario usuario = SecurityUtils.requerirUsuario(authentication);
        List<VehiculoResponse> response = vehiculoService.listarPorCliente(usuario).stream()
                .map(vehiculoService::mapearRespuesta)
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER', 'MECANICO', 'CLIENTE')")
    public ResponseEntity<VehiculoResponse> obtenerPorId(@PathVariable Long id, Authentication authentication) {
        Vehiculo vehiculo = vehiculoService.obtenerPorId(id);
        Usuario usuario = SecurityUtils.requerirUsuario(authentication);
        boolean esStaff = usuario.getRol() != null
                && List.of("ADMIN", "JEFE_TALLER", "MECANICO").contains(usuario.getRol().getNombre());
        boolean esDueno = vehiculo.getCliente() != null && vehiculo.getCliente().getId().equals(usuario.getId());
        if (!esStaff && !esDueno) {
            throw new org.springframework.security.access.AccessDeniedException("No tiene permisos sobre este vehiculo");
        }
        return ResponseEntity.ok(vehiculoService.mapearRespuesta(vehiculo));
    }

    @GetMapping("/placa/{placa}")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER', 'MECANICO')")
    public ResponseEntity<VehiculoResponse> obtenerPorPlaca(@PathVariable String placa) {
        return ResponseEntity.ok(vehiculoService.mapearRespuesta(vehiculoService.obtenerPorPlaca(placa)));
    }

    /**
     * El cliente crea su propio vehiculo (clienteId se ignora, se usa el autenticado).
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('CLIENTE', 'ADMIN', 'JEFE_TALLER', 'MECANICO')")
    public ResponseEntity<VehiculoResponse> crear(@Valid @RequestBody VehiculoRequest request,
                                                   Authentication authentication) {
        Usuario usuario = SecurityUtils.requerirUsuario(authentication);
        boolean esStaff = usuario.getRol() != null
                && List.of("ADMIN", "JEFE_TALLER", "MECANICO").contains(usuario.getRol().getNombre());
        Vehiculo vehiculo = esStaff
                ? vehiculoService.crearComoStaff(request)
                : vehiculoService.crearComoCliente(usuario, request);
        return ResponseEntity.ok(vehiculoService.mapearRespuesta(vehiculo));
    }

    /**
     * Cliente puede actualizar solo sus vehiculos. Staff puede asignar cliente o cambiar estado.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER', 'MECANICO', 'CLIENTE')")
    public ResponseEntity<VehiculoResponse> actualizar(@PathVariable Long id,
                                                        @Valid @RequestBody VehiculoRequest request,
                                                        Authentication authentication) {
        Usuario usuario = SecurityUtils.requerirUsuario(authentication);
        Vehiculo vehiculo = vehiculoService.actualizar(usuario, id, request);
        return ResponseEntity.ok(vehiculoService.mapearRespuesta(vehiculo));
    }

    /**
     * Cambiar estado del vehiculo: solo staff (EN_TALLER, LISTO, ENTREGADO, etc.).
     */
    @PutMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('ADMIN', 'JEFE_TALLER', 'MECANICO')")
    public ResponseEntity<VehiculoResponse> cambiarEstado(@PathVariable Long id,
                                                           @RequestParam String estado,
                                                           Authentication authentication) {
        Usuario usuario = SecurityUtils.requerirUsuario(authentication);
        Vehiculo vehiculo = vehiculoService.cambiarEstado(usuario, id, estado);
        return ResponseEntity.ok(vehiculoService.mapearRespuesta(vehiculo));
    }

    /**
     * Eliminar: solo ADMIN. El cliente no puede eliminar vehiculos.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id, Authentication authentication) {
        Usuario usuario = SecurityUtils.requerirUsuario(authentication);
        vehiculoService.eliminar(usuario, id);
        return ResponseEntity.noContent().build();
    }
}
